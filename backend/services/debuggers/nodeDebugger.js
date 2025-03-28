const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');

class NodeDebugger {
  constructor() {
    this.debugProcess = null;
    this.debuggerClient = null;
    this.port = 9229; // Default Node.js inspector port
    this.eventHandlers = {
      breakpointHit: [],
      stepComplete: [],
      variablesUpdated: [],
      output: []
    };
    this.variables = {};
    this.breakpoints = new Map();
    this.currentLine = 0;
    this.isRunning = false;
    this.scriptId = null;
    this.messageQueue = [];
    this.connected = false;
    this.messageId = 1;
    this.pendingRequests = new Map();
  }

  async start(filePath) {
    console.log(`Starting Node.js debugger for ${filePath}`);
    
    try {
      // Launch Node.js with inspector
      this.debugProcess = spawn('node', ['--inspect-brk', filePath]);
      
      // Log stdout and stderr
      this.debugProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log(`Node.js stdout: ${output}`);
        this._notifyListeners('output', {
          type: 'stdout',
          message: output
        });
      });
      
      this.debugProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        
        // Check for debugger listening message
        const match = output.match(/Debugger listening on (ws:\/\/[^:]+:(\d+)\/[^)]+)/);
        if (match) {
          this.port = parseInt(match[2], 10);
          console.log(`Debugger listening on port ${this.port}`);
        }
        
        console.log(`Node.js stderr: ${output}`);
        this._notifyListeners('output', {
          type: 'stderr',
          message: output
        });
      });
      
      // Wait for debugger to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Connect to the debugger
      await this._connectToInspector();
      
      return true;
    } catch (err) {
      console.error('Error starting Node.js debugger:', err);
      this.stop();
      throw err;
    }
  }
  
  async _connectToInspector() {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://localhost:${this.port}/ws`;
      console.log(`Connecting to Node.js inspector at ${wsUrl}`);
      
      this.debuggerClient = new WebSocket(wsUrl);
      
      this.debuggerClient.on('open', async () => {
        console.log('Connected to Node.js inspector');
        this.connected = true;
        
        try {
          // Enable debugging features
          await this._sendMessage('Runtime.enable');
          await this._sendMessage('Debugger.enable');
          
          // Get script ID
          const { result } = await this._sendMessage('Runtime.getIsolateId');
          console.log('Isolate ID:', result.id);
          
          // Set breakpoint on entry
          const scriptInfo = await this._sendMessage('Debugger.getScriptSource', {
            scriptId: '1' // Usually the main script has ID 1
          });
          
          this.scriptId = '1';
          console.log('Script ID:', this.scriptId);
          
          resolve();
        } catch (err) {
          console.error('Error during debugger initialization:', err);
          reject(err);
        }
      });
      
      this.debuggerClient.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this._handleMessage(message);
        } catch (err) {
          console.error('Error parsing debugger message:', err);
        }
      });
      
      this.debuggerClient.on('error', (err) => {
        console.error('WebSocket error:', err);
        reject(err);
      });
      
      this.debuggerClient.on('close', () => {
        console.log('Disconnected from Node.js inspector');
        this.connected = false;
      });
    });
  }
  
  _handleMessage(message) {
    console.log('Received message:', JSON.stringify(message).substring(0, 200) + '...');
    
    // Handle response to a request
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message);
      }
      return;
    }
    
    // Handle events
    if (message.method) {
      switch (message.method) {
        case 'Debugger.paused':
          this._handlePaused(message.params);
          break;
        
        case 'Debugger.resumed':
          console.log('Execution resumed');
          break;
        
        case 'Runtime.consoleAPICalled':
          this._handleConsoleOutput(message.params);
          break;
      }
    }
  }
  
  async _handlePaused(params) {
    console.log('Execution paused:', params.reason);
    
    // Get current location
    const topFrame = params.callFrames[0];
    const location = topFrame.location;
    
    // Update current line
    this.currentLine = location.lineNumber + 1; // Convert to 1-based line number
    console.log(`Stopped at line ${this.currentLine}`);
    
    // Get variables in scope
    await this._updateVariables(topFrame.scopeChain);
    
    // Notify listeners
    if (params.reason === 'other' || params.reason === 'ambiguous') {
      this._notifyListeners('stepComplete', {
        line: this.currentLine,
        variables: this.variables
      });
    } else if (params.reason === 'breakpoint') {
      this._notifyListeners('breakpointHit', {
        line: this.currentLine,
        variables: this.variables
      });
    }
  }
  
  async _updateVariables(scopeChain) {
    this.variables = {};
    
    for (const scope of scopeChain) {
      if (scope.type === 'local' || scope.type === 'global') {
        const { result } = await this._sendMessage('Runtime.getProperties', {
          objectId: scope.object.objectId,
          ownProperties: true
        });
        
        for (const prop of result) {
          if (prop.value && !prop.name.startsWith('__')) {
            this.variables[prop.name] = {
              value: this._formatValue(prop.value),
              type: prop.value.type
            };
          }
        }
      }
    }
    
    this._notifyListeners('variablesUpdated', {
      variables: this.variables
    });
  }
  
  _formatValue(value) {
    if (value.type === 'undefined') return 'undefined';
    if (value.type === 'null') return 'null';
    if (value.type === 'string') return `"${value.value}"`;
    if (value.type === 'number' || value.type === 'boolean') return value.value;
    if (value.type === 'object') return value.description || '[object]';
    if (value.type === 'function') return '[function]';
    return value.description || value.value || value.type;
  }
  
  _handleConsoleOutput(params) {
    const args = params.args.map(arg => this._formatValue(arg)).join(' ');
    console.log(`Console ${params.type}: ${args}`);
    
    this._notifyListeners('output', {
      type: params.type,
      message: args
    });
  }
  
  async _sendMessage(method, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        return reject(new Error('Not connected to debugger'));
      }
      
      const id = this.messageId++;
      const message = { id, method, params };
      
      this.pendingRequests.set(id, { resolve, reject });
      
      console.log('Sending message:', JSON.stringify(message).substring(0, 200) + '...');
      this.debuggerClient.send(JSON.stringify(message));
      
      // Set timeout to prevent hanging
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timed out: ${method}`));
        }
      }, 5000);
    });
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
      const { result } = await this._sendMessage('Debugger.setBreakpointByUrl', {
        lineNumber: line - 1, // Convert to 0-based line number
        urlRegex: '.*',
        columnNumber: 0
      });
      
      console.log(`Breakpoint set at line ${line}, ID: ${result.breakpointId}`);
      this.breakpoints.set(line, result.breakpointId);
      return true;
    } catch (err) {
      console.error('Error setting breakpoint:', err);
      return false;
    }
  }
  
  async continue() {
    try {
      await this._sendMessage('Debugger.resume');
      return true;
    } catch (err) {
      console.error('Error continuing execution:', err);
      return false;
    }
  }
  
  async stepOver() {
    try {
      await this._sendMessage('Debugger.stepOver');
      return true;
    } catch (err) {
      console.error('Error stepping over:', err);
      return false;
    }
  }
  
  async stepInto() {
    try {
      await this._sendMessage('Debugger.stepInto');
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
    if (this.debuggerClient && this.connected) {
      try {
        this.debuggerClient.close();
      } catch (err) {
        console.error('Error closing WebSocket connection:', err);
      }
    }
    
    if (this.debugProcess) {
      try {
        this.debugProcess.kill();
      } catch (err) {
        console.error('Error killing debug process:', err);
      }
    }
    
    this.isRunning = false;
  }
}

module.exports = NodeDebugger;
