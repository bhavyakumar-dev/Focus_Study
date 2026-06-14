import React, { useState, useEffect } from 'react';
import { PenTool } from 'lucide-react';

export default function Scratchpad() {
  const [notes, setNotes] = useState(() => localStorage.getItem('focus_scratchpad') || '');

  useEffect(() => {
    localStorage.setItem('focus_scratchpad', notes);
  }, [notes]);

  return (
    <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-cyan)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <PenTool size={16} /> Quick Notes
      </h3>
      
      <textarea 
        className="premium-input"
        placeholder="Jot down quick thoughts here... (Auto-saves)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ 
          minHeight: '120px', 
          resize: 'vertical', 
          fontSize: '0.85rem',
          backgroundColor: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      />
    </div>
  );
}
