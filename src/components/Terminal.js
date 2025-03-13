import React, { useEffect, useRef } from 'react';

function Terminal({ history, input, onInputChange, onSubmit }) {
  const terminalRef = useRef(null);
  
  useEffect(() => {
    // Scroll to bottom when history changes
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="terminal-container" ref={terminalRef}>
      <div className="terminal-history">
        {history.map((entry, index) => (
          <div key={index} className={`terminal-entry terminal-${entry.type}`}>
            {entry.content}
          </div>
        ))}
      </div>
      <div className="terminal-input-line">
        <span className="terminal-prompt">{'>'}</span>
        <input
          type="text"
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          className="terminal-input"
          autoFocus
          style={{ margin: '8px 0', padding: '8px', width: 'calc(100% - 30px)' }}
        />
      </div>
    </div>
  );
}

export default Terminal;