const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Import debugger services
const NodeDebugger = require('../services/debuggers/nodeDebugger');
const JavaDebugger = require('../services/debuggers/javaDebugger');

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

// Helper function to extract class name from Java code
const extractJavaClassName = (code) => {
  // First try to find public class
  const publicMatch = code.match(/public\s+class\s+(\w+)/);
  if (publicMatch && publicMatch[1]) {
    return publicMatch[1];
  }
  
  // If no public class, try to find any class with main method
  const classWithMainMatch = code.match(/class\s+(\w+)[\s\S]*public\s+static\s+void\s+main/);
  if (classWithMainMatch && classWithMainMatch[1]) {
    return classWithMainMatch[1];
  }
  
  // If still no match, just get the first class
  const anyClassMatch = code.match(/class\s+(\w+)/);
  if (anyClassMatch && anyClassMatch[1]) {
    return anyClassMatch[1];
  }
  
  return null;
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
    const fileName = language === 'java' ? 
      `${extractJavaClassName(code) || sessionId}.${fileExt}` : 
      `${sessionId}.${fileExt}`;
    const filePath = path.join(TEMP_DIR, fileName);
    
    console.log(`Creating debug file at: ${filePath}`);
    
    // Write code to file
    await fs.writeFile(filePath, code);
    
    // Create appropriate debugger based on language
    let debuggerInstance;
    
    switch (language) {
      case 'javascript':
        debuggerInstance = new NodeDebugger();
        await debuggerInstance.start(filePath);
        break;
      case 'java':
        const className = extractJavaClassName(code) || path.basename(filePath, '.java');
        debuggerInstance = new JavaDebugger();
        await debuggerInstance.start(filePath, className);
        break;
      default:
        return res.status(400).json({ message: 'Unsupported language for debugging' });
    }
    
    // Store the debugger instance
    debugSessions.set(sessionId, {
      debugger: debuggerInstance,
      filePath,
      language,
      code
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
  
  if (!sessionId || line === undefined) {
    return res.status(400).json({ message: 'Session ID and line number are required' });
  }
  
  try {
    const session = debugSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Debug session not found' });
    }
    
    const result = await session.debugger.setBreakpoint(parseInt(line, 10));
    res.json({ 
      success: result,
      message: result ? 'Breakpoint set' : 'Failed to set breakpoint' 
    });
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
    
    const result = await session.debugger.continue();
    res.json({ 
      success: result,
      message: 'Execution continued' 
    });
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
    
    const result = await session.debugger.stepOver();
    res.json({ 
      success: result,
      message: 'Step completed' 
    });
  } catch (err) {
    console.error('Error stepping over:', err);
    res.status(500).json({ message: err.message });
  }
});

// Step into
router.post('/stepInto', async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID is required' });
  }
  
  try {
    const session = debugSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Debug session not found' });
    }
    
    const result = await session.debugger.stepInto();
    res.json({ 
      success: result,
      message: 'Step into completed' 
    });
  } catch (err) {
    console.error('Error stepping into:', err);
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

// Get current execution state
router.get('/state/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID is required' });
  }
  
  try {
    const session = debugSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Debug session not found' });
    }
    
    // Get current state from debugger
    const variables = await session.debugger.getVariables();
    const currentLine = session.debugger.currentLine || 0;
    
    res.json({ 
      currentLine,
      variables,
      language: session.language
    });
  } catch (err) {
    console.error('Error getting debug state:', err);
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
      
      // For Java, also clean up the class files
      if (session.language === 'java') {
        const className = extractJavaClassName(session.code);
        if (className) {
          const classFilePath = path.join(TEMP_DIR, `${className}.class`);
          try {
            await fs.unlink(classFilePath);
          } catch (err) {
            console.error(`Error deleting class file: ${err.message}`);
          }
        }
      }
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
