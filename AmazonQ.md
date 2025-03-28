# Integrating Standard Debuggers into Dry-run-master

This document outlines how to enhance the Dry-run-master application by integrating standard debugging tools similar to those used by VSCode.

## Current Implementation

The application currently uses a custom debugging simulation that:
- Parses code and creates execution steps
- Simulates variable states and control flow
- Provides a visual debugging experience

## Proposed Integration with Standard Debuggers

### Language-Specific Debugger Tools

| Language   | Debugger Tool                | Integration Method |
|------------|------------------------------|-------------------|
| JavaScript | Node.js debugger / Chrome DevTools | Inspector Protocol |
| Python     | debugpy, pdb                 | Child Process + IPC |
| Java       | jdb (Java Debugger)          | Child Process + JDWP |
| C/C++      | gdb                          | Child Process + MI Interface |

### Implementation Plan

1. **Backend Changes**
   - Create language-specific debugger service modules
   - Implement debugger process management
   - Add communication layer between debuggers and server

2. **Frontend Enhancements**
   - Add breakpoint management UI
   - Enhance variable inspection
   - Support for watch expressions
   - Call stack visualization

## JavaScript Integration (Node.js Debugger)

```javascript
// backend/services/debuggers/nodeDebugger.js
const { spawn } = require('child_process');
const WebSocket = require('ws');

class NodeDebugger {
  constructor() {
    this.debugProcess = null;
    this.debuggerClient = null;
    this.port = 9229; // Default Node.js inspector port
  }

  async start(filePath) {
    // Launch Node.js with inspector
    this.debugProcess = spawn('node', ['--inspect-brk', filePath]);
    
    // Wait for debugger to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Connect to the debugger
    this.debuggerClient = new WebSocket(`ws://localhost:${this.port}/ws`);
    
    // Setup message handling
    this.debuggerClient.on('message', this.handleMessage.bind(this));
    
    return true;
  }
  
  async setBreakpoint(line) {
    // Send setBreakpoint command to inspector protocol
    // ...
  }
  
  async continue() {
    // Send continue command
    // ...
  }
  
  async stepOver() {
    // Send step over command
    // ...
  }
  
  async getVariables() {
    // Request variable state
    // ...
  }
  
  handleMessage(message) {
    // Process debugger messages
    // ...
  }
  
  stop() {
    if (this.debugProcess) {
      this.debugProcess.kill();
    }
    if (this.debuggerClient) {
      this.debuggerClient.close();
    }
  }
}

module.exports = NodeDebugger;
```

## Python Integration (debugpy)

```javascript
// backend/services/debuggers/pythonDebugger.js
const { spawn } = require('child_process');
const net = require('net');

class PythonDebugger {
  constructor() {
    this.debugProcess = null;
    this.client = null;
    this.port = 5678; // Default debugpy port
  }

  async start(filePath) {
    // Launch Python with debugpy
    this.debugProcess = spawn('python', [
      '-m', 'debugpy',
      '--listen', `localhost:${this.port}`,
      '--wait-for-client',
      filePath
    ]);
    
    // Connect to debugpy
    this.client = new net.Socket();
    await new Promise((resolve, reject) => {
      this.client.connect(this.port, 'localhost', resolve);
      this.client.on('error', reject);
    });
    
    // Setup message handling
    this.client.on('data', this.handleData.bind(this));
    
    return true;
  }
  
  // Implement debugger commands...
  
  stop() {
    if (this.debugProcess) {
      this.debugProcess.kill();
    }
    if (this.client) {
      this.client.end();
    }
  }
}

module.exports = PythonDebugger;
```

## Java Integration (jdb)

```javascript
// backend/services/debuggers/javaDebugger.js
const { spawn } = require('child_process');
const readline = require('readline');

class JavaDebugger {
  constructor() {
    this.debugProcess = null;
    this.rl = null;
  }

  async start(filePath, className) {
    // Compile with debug info
    await new Promise((resolve, reject) => {
      const javac = spawn('javac', ['-g', filePath]);
      javac.on('close', code => code === 0 ? resolve() : reject());
    });
    
    // Start jdb
    this.debugProcess = spawn('jdb', [className]);
    
    // Create interface for reading jdb output
    this.rl = readline.createInterface({
      input: this.debugProcess.stdout,
      output: this.debugProcess.stdin
    });
    
    // Setup event handlers
    this.setupEventHandlers();
    
    return true;
  }
  
  // Implement debugger commands and event handlers...
  
  stop() {
    if (this.debugProcess) {
      this.debugProcess.kill();
    }
    if (this.rl) {
      this.rl.close();
    }
  }
}

module.exports = JavaDebugger;
```

## C/C++ Integration (gdb)

```javascript
// backend/services/debuggers/cppDebugger.js
const { spawn } = require('child_process');
const readline = require('readline');

class CppDebugger {
  constructor() {
    this.debugProcess = null;
    this.rl = null;
  }

  async start(filePath, executablePath) {
    // Compile with debug info
    await new Promise((resolve, reject) => {
      const gcc = spawn('g++', ['-g', filePath, '-o', executablePath]);
      gcc.on('close', code => code === 0 ? resolve() : reject());
    });
    
    // Start gdb
    this.debugProcess = spawn('gdb', ['-q', executablePath]);
    
    // Create interface for reading gdb output
    this.rl = readline.createInterface({
      input: this.debugProcess.stdout,
      output: this.debugProcess.stdin
    });
    
    // Setup event handlers
    this.setupEventHandlers();
    
    return true;
  }
  
  // Implement debugger commands and event handlers...
  
  stop() {
    if (this.debugProcess) {
      this.debugProcess.kill();
    }
    if (this.rl) {
      this.rl.close();
    }
  }
}

module.exports = CppDebugger;
```

## Integration with Express Routes

```javascript
// backend/routes/debugRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const NodeDebugger = require('../services/debuggers/nodeDebugger');
const PythonDebugger = require('../services/debuggers/pythonDebugger');
const JavaDebugger = require('../services/debuggers/javaDebugger');
const CppDebugger = require('../services/debuggers/cppDebugger');

// Map to store active debugger sessions
const debugSessions = new Map();

// Temporary directory for code execution
const TEMP_DIR = path.join(__dirname, '../temp');

// Create temp directory if it doesn't exist
(async () => {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating temp directory:', err);
  }
})();

// Helper function to get file extension based on language
const getFileExtension = (language) => {
  switch (language) {
    case 'javascript': return 'js';
    case 'python': return 'py';
    case 'java': return 'java';
    case 'cpp': return 'cpp';
    default: return 'txt';
  }
};

// Start a debug session
router.post('/start', async (req, res) => {
  const { code, language } = req.body;
  
  if (!code || !language) {
    return res.status(400).json({ message: 'Code and language are required' });
  }
  
  try {
    // Generate a unique session ID
    const sessionId = uuidv4();
    
    // Create a file for the code
    const fileExt = getFileExtension(language);
    const fileName = `${sessionId}.${fileExt}`;
    const filePath = path.join(TEMP_DIR, fileName);
    
    // Write code to file
    await fs.writeFile(filePath, code);
    
    // Create appropriate debugger based on language
    let debugger;
    switch (language) {
      case 'javascript':
        debugger = new NodeDebugger();
        await debugger.start(filePath);
        break;
      case 'python':
        debugger = new PythonDebugger();
        await debugger.start(filePath);
        break;
      case 'java':
        const className = path.basename(filePath, '.java');
        debugger = new JavaDebugger();
        await debugger.start(filePath, className);
        break;
      case 'cpp':
        const execPath = path.join(TEMP_DIR, sessionId);
        debugger = new CppDebugger();
        await debugger.start(filePath, execPath);
        break;
      default:
        return res.status(400).json({ message: 'Unsupported language' });
    }
    
    // Store the debugger instance
    debugSessions.set(sessionId, {
      debugger,
      filePath,
      language
    });
    
    res.json({ 
      sessionId,
      message: 'Debug session started'
    });
  } catch (err) {
    console.error('Error starting debug session:', err);
    res.status(500).json({ message: err.message });
  }
});

// Set breakpoint
router.post('/breakpoint', async (req, res) => {
  const { sessionId, line } = req.body;
  
  if (!sessionId || !line) {
    return res.status(400).json({ message: 'Session ID and line number are required' });
  }
  
  try {
    const session = debugSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Debug session not found' });
    }
    
    await session.debugger.setBreakpoint(line);
    res.json({ message: 'Breakpoint set' });
  } catch (err) {
    console.error('Error setting breakpoint:', err);
    res.status(500).json({ message: err.message });
  }
});

// Continue execution
router.post('/continue', async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID is required' });
  }
  
  try {
    const session = debugSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Debug session not found' });
    }
    
    await session.debugger.continue();
    res.json({ message: 'Execution continued' });
  } catch (err) {
    console.error('Error continuing execution:', err);
    res.status(500).json({ message: err.message });
  }
});

// Step over
router.post('/step', async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID is required' });
  }
  
  try {
    const session = debugSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Debug session not found' });
    }
    
    await session.debugger.stepOver();
    res.json({ message: 'Step completed' });
  } catch (err) {
    console.error('Error stepping over:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get variables
router.get('/variables/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID is required' });
  }
  
  try {
    const session = debugSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Debug session not found' });
    }
    
    const variables = await session.debugger.getVariables();
    res.json({ variables });
  } catch (err) {
    console.error('Error getting variables:', err);
    res.status(500).json({ message: err.message });
  }
});

// End debug session
router.post('/end', async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID is required' });
  }
  
  try {
    const session = debugSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Debug session not found' });
    }
    
    // Stop the debugger
    session.debugger.stop();
    
    // Clean up the file
    try {
      await fs.unlink(session.filePath);
    } catch (err) {
      console.error('Error deleting file:', err);
    }
    
    // Remove the session
    debugSessions.delete(sessionId);
    
    res.json({ message: 'Debug session ended' });
  } catch (err) {
    console.error('Error ending debug session:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
```

## Required Dependencies

To implement these integrations, you'll need to add the following dependencies to your package.json:

```json
{
  "dependencies": {
    "ws": "^8.16.0",
    "net": "^1.0.2"
  },
  "devDependencies": {
    "debugpy": "^1.8.0"
  }
}
```

## Frontend Integration

You'll need to update your frontend components to work with these real debuggers. This includes:

1. Adding breakpoint management in the CodeEditor component
2. Updating the debugging controls to use the new API endpoints
3. Enhancing the variable display to show real-time values

## Installation Requirements

For the debuggers to work, users will need to have the following installed:

1. Node.js (for JavaScript debugging)
2. Python with debugpy (for Python debugging)
3. JDK with jdb (for Java debugging)
4. GCC/G++ and GDB (for C/C++ debugging)
