import React from 'react';

function DryRunConsole({ isDebugging, currentLine, steps, currentStepIndex, variables, output, functionInfo }) {
  // Function to determine the status of a step
  const getStepStatus = (stepIndex) => {
    if (!isDebugging) return 'pending';
    if (stepIndex < currentStepIndex) return 'executed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  // Get the current step content if available
  const getCurrentStepContent = () => {
    if (isDebugging && currentStepIndex >= 0 && steps[currentStepIndex]) {
      return steps[currentStepIndex].content;
    }
    return null;
  };

  // Get the current step control type if available
  const getCurrentStepControlType = () => {
    if (isDebugging && currentStepIndex >= 0 && steps[currentStepIndex]) {
      return steps[currentStepIndex].controlType;
    }
    return 'statement';
  };

  // Get control flow information for the current step
  const getControlFlowInfo = () => {
    if (!isDebugging || currentStepIndex < 0 || !steps[currentStepIndex]) {
      return null;
    }
    
    const step = steps[currentStepIndex];
    const controlType = step.controlType;
    
    if (!controlType || controlType === 'statement') {
      return null;
    }
    
    let info = {
      type: controlType,
      description: ''
    };
    
    switch (controlType) {
      case 'if':
        info.description = `Conditional branch: ${step.controlInfo?.condition || 'unknown condition'}`;
        info.result = step.controlInfo?.result ? 'true' : 'false';
        break;
      case 'for-start':
        info.description = `For loop: init(${step.controlInfo?.initialization || ''}), condition(${step.controlInfo?.condition || ''}), increment(${step.controlInfo?.increment || ''})`;
        break;
      case 'for-iteration':
        info.description = `Loop iteration ${step.controlInfo?.iteration || '?'} complete`;
        break;
      case 'for-end':
        info.description = 'Loop execution completed';
        break;
      case 'while-start':
        info.description = `While loop: condition(${step.controlInfo?.condition || 'unknown'})`;
        break;
      case 'while-iteration':
        info.description = `Loop iteration ${step.controlInfo?.iteration || '?'} complete`;
        break;
      case 'function-call':
        info.description = `Calling function: ${step.controlInfo?.name || 'anonymous'}()`;
        break;
      case 'function-declaration':
        info.description = `Defining function: ${step.controlInfo?.name || 'anonymous'}`;
        break;
      default:
        info.description = 'Unknown control flow';
    }
    
    return info;
  };

  // Get the control flow badge color
  const getControlFlowBadgeColor = (controlType) => {
    switch (controlType) {
      case 'if':
        return '#9c27b0'; // Purple for conditionals
      case 'for-start':
      case 'for-iteration':
      case 'for-end':
      case 'while-start':
      case 'while-iteration':
      case 'while-end':
        return '#ff9800'; // Orange for loops
      case 'function-call':
      case 'function-declaration':
        return '#2196f3'; // Blue for functions
      default:
        return '#757575'; // Gray for other statements
    }
  };

  const controlFlowInfo = getControlFlowInfo();
  const currentControlType = getCurrentStepControlType();

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
      
      <div className="execution-trace" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px',
        border: '1px solid #e0e0e0'
      }}>
        {/* Display the current highlighted line information */}
        {isDebugging ? (
          <div>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '1.1em', 
              marginBottom: '10px',
              borderBottom: '1px solid #ccc',
              paddingBottom: '5px'
            }}>
              Dry-Run Output
            </div>
            
            <div style={{ 
              marginBottom: '8px', 
              fontFamily: 'monospace',
              backgroundColor: '#f0f0f0',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center'
            }}>
              {currentControlType && currentControlType !== 'statement' && (
                <span style={{
                  display: 'inline-block',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: getControlFlowBadgeColor(currentControlType),
                  color: 'white',
                  fontSize: '0.8em',
                  marginRight: '8px'
                }}>
                  {currentControlType.toUpperCase()}
                </span>
              )}
              <div>
                <span style={{ fontWeight: 'bold', color: '#0066cc' }}>
                  Line {currentLine}: {getCurrentStepContent()}
                </span>
              </div>
            </div>
            
            {/* Control flow information */}
            {controlFlowInfo && (
              <div style={{ 
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#fff8e1',
                borderRadius: '4px',
                border: '1px solid #ffe082'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Control Flow</h4>
                <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  <p style={{ margin: '5px 0' }}><strong>Type:</strong> {controlFlowInfo.type}</p>
                  <p style={{ margin: '5px 0' }}><strong>Description:</strong> {controlFlowInfo.description}</p>
                  {controlFlowInfo.result && (
                    <p style={{ margin: '5px 0' }}><strong>Result:</strong> {controlFlowInfo.result}</p>
                  )}
                </div>
              </div>
            )}
            
            {functionInfo && (
              <div style={{ 
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#f0f7ff',
                borderRadius: '4px',
                border: '1px solid #d0e0f0'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Line Information</h4>
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
            
            {/* Display variables if available */}
            {Object.keys(variables).length > 0 && (
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                backgroundColor: '#f9fff9', 
                borderRadius: '4px',
                border: '1px solid #d0f0d0'
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
        ) : (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            Run the code to start debugging
          </div>
        )}
      </div>
    </div>
  );
}

export default DryRunConsole;
