import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import './CodeEditor.css';

function CodeEditor({ value, onChange, language, highlightedLine, controlType }) {
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
      console.log("Editor is ready");
    }, 100);
  };

  // Get the appropriate highlight class based on control type
  const getHighlightClass = (controlType) => {
    if (!controlType || controlType === 'statement') {
      return 'highlighted-line';
    }
    
    if (controlType.startsWith('if')) {
      return 'highlighted-line-if';
    }
    
    if (controlType.includes('for') || controlType.includes('while')) {
      return 'highlighted-line-loop';
    }
    
    if (controlType.includes('function')) {
      return 'highlighted-line-function';
    }
    
    return 'highlighted-line';
  };

  useEffect(() => {
    if (editorRef.current && monacoRef.current && highlightedLine !== null && highlightedLine !== undefined && editorReady) {
      try {
        console.log("Applying decoration for line:", highlightedLine, "with control type:", controlType);
        
        // Clear previous decorations
        if (decorations.length > 0) {
          editorRef.current.deltaDecorations(decorations, []);
        }
        
        // Get the appropriate highlight class based on the current step's control type
        const highlightClass = getHighlightClass(controlType);
        console.log("Using highlight class:", highlightClass);
        
        // Add decoration for highlighted line - use a range that spans the entire line
        const newDecorations = editorRef.current.deltaDecorations([], [
          {
            range: new monacoRef.current.Range(
              highlightedLine, 
              1, 
              highlightedLine, 
              Number.MAX_VALUE  // This ensures the highlight spans the entire line
            ),
            options: {
              isWholeLine: true,
              className: highlightClass,
              linesDecorationsClassName: highlightClass + '-gutter',  // Add gutter decoration
              inlineClassName: highlightClass + '-inline', // Add inline decoration
              overviewRuler: {
                color: '#ffcc00',
                position: monacoRef.current.editor.OverviewRulerLane.Full
              }
            },
          },
        ]);
        
        setDecorations(newDecorations);
        console.log("Applied decorations:", newDecorations);
        
        // Scroll to the highlighted line
        editorRef.current.revealLineInCenter(highlightedLine);
        
        // Force a layout update to ensure the decoration is visible
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.layout();
          }
        }, 50);
        
        // Add another layout update after a longer delay to ensure styles are applied
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.layout();
          }
        }, 200);
      } catch (error) {
        console.error('Error applying editor decoration:', error);
      }
    }
  }, [highlightedLine, controlType, editorReady]);

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
        automaticLayout: true,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        padding: { top: 15, bottom: 15 },
        folding: true,
        glyphMargin: true,
        renderLineHighlight: 'all', // Ensure line highlighting is enabled
        lineHighlightBackground: '#00000000', // Transparent to let our custom highlighting work
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
