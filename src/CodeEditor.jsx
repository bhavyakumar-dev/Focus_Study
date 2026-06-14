import React, { useState, useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';

export default function CodeEditor() {
  const [code, setCode] = useState('// Welcome to the Focus Code Editor.\n// Enter distraction-free deep work.\n\nfunction init() {\n  console.log("System optimal.");\n}\n\ninit();');
  const [lines, setLines] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    // Handle tab to insert spaces instead of blurring focus
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = e.target.value;
      setCode(val.substring(0, start) + '  ' + val.substring(end));
      
      // Put cursor right after the inserted tab
      setTimeout(() => {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleChange = (e) => {
    setCode(e.target.value);
    const lineCount = e.target.value.split('\n').length;
    // Generate an array [1, 2, 3...] for line numbers
    setLines(Array.from({ length: Math.max(10, lineCount) }, (_, i) => i + 1));
  };

  // Sync scrolling of line numbers with textarea
  const handleScroll = (e) => {
    const linesContainer = document.getElementById('line-numbers');
    if (linesContainer) {
      linesContainer.scrollTop = e.target.scrollTop;
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#0d1117', // GitHub Dark / Antigravity feel
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
    }}>
      {/* Editor Header */}
      <div style={{
        backgroundColor: '#161b22',
        padding: '10px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        color: '#8b949e'
      }}>
        <Terminal size={14} color="var(--accent-cyan)" />
        <span>focus-workspace.js</span>
      </div>

      {/* Editor Body */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Line Numbers */}
        <div 
          id="line-numbers"
          style={{
            padding: '20px 15px',
            backgroundColor: '#0d1117',
            color: '#484f58',
            fontFamily: '"Fira Code", monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            textAlign: 'right',
            userSelect: 'none',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            overflow: 'hidden',
            minWidth: '40px'
          }}
        >
          {lines.map(n => <div key={n}>{n}</div>)}
        </div>

        {/* Textarea Code */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          spellCheck="false"
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            color: '#c9d1d9', // Bright text
            fontFamily: '"Fira Code", "Courier New", Courier, monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            padding: '20px',
            border: 'none',
            outline: 'none',
            resize: 'none',
            overflow: 'auto',
            whiteSpace: 'pre'
          }}
        />
      </div>
    </div>
  );
}
