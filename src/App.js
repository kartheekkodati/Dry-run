import React, { useState, useCallback, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import DryRunConsole from './components/DryRunConsole';
import Terminal from './components/Terminal';
import Controls from './components/Controls';
import { executeCode, debugCode } from './services/codeService';
import './App.css';

function App() {
  const [code, setCode] = useState('// Write your code here\nfunction main() {\n  let x = 10;\n  let y = 20;\n  let sum = x + y;\n  console.log("Sum:", sum);\n  return sum;\n}\n\nmain();');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [debugState, setDebugState] = useState({
    isDebugging: false,
    currentLine: null,
    currentStepIndex: -1,
    steps: [],
    variables: {}
  });
  const [functionInfo, setFunctionInfo] = useState(null);

  const handleCodeChange = (value) => {
    setCode(value);
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  // Use a callback to limit terminal history size
  const addTerminalHistory = useCallback((entry) => {
    setTerminalHistory(prev => {
      // Keep only the last 100 entries to prevent excessive growth
      const newHistory = [...prev, entry];
      if (newHistory.length > 100) {
        return newHistory.slice(-100);
      }
      return newHistory;
    });
  }, []);

  // Parse code to extract line numbers and content for debugging
  const parseCodeForDebugging = (code) => {
    const lines = code.split('\n');
    
    // Find the main function
    const mainFunctionIndex = lines.findIndex(line => 
      line.trim().startsWith('function main') || 
      line.trim() === 'main();'
    );
    
    if (mainFunctionIndex === -1) {
      return { steps: [], mainLineNumber: -1 };
    }
    
    // Create steps from each line of code
    const steps = lines.map((line, index) => ({
      lineNumber: index + 1,
      content: line,
      executed: false,
      variables: {}
    }));
    
    return { steps, mainLineNumber: mainFunctionIndex + 1 };
  };

  // Function to analyze code and determine function information for a specific line
  const analyzeLine = (lineNumber) => {
    if (!lineNumber || lineNumber < 1) return null;
    
    const lines = code.split('\n');
    if (lineNumber > lines.length) return null;
    
    const lineContent = lines[lineNumber - 1].trim();
    
    // Basic analysis of the line content
    let info = {
      description: null,
      type: null,
      operation: null,
      impact: null
    };
    
    // Variable declaration
    if (lineContent.match(/^(let|const|var)\s+\w+\s*=/)) {
      const varName = lineContent.match(/^(let|const|var)\s+(\w+)/)[2];
      info.type = 'Variable Declaration';
      info.description = `Declares a new variable named '${varName}'`;
      info.operation = lineContent.includes('=') ? 'Declaration with assignment' : 'Declaration only';
      info.impact = `Creates a new variable in the current scope`;
    }
    // Function declaration
    else if (lineContent.match(/^function\s+\w+\s*\(/)) {
      const funcName = lineContent.match(/^function\s+(\w+)/)[1];
      info.type = 'Function Declaration';
      info.description = `Defines a function named '${funcName}'`;
      info.operation = 'Creates a new function';
      info.impact = `Makes function '${funcName}' available in the current scope`;
    }
    // Function call
    else if (lineContent.match(/\w+\s*\(/)) {
      const funcName = lineContent.match(/(\w+)\s*\(/)[1];
      info.type = 'Function Call';
      info.description = `Calls function '${funcName}'`;
      info.operation = 'Executes function code';
      info.impact = `Transfers control to function '${funcName}'`;
    }
    // Assignment
    else if (lineContent.match(/\w+\s*=/)) {
      const varName = lineContent.match(/(\w+)\s*=/)[1];
      info.type = 'Assignment';
      info.description = `Assigns a value to variable '${varName}'`;
      info.operation = 'Value assignment';
      info.impact = `Updates the value of '${varName}'`;
    }
    // Return statement
    else if (lineContent.match(/^return\s/)) {
      info.type = 'Return Statement';
      info.description = 'Returns a value from the function';
      info.operation = 'Function exit';
      info.impact = 'Ends function execution and returns control to caller';
    }
    // If statement
    else if (lineContent.match(/^if\s*\(/)) {
      info.type = 'Conditional Statement';
      info.description = 'Evaluates a condition';
      info.operation = 'Conditional branching';
      info.impact = 'Controls program flow based on condition result';
    }
    // Loop
    else if (lineContent.match(/^(for|while)\s*\(/)) {
      const loopType = lineContent.match(/^(for|while)/)[1];
      info.type = `${loopType.charAt(0).toUpperCase() + loopType.slice(1)} Loop`;
      info.description = `Initiates a ${loopType} loop`;
      info.operation = 'Iterative execution';
      info.impact = 'Repeats code block until condition is false';
    }
    // Console log
    else if (lineContent.match(/console\.log/)) {
      info.type = 'Console Output';
      info.description = 'Outputs information to the console';
      info.operation = 'Debugging/Logging';
      info.impact = 'Displays values in the console for debugging';
    }
    // Comment
    else if (lineContent.match(/^\/\//)) {
      info.type = 'Comment';
      info.description = 'Code comment (not executed)';
      info.operation = 'Documentation';
      info.impact = 'No runtime impact';
    }
    // Default case
    else {
      info.type = 'Code Statement';
      info.description = 'General code statement';
      info.operation = 'Execution';
      info.impact = 'Performs the specified operation';
    }
    
    return info;
  };

  const handleRun = async () => {
    try {
      setOutput('Running code...');
      const result = await executeCode(code, language);
      setOutput(result.output);
      addTerminalHistory({ type: 'system', content: `Code executed with ${language}` });
      addTerminalHistory({ type: 'output', content: result.output });
      
      // Set up debugging state
      const { steps, mainLineNumber } = parseCodeForDebugging(code);
      
      // After execution, get debug information
      try {
        const debugResult = await debugCode(code, language);
        
        // If we have debug steps from the backend, use those
        if (debugResult && debugResult.steps && debugResult.steps.length > 0) {
          // Get function info for the first line
          const firstLineInfo = analyzeLine(debugResult.steps[0].line);
          setFunctionInfo(firstLineInfo);
          
          setDebugState({
            isDebugging: true,
            currentLine: debugResult.steps[0].line,
            currentStepIndex: 0,
            steps: debugResult.steps.map((step, index) => ({
              lineNumber: step.line,
              content: step.statement,
              executed: false,
              variables: step.variables || {}
            })),
            variables: debugResult.steps[0].variables || {}
          });
        } else {
          // Fall back to the simple parsing method
          const firstLineInfo = analyzeLine(mainLineNumber);
          setFunctionInfo(firstLineInfo);
          
          setDebugState({
            isDebugging: true,
            currentLine: mainLineNumber,
            currentStepIndex: mainLineNumber - 1,
            steps: steps,
            variables: {}
          });
        }
      } catch (debugError) {
        console.warn('Debug information not available:', debugError);
        // Fall back to the simple parsing method
        const firstLineInfo = analyzeLine(mainLineNumber);
        setFunctionInfo(firstLineInfo);
        
        setDebugState({
          isDebugging: true,
          currentLine: mainLineNumber,
          currentStepIndex: mainLineNumber - 1,
          steps: steps,
          variables: {}
        });
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      addTerminalHistory({ type: 'error', content: `Error: ${error.message}` });
    }
  };

  const handleForward = () => {
    // Check if debugging is active
    if (!debugState.isDebugging) {
      console.log('Debugging is not active');
      return;
    }
    
    const nextIndex = debugState.currentStepIndex + 1;
    
    // Check if we've reached the end of the steps
    if (nextIndex >= debugState.steps.length) {
      console.log('Reached the end of debugging steps');
      return;
    }
    
    // Make sure the next step exists before accessing its properties
    if (!debugState.steps[nextIndex]) {
      console.error('Next step is undefined');
      return;
    }
    
    const nextLine = debugState.steps[nextIndex].lineNumber;
    
    // Analyze the line to get function information
    const lineInfo = analyzeLine(nextLine);
    setFunctionInfo(lineInfo);
    
    // Log the current line being executed if it's valid
    if (debugState.currentStepIndex >= 0 && 
        debugState.currentStepIndex < debugState.steps.length && 
        debugState.steps[debugState.currentStepIndex]) {
      const currentLineContent = debugState.steps[debugState.currentStepIndex].content.trim();
      addTerminalHistory({ 
        type: 'debug', 
        content: `Executing: ${currentLineContent}` 
      });
      
      // If there are variables at this step, show them
      const currentVars = debugState.steps[debugState.currentStepIndex].variables;
      if (currentVars && Object.keys(currentVars).length > 0) {
        Object.entries(currentVars).forEach(([name, details]) => {
          addTerminalHistory({
            type: 'debug',
            content: `Variable ${name} = ${details.value} (${details.type})`
          });
        });
      }
    }
    
    // Update the debug state with the new position
    setDebugState(prev => ({
      ...prev,
      currentLine: nextLine,
      currentStepIndex: nextIndex,
      variables: debugState.steps[nextIndex]?.variables || {},
      steps: prev.steps.map((step, idx) => 
        idx === debugState.currentStepIndex && debugState.currentStepIndex >= 0 ? 
          { ...step, executed: true } : step
      )
    }));
    
    console.log('Forward button clicked, new index:', nextIndex, 'new line:', nextLine);
  };
  
  const handleBackward = () => {
    if (!debugState.isDebugging || debugState.currentStepIndex <= 0) {
      return;
    }
    
    const prevIndex = debugState.currentStepIndex - 1;
    const prevLine = debugState.steps[prevIndex].lineNumber;
    
    // Analyze the line to get function information
    const lineInfo = analyzeLine(prevLine);
    setFunctionInfo(lineInfo);
    
    // Update the current line and step index
    setDebugState(prev => ({
      ...prev,
      currentLine: prevLine,
      currentStepIndex: prevIndex,
      steps: prev.steps.map((step, idx) => 
        idx === prev.currentStepIndex ? { ...step, executed: false } : step
      )
    }));
  };
  
  const handleReset = () => {
    // Reset the debugging state
    setDebugState({
      isDebugging: false,
      currentLine: null,
      currentStepIndex: -1,
      steps: [],
      variables: {}
    });
    
    // Clear the function info
    setFunctionInfo(null);
    
    // Clear the dry run console output
    setOutput('');
  };

  const handleTerminalSubmit = async (input) => {
    addTerminalHistory({ type: 'input', content: `> ${input}` });
    setTerminalInput('');
    
    try {
      // Here you would typically send the terminal command to the backend
      // For now, we'll just echo it back
      addTerminalHistory({ type: 'output', content: `Command received: ${input}` });
    } catch (error) {
      addTerminalHistory({ type: 'error', content: `Error: ${error.message}` });
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="editor-container">
          <div className="editor-controls">
            <Controls 
              onRun={handleRun}
              onForward={handleForward}
              onBackward={handleBackward}
              onReset={handleReset}
              isDebugging={debugState.isDebugging}
              language={language}
              onLanguageChange={handleLanguageChange}
            />
          </div>
          <CodeEditor 
            value={code} 
            onChange={handleCodeChange} 
            language={language}
            highlightedLine={debugState.currentLine}
          />
        </div>
        
        <div className="dry-run-container">
          <DryRunConsole 
            isDebugging={debugState.isDebugging}
            currentLine={debugState.currentLine}
            steps={debugState.steps}
            currentStepIndex={debugState.currentStepIndex}
            variables={debugState.variables}
            output={output}
            functionInfo={functionInfo}
          />
        </div>
      </div>
      
      <Terminal 
        history={terminalHistory}
        input={terminalInput}
        onInputChange={(e) => setTerminalInput(e.target.value)}
        onSubmit={() => handleTerminalSubmit(terminalInput)}
      />
    </div>
  );
}

export default App;