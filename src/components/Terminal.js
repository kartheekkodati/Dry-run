import React, { useEffect, useRef } from 'react';

function Terminal({ history, input, onInputChange, onSubmit }) {
  const terminalRef = useRef(null);
  const contentRef = useRef(null);
  
  useEffect(() => {
    // Scroll to bottom when history changes
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [history]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  // Limit the number of history items to display to prevent excessive growth
  const displayHistory = history.slice(-100); // Show only the last 100 entries

  return (
    <div className="terminal-container" ref={terminalRef}>
      <div className="terminal-history" ref={contentRef} style={{ maxHeight: '150px', overflowY: 'auto' }}>
        {displayHistory.map((entry, index) => (
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