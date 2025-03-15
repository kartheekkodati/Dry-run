import React, { useState, useCallback } from 'react';
import CodeEditor from './components/CodeEditor';
import DryRunConsole from './components/DryRunConsole';
import Terminal from './components/Terminal';
import Controls from './components/Controls';
import { executeCode } from './services/codeService';
import './App.css';

function App() {
  const [code, setCode] = useState('// Write your code here');
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

  const handleRun = async () => {
    try {
      setOutput('Running code...');
      const result = await executeCode(code, language);
      setOutput(result.output);
      addTerminalHistory({ type: 'system', content: `Code executed with ${language}` });
      addTerminalHistory({ type: 'output', content: result.output });
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      addTerminalHistory({ type: 'error', content: `Error: ${error.message}` });
    }
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