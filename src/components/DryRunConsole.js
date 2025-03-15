import React, { useState, useEffect } from 'react';

function DryRunConsole({ output }) {
  const [executionSteps, setExecutionSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [parsedOutput, setParsedOutput] = useState('');

  // Parse the output into execution steps when output changes
  useEffect(() => {
    if (output) {
      // Simple parsing of output into lines
      const lines = output.split('\n').filter(line => line.trim() !== '');
      setParsedOutput(output);
      
      // Create execution steps from the output lines
      const steps = lines.map((line, index) => ({
        lineNumber: index + 1,
        content: line,
        executed: false
      }));
      
      setExecutionSteps(steps);
      setCurrentStepIndex(-1);
      setIsRunning(false);
    }
  }, [output]);

  // Function to start the line-by-line execution
  const startExecution = () => {
    if (executionSteps.length === 0) return;
    
    setIsRunning(true);
    setCurrentStepIndex(0);
    
    // Reset all steps to not executed
    setExecutionSteps(steps => 
      steps.map(step => ({ ...step, executed: false }))
    );
  };

  // Function to execute the next line
  const executeNextLine = () => {
    if (currentStepIndex >= executionSteps.length - 1) {
      setIsRunning(false);
      return;
    }
    
    const nextIndex = currentStepIndex + 1;
    
    // Mark the current step as executed
    setExecutionSteps(steps => 
      steps.map((step, idx) => 
        idx === currentStepIndex ? { ...step, executed: true } : step
      )
    );
    
    setCurrentStepIndex(nextIndex);
  };
  
  // Function to go back to the previous line
  const executePreviousLine = () => {
    if (currentStepIndex <= 0) {
      return;
    }
    
    const prevIndex = currentStepIndex - 1;
    
    // Mark the current step as not executed
    setExecutionSteps(steps => 
      steps.map((step, idx) => 
        idx === currentStepIndex ? { ...step, executed: false } : step
      )
    );
    
    setCurrentStepIndex(prevIndex);
  };

  // Function to reset the execution
  const resetExecution = () => {
    setIsRunning(false);
    setCurrentStepIndex(-1);
    setExecutionSteps(steps => 
      steps.map(step => ({ ...step, executed: false }))
    );
  };

  return (
    <div className="dry-run-console" style={{ 
      padding: '15px', 
      height: '100%', 
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="dry-run-header" style={{ 
        marginBottom: '15px', 
        borderBottom: '1px solid #ccc', 
        paddingBottom: '10px',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Dry Run Console</h3>
      </div>
      
      <div className="execution-controls" style={{ 
        marginBottom: '15px', 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '10px' 
      }}>
        <button 
          onClick={startExecution} 
          disabled={isRunning || executionSteps.length === 0}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: executionSteps.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Start Execution
        </button>
        <button 
          onClick={executePreviousLine} 
          disabled={!isRunning || currentStepIndex <= 0}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#FF9800', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: (!isRunning || currentStepIndex <= 0) ? 'not-allowed' : 'pointer'
          }}
        >
          Previous Line
        </button>
        <button 
          onClick={executeNextLine} 
          disabled={!isRunning || currentStepIndex >= executionSteps.length - 1}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: !isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          Next Line
        </button>
        <button 
          onClick={resetExecution} 
          disabled={!isRunning && currentStepIndex === -1}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#f44336', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: (!isRunning && currentStepIndex === -1) ? 'not-allowed' : 'pointer'
          }}
        >
          Reset
        </button>
      </div>
      
      <div className="execution-status" style={{ marginBottom: '15px', textAlign: 'center' }}>
        {isRunning ? (
          <p>Executing line {currentStepIndex + 1} of {executionSteps.length}</p>
        ) : currentStepIndex >= 0 ? (
          <p>Execution paused at line {currentStepIndex + 1}</p>
        ) : executionSteps.length > 0 ? (
          <p>Ready to execute {executionSteps.length} lines</p>
        ) : (
          <p>No code output to execute</p>
        )}
      </div>
      
      <div className="execution-steps" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        border: '1px solid #ddd', 
        borderRadius: '4px',
        backgroundColor: '#f8f8f8'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#e0e0e0' }}>
              <th style={{ padding: '8px', textAlign: 'left', width: '50px' }}>Line</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Content</th>
              <th style={{ padding: '8px', textAlign: 'center', width: '80px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {executionSteps.map((step, index) => (
              <tr 
                key={index} 
                style={{ 
                  backgroundColor: index === currentStepIndex ? '#fffde7' : 'transparent',
                  borderBottom: '1px solid #ddd'
                }}
              >
                <td style={{ padding: '8px', textAlign: 'center' }}>{step.lineNumber}</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{step.content}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  {step.executed ? (
                    <span style={{ color: 'green' }}>✓</span>
                  ) : index === currentStepIndex ? (
                    <span style={{ color: 'blue' }}>→</span>
                  ) : (
                    <span style={{ color: 'gray' }}>•</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {parsedOutput && (
        <div className="raw-output" style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px',
          maxHeight: '100px',
          overflowY: 'auto'
        }}>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Raw Output</summary>
            <pre style={{ margin: '10px 0 0 0', whiteSpace: 'pre-wrap' }}>{parsedOutput}</pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default DryRunConsole;