import React from 'react';

function Controls({ onRun, onForward, onBackward, onReset, isDebugging, language, onLanguageChange }) {
  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' }
  ];

  return (
    <div className="controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
      <div className="control-buttons" style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={onRun} 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Run
        </button>
        
        <button 
          onClick={onForward}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: isDebugging ? '#2196F3' : '#cccccc', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: isDebugging ? 'pointer' : 'not-allowed'
          }}
          disabled={!isDebugging}
        >
          Forward
        </button>
        
        <button 
          onClick={onBackward}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: isDebugging ? '#FF9800' : '#cccccc', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: isDebugging ? 'pointer' : 'not-allowed'
          }}
          disabled={!isDebugging}
        >
          Backward
        </button>
        
        <button 
          onClick={onReset}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: isDebugging ? '#F44336' : '#cccccc', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: isDebugging ? 'pointer' : 'not-allowed'
          }}
          disabled={!isDebugging}
        >
          Reset
        </button>
      </div>
      
      <div className="language-selector">
        <select 
          value={language} 
          onChange={onLanguageChange}
          style={{ padding: '8px', borderRadius: '4px' }}
        >
          {languages.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default Controls;
