import React from 'react';

function DryRunConsole({ isDebugging, currentLine, steps, currentStepIndex, variables, output, functionInfo }) {
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
      flexDirection: 'column',
      backgroundColor: '#ffffff', // White paper look
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)', // Subtle shadow for paper effect
      border: '1px solid #e0e0e0'
    }}>
      <div className="dry-run-header" style={{ 
        marginBottom: '15px', 
        borderBottom: '1px solid #ccc', 
        paddingBottom: '10px',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Dry Run Console</h3>
      </div>
      
      {/* Function information section - shows when a line is highlighted */}
      {functionInfo && (
        <div className="function-info" style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#f9f9f9', 
          borderRadius: '4px',
          border: '1px solid #e0e0e0'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Line {currentLine} Information</h4>
          <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {functionInfo.description && (
              <p style={{ margin: '5px 0' }}><strong>Description:</strong> {functionInfo.description}</p>
            )}
            {functionInfo.type && (
              <p style={{ margin: '5px 0' }}><strong>Type:</strong> {functionInfo.type}</p>
            )}
            {functionInfo.operation && (
              <p style={{ margin: '5px 0' }}><strong>Operation:</strong> {functionInfo.operation}</p>
            )}
            {functionInfo.impact && (
              <p style={{ margin: '5px 0' }}><strong>Impact:</strong> {functionInfo.impact}</p>
            )}
          </div>
        </div>
      )}
      
      <div className="execution-status" style={{ marginBottom: '15px', textAlign: 'center' }}>
        {isDebugging ? (
          <p style={{ color: '#333' }}>
            Executing line {currentLine} {currentStepIndex >= 0 && steps[currentStepIndex] ? `- ${steps[currentStepIndex].content}` : ''}
          </p>
        ) : (
          <p style={{ color: '#666' }}>Run the code to start debugging</p>
        )}
      </div>
      
      <div className="execution-steps" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        border: '1px solid #e0e0e0', 
        borderRadius: '4px',
        backgroundColor: '#ffffff' // White paper background
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '8px', textAlign: 'left', width: '50px', borderBottom: '1px solid #e0e0e0' }}>Line</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Content</th>
              <th style={{ padding: '8px', textAlign: 'center', width: '80px', borderBottom: '1px solid #e0e0e0' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, index) => (
              <tr 
                key={index} 
                style={{ 
                  backgroundColor: index === currentStepIndex ? '#f0f7ff' : 'transparent',
                  borderBottom: '1px solid #e0e0e0'
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
          backgroundColor: '#ffffff', 
          borderRadius: '4px',
          border: '1px solid #e0e0e0'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Variables</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Name</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Value</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(variables).map(([name, value], index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
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