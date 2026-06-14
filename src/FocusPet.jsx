import React from 'react';

export default function FocusPet({ isDead, isPlaying }) {
  // Simple CSS/SVG Virtual Pet
  
  let petStatus = 'sleeping'; // Default to focusing peacefully
  if (isDead) petStatus = 'angry';
  else if (!isPlaying) petStatus = 'awake';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
      
      {/* SVG Pet Container */}
      <div style={{ position: 'relative', width: '100px', height: '100px' }}>
        
        {/* Sleeping Pet */}
        {petStatus === 'sleeping' && (
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <circle cx="50" cy="50" r="40" fill="var(--accent-cyan)" opacity="0.8" />
            <path d="M 30 50 Q 40 60 50 50 M 50 50 Q 60 60 70 50" fill="transparent" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <text x="70" y="30" fill="white" fontSize="16" fontFamily="monospace" style={{ animation: 'float 2s infinite' }}>z</text>
            <text x="80" y="20" fill="white" fontSize="20" fontFamily="monospace" style={{ animation: 'float 2.5s infinite' }}>Z</text>
          </svg>
        )}

        {/* Awake Pet (Paused) */}
        {petStatus === 'awake' && (
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <circle cx="50" cy="50" r="40" fill="#ffb700" opacity="0.8" />
            <circle cx="35" cy="45" r="5" fill="white" />
            <circle cx="65" cy="45" r="5" fill="white" />
            <path d="M 40 65 Q 50 75 60 65" fill="transparent" stroke="white" strokeWidth="4" strokeLinecap="round" />
          </svg>
        )}

        {/* Angry Pet (Broken Focus) */}
        {petStatus === 'angry' && (
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <circle cx="50" cy="50" r="40" fill="var(--danger)" opacity="0.9" style={{ animation: 'shake 0.5s infinite' }} />
            <path d="M 25 35 L 40 45 M 75 35 L 60 45" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <circle cx="35" cy="50" r="4" fill="white" />
            <circle cx="65" cy="50" r="4" fill="white" />
            <path d="M 40 70 Q 50 60 60 70" fill="transparent" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <path d="M 45 20 L 55 10 L 60 25 Z" fill="white" opacity="0.5" />
          </svg>
        )}
      </div>

      <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>
        {petStatus === 'sleeping' && "Deep Focus Mode"}
        {petStatus === 'awake' && "Awaiting Orders"}
        {petStatus === 'angry' && "Focus Broken!"}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); opacity: 0; }
          50% { transform: translateY(-10px); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}
