import React, { useState } from 'react';
import { Search, FileCode } from 'lucide-react';

export default function GlobalSearch({ files, onSelectFile }) {
  const [query, setQuery] = useState('');
  
  const results = files.flatMap(file => {
    if (!query) return [];
    const lines = file.content.split('\\n');
    const matches = [];
    lines.forEach((line, i) => {
      if (line.toLowerCase().includes(query.toLowerCase())) {
        matches.push({ line: i + 1, text: line.trim() });
      }
    });
    if (matches.length > 0) {
      return [{ file, matches }];
    }
    return [];
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 15px', color: '#888', borderBottom: '1px solid #333', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
        <span>Search</span>
      </div>
      
      <div style={{ padding: '10px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input 
            type="text" 
            placeholder="Search in all files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              padding: '6px 10px 6px 28px',
              color: 'white',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
        {query && results.length === 0 && (
          <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic', padding: '10px 0' }}>No results found.</div>
        )}
        
        {results.map((res, i) => (
          <div key={i} style={{ marginBottom: '15px' }}>
            <div 
              style={{ fontSize: '0.8rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', cursor: 'pointer' }}
              onClick={() => onSelectFile(res.file.id)}
            >
              <FileCode size={12} color="var(--accent-cyan)" /> {res.file.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {res.matches.slice(0, 10).map((match, j) => (
                <div 
                  key={j} 
                  onClick={() => onSelectFile(res.file.id)}
                  style={{ 
                    fontSize: '0.75rem', 
                    color: '#aaa', 
                    backgroundColor: 'rgba(255,255,255,0.02)', 
                    padding: '4px 6px', 
                    borderRadius: '3px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer'
                  }}
                  title={match.text}
                >
                  <span style={{ color: '#888', marginRight: '5px' }}>{match.line}:</span>
                  {/* Highlight the match */}
                  {match.text.split(new RegExp(`(${query})`, 'gi')).map((part, k) => 
                    part.toLowerCase() === query.toLowerCase() 
                      ? <span key={k} style={{ color: 'var(--accent-cyan)', backgroundColor: 'rgba(0, 255, 255, 0.1)' }}>{part}</span>
                      : part
                  )}
                </div>
              ))}
              {res.matches.length > 10 && (
                <div style={{ fontSize: '0.7rem', color: '#666', paddingLeft: '5px' }}>
                  + {res.matches.length - 10} more matches
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
