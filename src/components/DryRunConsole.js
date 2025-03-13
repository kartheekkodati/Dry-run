import React from 'react';

function DryRunConsole({ isDebugging, currentStep, variables, output }) {
  return (
    <div className="dry-run-console" style={{ padding: '15px', height: '100%', overflow: 'auto' }}>
      <div className="dry-run-header" style={{ marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Dry Run Console</h3>
      </div>
      
      <div className="dry-run-content">
        {isDebugging ? (
          <div>
            <div className="current-step" style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Current Step</h4>
              {currentStep ? (
                <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                  <p>Line: {currentStep.line}</p>
                  <p>Statement: {currentStep.statement}</p>
                </div>
              ) : (
                <p>No step information available</p>
              )}
            </div>
            
            <div className="variables">
              <h4 style={{ margin: '0 0 10px 0' }}>Variables</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f0f0f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Name</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Value</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(variables).map(([name, info]) => (
                    <tr key={name}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{name}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{JSON.stringify(info.value)}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{info.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="output-container" style={{ 
            background: '#f8f8f8', 
            padding: '15px', 
            borderRadius: '5px',
            margin: '10px 0'
          }}>
            
          </div>
        )}
      </div>
    </div>
  );
}

export default DryRunConsole;