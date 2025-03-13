import React, { useState, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import DryRunConsole from './components/DryRunConsole';
import Terminal from './components/Terminal';
import Controls from './components/Controls';
import { executeCode, debugCode } from './services/codeService';
import './App.css';

function App() {
  const [code, setCode] = useState('// Write your code here');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [debugState, setDebugState] = useState({
    isDebugging: false,
    currentLine: null,
    steps: [],
    currentStepIndex: -1,
    variables: {}
  });
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState([]);

  const handleCodeChange = (value) => {
    setCode(value);
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleRun = async () => {
    try {
      setOutput('Running code...');
      const result = await executeCode(code, language);
      setOutput(result.output);
      setTerminalHistory(prev => [...prev, { type: 'system', content: `Code executed with ${language}` }]);
      setTerminalHistory(prev => [...prev, { type: 'output', content: result.output }]);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      setTerminalHistory(prev => [...prev, { type: 'error', content: `Error: ${error.message}` }]);
    }
  };

  const handleDebug = async () => {
    try {
      setOutput('Debugging code...');
      const result = await debugCode(code, language);
      
      setDebugState({
        isDebugging: true,
        currentLine: result.steps[0]?.line || null,
        steps: result.steps,
        currentStepIndex: 0,
        variables: result.steps[0]?.variables || {}
      });
      
      setTerminalHistory(prev => [...prev, { type: 'system', content: `Debug started with ${language}` }]);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      setTerminalHistory(prev => [...prev, { type: 'error', content: `Error: ${error.message}` }]);
    }
  };

  const handleStepForward = () => {
    if (!debugState.isDebugging || debugState.currentStepIndex >= debugState.steps.length - 1) return;
    
    const nextIndex = debugState.currentStepIndex + 1;
    setDebugState({
      ...debugState,
      currentStepIndex: nextIndex,
      currentLine: debugState.steps[nextIndex].line,
      variables: debugState.steps[nextIndex].variables
    });
  };

  const handleStepBackward = () => {
    if (!debugState.isDebugging || debugState.currentStepIndex <= 0) return;
    
    const prevIndex = debugState.currentStepIndex - 1;
    setDebugState({
      ...debugState,
      currentStepIndex: prevIndex,
      currentLine: debugState.steps[prevIndex].line,
      variables: debugState.steps[prevIndex].variables
    });
  };

  const handleReset = () => {
    setDebugState({
      isDebugging: false,
      currentLine: null,
      steps: [],
      currentStepIndex: -1,
      variables: {}
    });
    setTerminalHistory(prev => [...prev, { type: 'system', content: 'Debug reset' }]);
  };

  const handleTerminalSubmit = async (input) => {
    setTerminalHistory(prev => [...prev, { type: 'input', content: `> ${input}` }]);
    setTerminalInput('');
    
    try {
      // Here you would typically send the terminal command to the backend
      // For now, we'll just echo it back
      setTerminalHistory(prev => [...prev, { type: 'output', content: `Command received: ${input}` }]);
    } catch (error) {
      setTerminalHistory(prev => [...prev, { type: 'error', content: `Error: ${error.message}` }]);
    }
  };

  return (
    <div className="app-container">
      <Controls 
        onRun={handleRun}
        onDebug={handleDebug}
        onStepForward={handleStepForward}
        onStepBackward={handleStepBackward}
        onReset={handleReset}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
      
      <div className="main-content">
        <div className="editor-container">
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
            currentStep={debugState.currentStepIndex >= 0 ? debugState.steps[debugState.currentStepIndex] : null}
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