import React from 'react';

function Controls({ onRun, language, onLanguageChange }) {
  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' }
  ];

  return (
    <div className="controls">
      <div className="control-buttons">
        <button onClick={onRun}>Run</button>
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