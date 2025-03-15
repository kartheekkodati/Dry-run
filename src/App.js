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

  const handleRun = async () => {
    try {
      setOutput('Running code...');
      const result = await executeCode(code, language);
      setOutput(result.output);
      addTerminalHistory({ type: 'system', content: `Code executed with ${language}` });
      addTerminalHistory({ type: 'output', content: result.output });
      
      // Set up debugging state
      const { steps, mainLineNumber } = parseCodeForDebugging(code);
      
      setDebugState({
        isDebugging: true,
        currentLine: mainLineNumber,
        currentStepIndex: mainLineNumber - 1,
        steps: steps,
        variables: {}
      });
      
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      addTerminalHistory({ type: 'error', content: `Error: ${error.message}` });
    }
  };

  const handleForward = () => {
    // Check if debugging is active
    if (!debugState.isDebugging) {
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
    
    // Log the current line being executed if it exists
    // Only try to access currentStepIndex if it's valid
    if (debugState.currentStepIndex >= 0 && 
        debugState.currentStepIndex < debugState.steps.length && 
        debugState.steps[debugState.currentStepIndex]) {
      const currentLineContent = debugState.steps[debugState.currentStepIndex].content.trim();
      addTerminalHistory({ 
        type: 'debug', 
        content: `Executing: ${currentLineContent}` 
      });
    }
    
    // Update the debug state with the new position
    setDebugState(prev => ({
      ...prev,
      currentLine: nextLine,
      currentStepIndex: nextIndex,
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