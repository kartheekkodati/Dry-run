import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';

function CodeEditor({ value, onChange, language, highlightedLine }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [editorReady, setEditorReady] = useState(false);
  const [decorations, setDecorations] = useState([]);
  
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Mark editor as ready after a short delay to avoid resize issues
    setTimeout(() => {
      setEditorReady(true);
    }, 100);
  };

  useEffect(() => {
    if (editorRef.current && monacoRef.current && highlightedLine !== null && highlightedLine !== undefined && editorReady) {
      try {
        // Clear previous decorations
        if (decorations.length > 0) {
          editorRef.current.deltaDecorations(decorations, []);
        }
        
        // Add decoration for highlighted line
        const newDecorations = editorRef.current.deltaDecorations([], [
          {
            range: new monacoRef.current.Range(highlightedLine, 1, highlightedLine, 1),
            options: {
              isWholeLine: true,
              className: 'highlighted-line',
            },
          },
        ]);
        
        setDecorations(newDecorations);
        
        // Scroll to the highlighted line
        editorRef.current.revealLineInCenter(highlightedLine);
      } catch (error) {
        console.error('Error applying editor decoration:', error);
      }
    }
  }, [highlightedLine, editorReady]);

  // Add a manual layout update function
  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    };

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);
    
    // Set up a periodic layout refresh that's less aggressive than automaticLayout
    const layoutInterval = setInterval(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    }, 500); // Update layout every 500ms

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(layoutInterval);
    };
  }, [editorReady]);

  return (
    <Editor
      height="100%"
      defaultLanguage="javascript"
      language={language}
      value={value}
      onChange={onChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        wordWrap: 'on',
        automaticLayout: true, // Changed back to true for proper layout
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        padding: { top: 15, bottom: 15 },
        folding: true,
        glyphMargin: true,
        scrollbar: {
          verticalScrollbarSize: 12,
          horizontalScrollbarSize: 12
        }
      }}
      onMount={handleEditorDidMount}
      className="monaco-editor-container"
    />
  );
}

export default CodeEditor;
