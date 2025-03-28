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

// Debug code (simulate debugging with flow control)
router.post('/debug', async (req, res) => {
  const { code, language } = req.body;
  
  if (!code || !language) {
    return res.status(400).json({ message: 'Code and language are required' });
  }
  
  try {
    console.log(`Debugging ${language} code...`);
    
    // For demonstration purposes, we'll simulate debugging with flow control
    // In a real application, you would use a proper debugger for each language
    
    // Split code into lines
    const lines = code.split('\n');
    
    // Create a debug trace with proper flow control
    const executionSteps = [];
    const variables = {};
    
    // Track loop and conditional structures
    const controlStructures = [];
    
    // Function to analyze JavaScript code and generate execution flow
    const analyzeJavaScriptCode = () => {
      let lineIndex = 0;
      
      // Function to process a block of code (recursive)
      const processBlock = (endCondition) => {
        while (lineIndex < lines.length) {
          if (endCondition && endCondition(lines[lineIndex])) {
            return;
          }
          
          const line = lines[lineIndex].trim();
          lineIndex++;
          
          // Skip empty lines and comments
          if (!line || line.startsWith('//') || line.startsWith('/*')) {
            continue;
          }
          
          // Add this line to execution steps
          const currentLineNumber = lineIndex; // 1-based line number
          
          // Process variable declarations and assignments
          const varMatch = line.match(/(?:let|var|const)\s+(\w+)\s*=\s*(.+);/);
          if (varMatch) {
            const varName = varMatch[1];
            const varValue = varMatch[2].trim();
            
            // Simple evaluation (for demo purposes)
            let value;
            try {
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
          
          // Process assignment without declaration
          const assignMatch = line.match(/^(\w+)\s*=\s*(.+);/);
          if (assignMatch && !varMatch) {
            const varName = assignMatch[1];
            const varValue = assignMatch[2].trim();
            
            if (variables[varName]) {
              // Update existing variable
              variables[varName].value = varValue;
            }
          }
          
          // Handle if statements
          if (line.startsWith('if') && line.includes('{')) {
            // Extract condition for visualization
            const conditionMatch = line.match(/if\s*\((.*)\)/);
            const condition = conditionMatch ? conditionMatch[1] : 'unknown';
            
            // For demo, we'll assume the condition is true
            const isTrue = true; // In a real implementation, you would evaluate this
            
            executionSteps.push({
              line: currentLineNumber,
              statement: line,
              variables: { ...variables },
              controlType: 'if',
              condition,
              result: isTrue
            });
            
            // Process the if block
            if (isTrue) {
              processBlock(l => l.trim() === '}');
            } else {
              // Skip the if block
              let braceCount = 1;
              while (lineIndex < lines.length && braceCount > 0) {
                const skipLine = lines[lineIndex].trim();
                if (skipLine.includes('{')) braceCount++;
                if (skipLine.includes('}')) braceCount--;
                lineIndex++;
              }
              
              // Check for else
              if (lineIndex < lines.length && lines[lineIndex].trim().startsWith('else')) {
                // Process the else block
                lineIndex++;
                processBlock(l => l.trim() === '}');
              }
            }
          }
          // Handle for loops
          else if (line.startsWith('for') && line.includes('{')) {
            // Extract loop parameters for visualization
            const loopMatch = line.match(/for\s*\((.*);(.*);(.*)\)/);
            const initialization = loopMatch ? loopMatch[1].trim() : '';
            const condition = loopMatch ? loopMatch[2].trim() : '';
            const increment = loopMatch ? loopMatch[3].trim() : '';
            
            // Process initialization
            if (initialization.startsWith('let') || initialization.startsWith('var') || initialization.startsWith('const')) {
              const initVarMatch = initialization.match(/(?:let|var|const)\s+(\w+)\s*=\s*(.+)/);
              if (initVarMatch) {
                const varName = initVarMatch[1];
                const varValue = initVarMatch[2].trim();
                variables[varName] = { 
                  value: !isNaN(varValue) ? Number(varValue) : varValue,
                  type: !isNaN(varValue) ? 'number' : 'string'
                };
              }
            }
            
            // For demo purposes, we'll simulate 3 iterations of the loop
            const loopStartIndex = lineIndex;
            const loopBodyStart = lineIndex;
            
            // Record the loop start
            executionSteps.push({
              line: currentLineNumber,
              statement: line,
              variables: { ...variables },
              controlType: 'for-start',
              initialization,
              condition,
              increment
            });
            
            // Simulate 3 iterations (in a real implementation, you would evaluate the condition)
            for (let iteration = 0; iteration < 3; iteration++) {
              // Reset to beginning of loop body for each iteration
              lineIndex = loopBodyStart;
              
              // Process loop body
              processBlock(l => l.trim() === '}');
              
              // Simulate increment operation
              if (increment.includes('++')) {
                const varName = increment.replace('++', '').trim();
                if (variables[varName] && variables[varName].type === 'number') {
                  variables[varName].value += 1;
                }
              }
              
              // Add a step for the loop iteration end/condition check
              executionSteps.push({
                line: currentLineNumber,
                statement: `// Loop iteration ${iteration + 1} complete, checking condition: ${condition}`,
                variables: { ...variables },
                controlType: 'for-iteration',
                iteration: iteration + 1
              });
            }
            
            // Record the loop end
            executionSteps.push({
              line: lineIndex,
              statement: '} // end of for loop',
              variables: { ...variables },
              controlType: 'for-end'
            });
          }
          // Handle while loops
          else if (line.startsWith('while') && line.includes('{')) {
            // Extract condition for visualization
            const conditionMatch = line.match(/while\s*\((.*)\)/);
            const condition = conditionMatch ? conditionMatch[1] : 'unknown';
            
            // Record the loop start
            executionSteps.push({
              line: currentLineNumber,
              statement: line,
              variables: { ...variables },
              controlType: 'while-start',
              condition
            });
            
            const loopBodyStart = lineIndex;
            
            // Simulate 3 iterations (in a real implementation, you would evaluate the condition)
            for (let iteration = 0; iteration < 3; iteration++) {
              // Reset to beginning of loop body for each iteration
              lineIndex = loopBodyStart;
              
              // Process loop body
              processBlock(l => l.trim() === '}');
              
              // Add a step for the loop iteration end/condition check
              executionSteps.push({
                line: currentLineNumber,
                statement: `// Loop iteration ${iteration + 1} complete, checking condition: ${condition}`,
                variables: { ...variables },
                controlType: 'while-iteration',
                iteration: iteration + 1
              });
            }
            
            // Record the loop end
            executionSteps.push({
              line: lineIndex,
              statement: '} // end of while loop',
              variables: { ...variables },
              controlType: 'while-end'
            });
          }
          // Handle function declarations
          else if (line.startsWith('function') && line.includes('{')) {
            // Extract function name
            const funcMatch = line.match(/function\s+(\w+)/);
            const funcName = funcMatch ? funcMatch[1] : 'anonymous';
            
            executionSteps.push({
              line: currentLineNumber,
              statement: line,
              variables: { ...variables },
              controlType: 'function-declaration',
              name: funcName
            });
            
            // Skip the function body for now (we'll process it when it's called)
            let braceCount = 1;
            while (lineIndex < lines.length && braceCount > 0) {
              const skipLine = lines[lineIndex].trim();
              if (skipLine.includes('{')) braceCount++;
              if (skipLine.includes('}')) braceCount--;
              lineIndex++;
            }
          }
          // Handle function calls
          else if (line.match(/\w+\(\)/)) {
            const funcMatch = line.match(/(\w+)\(\)/);
            const funcName = funcMatch ? funcMatch[1] : 'unknown';
            
            executionSteps.push({
              line: currentLineNumber,
              statement: line,
              variables: { ...variables },
              controlType: 'function-call',
              name: funcName
            });
            
            // Find and process the function body
            const funcDefIndex = lines.findIndex(l => l.includes(`function ${funcName}`));
            if (funcDefIndex >= 0) {
              // Save current position
              const returnIndex = lineIndex;
              
              // Jump to function definition
              lineIndex = funcDefIndex + 1; // Skip the function declaration line
              
              // Process function body
              processBlock(l => l.trim() === '}');
              
              // Return to the calling point
              lineIndex = returnIndex;
            }
          }
          // Handle regular statements
          else {
            executionSteps.push({
              line: currentLineNumber,
              statement: line,
              variables: { ...variables }
            });
          }
        }
      };
      
      // Start processing from the beginning
      processBlock();
      
      return executionSteps;
    };
    
    // Generate execution steps based on language
    let steps = [];
    if (language === 'javascript') {
      steps = analyzeJavaScriptCode();
    } else {
      // For other languages, fall back to simple line-by-line execution
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines and comments
        if (!line || line.startsWith('//') || line.startsWith('#') || line.startsWith('/*')) continue;
        
        steps.push({
          line: i + 1,
          statement: line,
          variables: { ...variables }
        });
      }
    }
    
    // Convert the execution steps to a format suitable for the frontend
    const formattedSteps = steps.map((step, index) => ({
      lineNumber: step.line,
      content: step.statement,
      executed: false,
      variables: step.variables || {},
      controlType: step.controlType || 'statement',
      controlInfo: step.controlType ? {
        condition: step.condition,
        result: step.result,
        iteration: step.iteration,
        name: step.name
      } : null
    }));
    
    res.json({ steps: formattedSteps });
  } catch (err) {
    console.error('Error in debug endpoint:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;