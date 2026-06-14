import React, { useEffect, useState } from 'react';
import { Users, AlertTriangle, Hand } from 'lucide-react';
import { MultiplayerService } from './MultiplayerService';

export default function MultiplayerWidget({ roomId, currentUser, isDead, focusSeconds }) {
  const [users, setUsers] = useState({});
  const [service, setService] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomId) return;
    
    const mp = new MultiplayerService(roomId, currentUser);
    
    mp.joinRoom().then((success) => {
      if (!success) {
        setError('Firebase not configured. Multiplayer offline.');
        return;
      }
      setService(mp);
      mp.listen((roomUsers) => {
        setUsers(roomUsers || {});
      });
    });

    return () => {
      mp.leaveRoom();
    };
  }, [roomId, currentUser]);

  useEffect(() => {
    if (service) {
      service.updateState({ isDead, xp: Math.floor(focusSeconds / 60) * 10 });
    }
  }, [isDead, Math.floor(focusSeconds / 60), service]);

  useEffect(() => {
    // Check if I got slapped!
    if (!service) return;
    const myId = btoa(currentUser.email).substring(0, 15);
    const me = users[myId];
    if (me && me.slappedBy && me.slapTime) {
      // Check if slap was recent (within 5 seconds) to avoid infinite loops on reload
      if (Date.now() - me.slapTime < 5000) {
        // Play a sound or alert
        alert(`WAKE UP! You were slapped by ${me.slappedBy} for being distracted!`);
      }
    }
  }, [users, currentUser]);

  const handleSlap = (userId) => {
    if (service) service.slapUser(userId);
  };

  if (!roomId) return null;

  return (
    <div className="glass-panel" style={{ padding: '15px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <Users size={16} /> Room: {roomId.toUpperCase()}
      </h3>

      {error ? (
        <div style={{ color: 'var(--danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <AlertTriangle size={14} /> {error}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
          {Object.entries(users).map(([id, u]) => {
            if (!u) return null;
            const isMe = id === btoa(currentUser.email).substring(0, 15);
            return (
              <div key={id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px',
                borderLeft: u.isDead ? '3px solid var(--danger)' : '3px solid var(--accent-cyan)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{u.name} {isMe && '(You)'}</span>
                  <span style={{ fontSize: '0.7rem', color: u.isDead ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {u.isDead ? 'DISTRACTED' : `Focusing - ${u.xp} XP`}
                  </span>
                </div>
                {!isMe && u.isDead && (
                  <button 
                    onClick={() => handleSlap(id)}
                    title="Slap them back to work!"
                    style={{ background: 'var(--danger)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                  >
                    <Hand size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
