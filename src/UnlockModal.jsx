import { useState } from 'react';
import { AlertOctagon } from 'lucide-react';

function UnlockModal({ requiredPassword, onUnlock, onCancel, forceQuit }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === requiredPassword) {
      onUnlock();
    } else {
      setError('Incorrect password. Focus session is still active.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <h2 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertOctagon /> EMERGENCY EXIT
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Exiting early will not reward points. Enter password to safely exit, or force quit and lose your streak.
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="password"
            className="premium-input"
            placeholder="Enter session password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
          {error && <div className="error-text">{error}</div>}
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" className="premium-button" style={{ flex: 1 }}>Unlock</button>
            <button type="button" className="premium-button danger-button" style={{ flex: 1 }} onClick={forceQuit}>Force Quit</button>
          </div>
          <button type="button" onClick={onCancel} className="premium-button" style={{ background: 'transparent', border: '1px solid var(--text-muted)' }}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

export default UnlockModal;
