import React from 'react';

function DryRunConsole({ isDebugging, currentLine, steps, currentStepIndex, variables, output }) {
  // Function to determine the status of a step
  const getStepStatus = (stepIndex) => {
    if (!isDebugging) return 'pending';
    if (stepIndex < currentStepIndex) return 'executed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
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
      
      <div className="execution-status" style={{ marginBottom: '15px', textAlign: 'center' }}>
        {isDebugging ? (
          <p>Executing line {currentLine} {currentStepIndex >= 0 && steps[currentStepIndex] ? `- ${steps[currentStepIndex].content}` : ''}</p>
        ) : (
          <p>Run the code to start debugging</p>
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
            {steps.map((step, index) => (
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
                  {getStepStatus(index) === 'executed' ? (
                    <span style={{ color: 'green' }}>✓</span>
                  ) : getStepStatus(index) === 'current' ? (
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
      
      {/* Variables section */}
      {isDebugging && Object.keys(variables).length > 0 && (
        <div className="variables" style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '4px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Variables</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Value</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(variables).map(([name, value], index) => (
                <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px' }}>{name}</td>
                  <td style={{ padding: '8px' }}>{JSON.stringify(value)}</td>
                  <td style={{ padding: '8px' }}>{typeof value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DryRunConsole;