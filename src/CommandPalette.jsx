import React, { useState, useEffect, useRef } from 'react';
import { Search, Terminal, FileCode, Play, Settings, Moon, Sun, Zap, Volume2, VolumeX } from 'lucide-react';

const COMMANDS = [
  { id: 'run', label: 'Run Code', icon: Play, shortcut: 'F5', category: 'Editor' },
  { id: 'new-file', label: 'New File', icon: FileCode, shortcut: 'Ctrl+N', category: 'Editor' },
  { id: 'save', label: 'Save to Cloud', icon: FileCode, shortcut: 'Ctrl+S', category: 'Editor' },
  { id: 'clear-terminal', label: 'Clear Terminal', icon: Terminal, shortcut: '', category: 'Terminal' },
  { id: 'toggle-widgets', label: 'Toggle Widget Lock', icon: Settings, shortcut: 'Ctrl+L', category: 'Layout' },
  { id: 'toggle-sidebar', label: 'Toggle Sidebar', icon: Settings, shortcut: 'Ctrl+B', category: 'Layout' },
  { id: 'fullscreen', label: 'Enter Fullscreen', icon: Zap, shortcut: 'F11', category: 'System' },
  { id: 'end-session', label: 'End Focus Session', icon: Zap, shortcut: 'Ctrl+Q', category: 'System' },
];

export default function CommandPalette({ isOpen, onClose, onCommand }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keyboard shortcut to open
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onCommand('__open_palette');
      }
    };
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen, onClose, onCommand]);

  if (!isOpen) return null;

  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (filtered[selectedIndex]) {
        onCommand(filtered[selectedIndex].id);
        onClose();
      }
    }
  };

  const executeCommand = (cmd) => {
    onCommand(cmd.id);
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        zIndex: 10000, display: 'flex', justifyContent: 'center', paddingTop: '15vh'
      }}
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '520px', maxHeight: '400px',
          backgroundColor: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px', overflow: 'hidden',
          boxShadow: '0 25px 80px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* Search Input */}
        <div style={{ 
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <Search size={16} color="#888" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: '0.95rem', fontFamily: 'inherit'
            }}
          />
          <kbd style={{ 
            padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem',
            backgroundColor: 'rgba(255,255,255,0.08)', color: '#888', border: '1px solid rgba(255,255,255,0.1)'
          }}>ESC</kbd>
        </div>

        {/* Command List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: '0.85rem' }}>
              No commands found
            </div>
          )}
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            return (
              <div
                key={cmd.id}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(i)}
                style={{
                  padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                  cursor: 'pointer',
                  backgroundColor: i === selectedIndex ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                  borderLeft: i === selectedIndex ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                  transition: 'background 0.1s'
                }}
              >
                <Icon size={15} color={i === selectedIndex ? 'var(--accent-cyan)' : '#666'} />
                <span style={{ flex: 1, fontSize: '0.88rem', color: i === selectedIndex ? '#fff' : '#ccc' }}>
                  {cmd.label}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#555' }}>{cmd.category}</span>
                {cmd.shortcut && (
                  <kbd style={{ 
                    padding: '2px 6px', borderRadius: '3px', fontSize: '0.6rem',
                    backgroundColor: 'rgba(255,255,255,0.06)', color: '#666', border: '1px solid rgba(255,255,255,0.08)'
                  }}>{cmd.shortcut}</kbd>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
