import React, { useState, useCallback, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import DryRunConsole from './components/DryRunConsole';
import Terminal from './components/Terminal';
import Controls from './components/Controls';
import { executeCode, debugCode } from './services/codeService';
import './App.css';

function App() {
  const [code, setCode] = useState('// Write your code here\nfunction main() {\n  let x = 10;\n  let y = 20;\n  let sum = x + y;\n  console.log("Sum:", sum);\n  \n  // Add a loop to demonstrate flow control\n  for (let i = 0; i < 3; i++) {\n    console.log("Iteration:", i);\n    if (i > 1) {\n      console.log("i is greater than 1");\n    } else {\n      console.log("i is 0 or 1");\n    }\n  }\n  \n  return sum;\n}\n\nmain();');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [debugState, setDebugState] = useState({
    isDebugging: false,
    currentLine: null,
    currentStepIndex: -1,
    steps: [],
    variables: {},
    controlType: 'statement'
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
    
    // Find the main function based on language
    let mainFunctionIndex = -1;
    
    if (language === 'java') {
      // For Java, look for "public static void main" or similar patterns
      mainFunctionIndex = lines.findIndex(line => 
        line.trim().includes('static void main') || 
        line.trim().includes('public static void main')
      );
    } else {
      // For JavaScript and other languages
      mainFunctionIndex = lines.findIndex(line => 
        line.trim().startsWith('function main') || 
        line.trim() === 'main();'
      );
    }
    
    // If no main function found, still create steps for all lines
    // Create steps from each line of code
    const steps = lines.map((line, index) => ({
      lineNumber: index + 1,
      content: line,
      executed: false,
      variables: {},
      controlType: 'statement'
    }));
    
    return { 
      steps, 
      mainLineNumber: mainFunctionIndex !== -1 ? mainFunctionIndex + 1 : 1 
    };
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
      
      // Only show the summary in terminal, not the detailed output
      addTerminalHistory({ type: 'system', content: `Code executed with ${language}` });
      
      // Extract the sum value from the output
      const sumMatch = result.output.match(/Sum:\s*(\d+)/);
      if (sumMatch && sumMatch[1]) {
        addTerminalHistory({ type: 'output', content: `Sum: ${sumMatch[1]}` });
      } else {
        addTerminalHistory({ type: 'output', content: result.output });
      }
      
      // Get debug information from the backend
      const debugResult = await debugCode(code, language);
      
      // Initialize debugging state with the first line
      setDebugState({
        isDebugging: true,
        currentLine: debugResult.steps.length > 0 ? debugResult.steps[0].lineNumber : null,
        currentStepIndex: 0,
        steps: debugResult.steps,
        variables: debugResult.steps[0]?.variables || {},
        controlType: debugResult.steps[0]?.controlType || 'statement'
      });
      
      // Set function info for the first line
      if (debugResult.steps.length > 0) {
        const lineInfo = analyzeLine(debugResult.steps[0].lineNumber);
        setFunctionInfo(lineInfo);
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      addTerminalHistory({ type: 'error', content: `Error: ${error.message}` });
      
      // Reset debugging state on error
      setDebugState({
        isDebugging: false,
        currentLine: null,
        currentStepIndex: -1,
        steps: [],
        variables: {},
        controlType: 'statement'
      });
      
      // Clear the function info
      setFunctionInfo(null);
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
    const nextControlType = debugState.steps[nextIndex].controlType || 'statement';
    
    // Analyze the line to get function information
    const lineInfo = analyzeLine(nextLine);
    setFunctionInfo(lineInfo);
    
    // Check if this step has control flow information
    const controlType = debugState.steps[nextIndex].controlType;
    const controlInfo = debugState.steps[nextIndex].controlInfo;
    
    // Add additional information to function info based on control flow
    if (controlType && controlType !== 'statement') {
      let additionalInfo = {};
      
      switch (controlType) {
        case 'if':
          additionalInfo = {
            condition: controlInfo?.condition,
            result: controlInfo?.result ? 'true' : 'false',
            impact: controlInfo?.result 
              ? 'Condition is true, entering if block' 
              : 'Condition is false, skipping if block'
          };
          break;
        case 'for-start':
          additionalInfo = {
            initialization: controlInfo?.initialization,
            condition: controlInfo?.condition,
            increment: controlInfo?.increment,
            impact: 'Starting loop execution'
          };
          break;
        case 'for-iteration':
          additionalInfo = {
            iteration: controlInfo?.iteration,
            impact: `Completed iteration ${controlInfo?.iteration}, checking condition`
          };
          break;
        case 'for-end':
          additionalInfo = {
            impact: 'Loop execution completed'
          };
          break;
        case 'while-start':
          additionalInfo = {
            condition: controlInfo?.condition,
            impact: 'Starting while loop execution'
          };
          break;
        case 'while-iteration':
          additionalInfo = {
            iteration: controlInfo?.iteration,
            impact: `Completed iteration ${controlInfo?.iteration}, checking condition`
          };
          break;
        case 'function-call':
          additionalInfo = {
            name: controlInfo?.name,
            impact: `Calling function ${controlInfo?.name}`
          };
          break;
        case 'function-declaration':
          additionalInfo = {
            name: controlInfo?.name,
            impact: `Defining function ${controlInfo?.name}`
          };
          break;
      }
      
      // Merge additional info with line info
      if (lineInfo) {
        setFunctionInfo({
          ...lineInfo,
          ...additionalInfo
        });
      } else {
        setFunctionInfo(additionalInfo);
      }
    }
    
    // Update the debug state with the new position
    setDebugState(prev => ({
      ...prev,
      currentLine: nextLine,
      currentStepIndex: nextIndex,
      variables: debugState.steps[nextIndex]?.variables || {},
      controlType: nextControlType,
      steps: prev.steps.map((step, idx) => 
        idx === debugState.currentStepIndex && debugState.currentStepIndex >= 0 ? 
          { ...step, executed: true } : step
      )
    }));
    
    console.log('Forward button clicked, new index:', nextIndex, 'new line:', nextLine, 'control type:', nextControlType);
  };
  
  const handleBackward = () => {
    if (!debugState.isDebugging || debugState.currentStepIndex <= 0) {
      return;
    }
    
    const prevIndex = debugState.currentStepIndex - 1;
    const prevLine = debugState.steps[prevIndex].lineNumber;
    const prevControlType = debugState.steps[prevIndex].controlType || 'statement';
    
    // Analyze the line to get function information
    const lineInfo = analyzeLine(prevLine);
    setFunctionInfo(lineInfo);
    
    // Update the current line and step index
    setDebugState(prev => ({
      ...prev,
      currentLine: prevLine,
      currentStepIndex: prevIndex,
      controlType: prevControlType,
      variables: prev.steps[prevIndex]?.variables || {},
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
      variables: {},
      controlType: 'statement'
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
            controlType={debugState.controlType}
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
