import React, { useState, useEffect } from 'react';
import { ListTree, Box, Type, FileCode } from 'lucide-react';

export default function OutlineView({ activeFile }) {
  const [symbols, setSymbols] = useState([]);

  useEffect(() => {
    if (!activeFile || !activeFile.content) {
      setSymbols([]);
      return;
    }
    
    // Simple Regex-based parser for symbols (functions, classes, components)
    const newSymbols = [];
    const lines = activeFile.content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match `function foo(` or `export function foo(` or `export default function foo(`
      const funcMatch = line.match(/(?:export\s+)?(?:default\s+)?function\s+([a-zA-Z0-9_]+)\s*\(/);
      if (funcMatch) {
        newSymbols.push({ type: 'function', name: funcMatch[1], line: i + 1 });
        continue;
      }
      
      // Match `class Foo`
      const classMatch = line.match(/(?:export\s+)?(?:default\s+)?class\s+([a-zA-Z0-9_]+)/);
      if (classMatch) {
        newSymbols.push({ type: 'class', name: classMatch[1], line: i + 1 });
        continue;
      }

      // Match const foo = () => 
      const arrowMatch = line.match(/(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/);
      if (arrowMatch) {
        newSymbols.push({ type: 'function', name: arrowMatch[1], line: i + 1 });
      }
    }
    
    setSymbols(newSymbols);
  }, [activeFile]);

  return (
    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListTree size={16} /> Outline
        </h3>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {!activeFile ? (
          <div style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic', padding: '10px' }}>No active file</div>
        ) : symbols.length === 0 ? (
          <div style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic', padding: '10px' }}>No symbols found</div>
        ) : (
          symbols.map((sym, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }} 
                 onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                 onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {sym.type === 'function' ? <Box size={14} color="#cca700" /> : <Type size={14} color="#bd93f9" />}
              <span style={{ fontSize: '0.8rem', color: '#ccc' }}>{sym.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#666' }}>Ln {sym.line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
