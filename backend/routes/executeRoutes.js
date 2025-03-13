const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Temporary directory for code execution
const TEMP_DIR = path.join(__dirname, '../temp');

// Create temp directory if it doesn't exist
(async () => {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    console.log(`Temp directory created at: ${TEMP_DIR}`);
    
    // Set proper permissions
    await fs.chmod(TEMP_DIR, 0o755);
    console.log('Temp directory permissions set');
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
    case 'csharp': return 'cs';
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

// Helper function to get file name based on language and code
const getFileName = (language, code) => {
  if (language === 'java') {
    const className = extractJavaClassName(code);
    if (className) {
      return `${className}.java`;
    }
  }
  return `${uuidv4()}.${getFileExtension(language)}`;
};

// Helper function to get execution command based on language
const getExecutionCommand = (language, filePath, code) => {
  switch (language) {
    case 'javascript': return `node ${filePath}`;
    case 'python': return `python ${filePath}`;
    case 'java': {
      const className = extractJavaClassName(code) || path.basename(filePath, '.java');
      const dir = path.dirname(filePath);
      console.log(`Java execution: className=${className}, dir=${dir}, filePath=${filePath}`);
      return `cd ${dir} && javac ${path.basename(filePath)} && java ${className}`;
    }
    case 'csharp': return `dotnet run ${filePath}`;
    case 'cpp': {
      const outputPath = filePath.replace('.cpp', '');
      return `g++ ${filePath} -o ${outputPath} && ${outputPath}`;
    }
    default: return '';
  }
};

// Execute code
router.post('/execute', async (req, res) => {
  const { code, language } = req.body;
  
  if (!code || !language) {
    return res.status(400).json({ message: 'Code and language are required' });
  }
  
  try {
    console.log(`Executing ${language} code...`);
    
    // Create a file name based on language and code content
    const fileName = getFileName(language, code);
    const filePath = path.join(TEMP_DIR, fileName);
    
    console.log(`Writing code to file: ${filePath}`);
    
    // Write code to file
    await fs.writeFile(filePath, code);
    
    // Execute code
    const command = getExecutionCommand(language, filePath, code);
    
    console.log(`Executing command: ${command}`);
    
    exec(command, { timeout: 15000 }, async (error, stdout, stderr) => {
      console.log('Execution completed');
      
      // Log results for debugging
      if (stdout) console.log('STDOUT:', stdout);
      if (stderr) console.log('STDERR:', stderr);
      if (error) console.error('ERROR:', error.message);
      
      // Clean up the file
      try {
        // For Java, also clean up the class files
        if (language === 'java') {
          const className = extractJavaClassName(code);
          if (className) {
            const classFilePath = path.join(TEMP_DIR, `${className}.class`);
            try {
              await fs.unlink(classFilePath);
              console.log(`Deleted class file: ${classFilePath}`);
            } catch (err) {
              console.error(`Error deleting class file: ${err.message}`);
            }
          }
          
          // Also try to clean up any other class files that might have been generated
          const fileBaseName = path.basename(filePath, '.java');
          const classFiles = await fs.readdir(TEMP_DIR);
          for (const file of classFiles) {
            if (file.endsWith('.class')) {
              try {
                await fs.unlink(path.join(TEMP_DIR, file));
                console.log(`Deleted additional class file: ${file}`);
              } catch (err) {
                console.error(`Error deleting additional class file: ${err.message}`);
              }
            }
          }
        }
        
        await fs.unlink(filePath);
        console.log(`Deleted source file: ${filePath}`);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
      
      if (error) {
        return res.status(400).json({ 
          output: stderr || error.message,
          error: true
        });
      }
      
      res.json({ output: stdout });
    });
  } catch (err) {
    console.error('Error in execute endpoint:', err);
    res.status(500).json({ message: err.message });
  }
});

// Debug code (simulate debugging)
router.post('/debug', async (req, res) => {
  const { code, language } = req.body;
  
  if (!code || !language) {
    return res.status(400).json({ message: 'Code and language are required' });
  }
  
  try {
    console.log(`Debugging ${language} code...`);
    
    // For demonstration purposes, we'll simulate debugging
    // In a real application, you would use a proper debugger for each language
    
    // Split code into lines
    const lines = code.split('\n');
    
    // Create a simple debug trace (this is just a simulation)
    const steps = [];
    const variables = {};
    
    // Simple parsing for demonstration (this would be much more complex in reality)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('//') || line.startsWith('#') || line.startsWith('/*')) continue;
      
      // Simulate variable assignments (very basic)
      if (language === 'javascript') {
        const varMatch = line.match(/(?:let|var|const)\s+(\w+)\s*=\s*(.+);/);
        if (varMatch) {
          const varName = varMatch[1];
          const varValue = varMatch[2].trim();
          
          // Very simple evaluation (unsafe, just for demo)
          let value;
          try {
            // This is unsafe and just for demonstration
            if (varValue.match(/^['"].*['"]$/)) {
              value = varValue.slice(1, -1); // Remove quotes
            } else if (varValue === 'true') {
              value = true;
            } else if (varValue === 'false') {
              value = false;
            } else if (!isNaN(varValue)) {
              value = Number(varValue);
            } else {
              value = `[${typeof varValue}]`;
            }
          } catch (e) {
            value = `[Error: ${e.message}]`;
          }
          
          variables[varName] = { 
            value, 
            type: typeof value 
          };
        }
      } else if (language === 'java') {
        // Basic Java variable detection (very simplified)
        const varMatch = line.match(/(?:int|String|boolean|double|float|long)\s+(\w+)\s*=\s*(.+);/);
        if (varMatch) {
          const varName = varMatch[1];
          const varValue = varMatch[2].trim();
          
          variables[varName] = {
            value: varValue,
            type: varMatch[0].split(' ')[0] // Get the type
          };
        }
      }
      
      steps.push({
        line: i + 1,
        statement: line,
        variables: { ...variables } // Clone current variables state
      });
    }
    
    res.json({ steps });
  } catch (err) {
    console.error('Error in debug endpoint:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;