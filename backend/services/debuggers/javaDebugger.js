const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');

class JavaDebugger {
  constructor() {
    this.debugProcess = null;
    this.rl = null;
    this.eventHandlers = {
      breakpointHit: [],
      stepComplete: [],
      variablesUpdated: [],
      output: []
    };
    this.variables = {};
    this.breakpoints = new Map();
    this.currentLine = 0;
    this.className = null;
    this.filePath = null;
    this.isRunning = false;
    this.commandQueue = [];
    this.processingCommand = false;
  }

  async start(filePath, className) {
    this.filePath = filePath;
    this.className = className || path.basename(filePath, '.java');
    
    console.log(`Starting Java debugger for ${this.className} (${filePath})`);
    
    try {
      // Compile with debug info
      console.log('Compiling Java code with debug info...');
      await this._compile();
      
      // Start jdb
      console.log('Starting JDB...');
      this.debugProcess = spawn('jdb', [this.className]);
      
      // Create interface for reading jdb output
      this.rl = readline.createInterface({
        input: this.debugProcess.stdout,
        output: process.stdout // For logging purposes
      });
      
      // Setup event handlers
      this._setupEventHandlers();
      
      // Wait for JDB to initialize
      await new Promise((resolve) => {
        const onInitialized = (line) => {
          if (line.includes('Initializing jdb')) {
            this.rl.removeListener('line', onInitialized);
            resolve();
          }
        };
        this.rl.on('line', onInitialized);
        
        // Add timeout in case JDB doesn't initialize properly
        setTimeout(() => {
          this.rl.removeListener('line', onInitialized);
          resolve();
        }, 3000);
      });
      
      // Set initial breakpoint at main method
      await this._queueCommand('stop in ' + this.className + '.main');
      
      // Run the program
      await this._queueCommand('run');
      
      this.isRunning = true;
      return true;
    } catch (err) {
      console.error('Error starting Java debugger:', err);
      this.stop();
      throw err;
    }
  }
  
  async _compile() {
    return new Promise((resolve, reject) => {
      const javac = spawn('javac', ['-g', this.filePath]);
      
      let stdoutData = '';
      let stderrData = '';
      
      javac.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });
      
      javac.stderr.on('data', (data) => {
        stderrData += data.toString();
      });
      
      javac.on('close', (code) => {
        if (code === 0) {
          console.log('Java compilation successful');
          resolve();
        } else {
          console.error(`Java compilation failed with code ${code}`);
          console.error('Stderr:', stderrData);
          reject(new Error(`Compilation failed: ${stderrData}`));
        }
      });
    });
  }
  
  _setupEventHandlers() {
    this.rl.on('line', (line) => {
      console.log(`JDB > ${line}`);
      
      // Handle breakpoint hit
      if (line.includes('Breakpoint hit:') || line.includes('Step completed:')) {
        const lineMatch = line.match(/line=(\d+)/);
        if (lineMatch && lineMatch[1]) {
          this.currentLine = parseInt(lineMatch[1], 10);
          console.log(`Stopped at line ${this.currentLine}`);
          
          // Get variables at this point
          this._getVariables().then(() => {
            // Notify listeners
            if (line.includes('Breakpoint hit:')) {
              this._notifyListeners('breakpointHit', {
                line: this.currentLine,
                variables: this.variables
              });
            } else {
              this._notifyListeners('stepComplete', {
                line: this.currentLine,
                variables: this.variables
              });
            }
            
            // Mark command as complete
            this.processingCommand = false;
            
            // Process next command if any
            setTimeout(() => this._processNextCommand(), 100);
          });
        }
      }
      
      // Handle variable output
      if (line.match(/^\s*\w+\s*=\s*.+$/)) {
        const varMatch = line.match(/^\s*(\w+)\s*=\s*(.+)$/);
        if (varMatch && varMatch[1] && varMatch[2]) {
          const varName = varMatch[1];
          const varValue = varMatch[2].trim();
          this.variables[varName] = {
            value: varValue,
            type: this._inferType(varValue)
          };
        }
      }
      
      // Handle command completion
      if (line.includes('VM Started:') || 
          line.includes('Set breakpoint') || 
          line.includes('Step completed') ||
          line.includes('Breakpoint hit')) {
        // Don't reset processing flag here, as we need to wait for variables
        // The flag will be reset after variables are processed
      }
      
      // Handle program exit
      if (line.includes('The application exited')) {
        this._notifyListeners('output', {
          type: 'info',
          message: 'Program execution completed'
        });
        this.isRunning = false;
        this.processingCommand = false;
        this._processNextCommand();
      }
      
      // Handle errors
      if (line.includes('Exception occurred') || line.startsWith('ERROR:')) {
        this._notifyListeners('output', {
          type: 'error',
          message: line
        });
        
        // Reset processing flag on error
        this.processingCommand = false;
        this._processNextCommand();
      }
    });
    
    this.debugProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      console.error(`JDB Error: ${message}`);
      this._notifyListeners('output', {
        type: 'error',
        message
      });
    });
    
    this.debugProcess.on('close', (code) => {
      console.log(`JDB process exited with code ${code}`);
      this.isRunning = false;
    });
  }
  
  async _sendCommand(command) {
    return new Promise((resolve) => {
      console.log(`Sending JDB command: ${command}`);
      this.debugProcess.stdin.write(command + '\n');
      
      // Add a small delay to ensure command is processed
      setTimeout(resolve, 100);
    });
  }
  
  _queueCommand(command) {
    return new Promise((resolve, reject) => {
      this.commandQueue.push({
        command,
        resolve,
        reject
      });
      
      if (!this.processingCommand) {
        this._processNextCommand();
      }
    });
  }
  
  _processNextCommand() {
    if (this.commandQueue.length === 0 || this.processingCommand) {
      return;
    }
    
    this.processingCommand = true;
    const { command, resolve, reject } = this.commandQueue.shift();
    
    try {
      this._sendCommand(command)
        .then(() => {
          // Wait for JDB to process the command
          return new Promise(r => setTimeout(r, 500));
        })
        .then(resolve)
        .catch(reject)
        .finally(() => {
          // Ensure processing flag is reset even if there's an error
          setTimeout(() => {
            this.processingCommand = false;
            this._processNextCommand(); // Process next command in queue
          }, 100);
        });
    } catch (err) {
      reject(err);
      this.processingCommand = false;
      this._processNextCommand();
    }
  }
  
  async _getVariables() {
    // Clear current variables
    this.variables = {};
    
    // Request local variables
    await this._sendCommand('locals');
    
    // Give JDB time to respond with variable values
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this._notifyListeners('variablesUpdated', {
      variables: this.variables
    });
    
    return this.variables;
  }
  
  _inferType(value) {
    if (value === 'null') return 'null';
    if (value === 'true' || value === 'false') return 'boolean';
    if (!isNaN(value)) return 'number';
    if (value.startsWith('"') && value.endsWith('"')) return 'string';
    if (value.includes('@')) return 'object';
    return 'unknown';
  }
  
  _notifyListeners(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  }
  
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
    return this;
  }
  
  async setBreakpoint(line) {
    if (this.breakpoints.has(line)) {
      return true; // Breakpoint already set
    }
    
    try {
      await this._queueCommand(`stop at ${this.className}:${line}`);
      this.breakpoints.set(line, true);
      return true;
    } catch (err) {
      console.error('Error setting breakpoint:', err);
      return false;
    }
  }
  
  async continue() {
    try {
      await this._queueCommand('cont');
      return true;
    } catch (err) {
      console.error('Error continuing execution:', err);
      return false;
    }
  }
  
  async stepOver() {
    try {
      await this._queueCommand('next');
      return true;
    } catch (err) {
      console.error('Error stepping over:', err);
      return false;
    }
  }
  
  async stepInto() {
    try {
      await this._queueCommand('step');
      return true;
    } catch (err) {
      console.error('Error stepping into:', err);
      return false;
    }
  }
  
  async getVariables() {
    return this.variables;
  }
  
  stop() {
    if (this.debugProcess) {
      // Send quit command to JDB
      try {
        this.debugProcess.stdin.write('quit\n');
      } catch (err) {
        console.error('Error sending quit command:', err);
      }
      
      // Kill the process after a short delay
      setTimeout(() => {
        try {
          this.debugProcess.kill();
        } catch (err) {
          console.error('Error killing debug process:', err);
        }
      }, 500);
    }
    
    if (this.rl) {
      this.rl.close();
    }
    
    this.isRunning = false;
  }
}

module.exports = JavaDebugger;
