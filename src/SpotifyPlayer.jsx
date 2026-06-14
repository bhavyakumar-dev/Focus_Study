import { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Music, PlayCircle, PauseCircle, SkipForward } from 'lucide-react';

function SpotifyPlayer({ embedUrl, globalPoints, onSpendPoints, isPlaying }) {
  const [isLocked, setIsLocked] = useState(true);
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const playerControllerRef = useRef(null);
  
  const UNLOCK_COST = 5; 
  const CONTROL_COST = 2; // Cost to just skip or play/pause without unlocking fully

  useEffect(() => {
    // Load Spotify IFrame API
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed-podcast/iframe-api/v1";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      const element = containerRef.current;
      const options = {
        width: '100%',
        height: '152',
        uri: embedUrl.split('embed/')[1]?.split('?')[0] ? `spotify:${embedUrl.split('embed/')[1].split('?')[0].replace('/', ':')}` : ''
      };
      const callback = (EmbedController) => {
        playerControllerRef.current = EmbedController;
      };
      if (options.uri) {
        IFrameAPI.createController(element, options, callback);
      }
    };

    return () => {
      document.body.removeChild(script);
      delete window.onSpotifyIframeApiReady;
    };
  }, [embedUrl]);

  // Handle Focus Mode pause/resume
  useEffect(() => {
    if (playerControllerRef.current) {
      if (!isPlaying) {
        playerControllerRef.current.pause();
      } else {
        // We could auto-resume, but Spotify might block auto-play without interaction.
        // Let's try to resume.
        playerControllerRef.current.resume();
      }
    }
  }, [isPlaying]);

  const handleUnlock = () => {
    if (globalPoints >= UNLOCK_COST) {
      const success = onSpendPoints(UNLOCK_COST);
      if (success) {
        setIsLocked(false);
        setError('');
        setTimeout(() => setIsLocked(true), 10000);
      }
    } else {
      setError(`Need ${UNLOCK_COST} points.`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleControl = (action) => {
    if (globalPoints >= CONTROL_COST) {
      const success = onSpendPoints(CONTROL_COST);
      if (success && playerControllerRef.current) {
        if (action === 'toggle') playerControllerRef.current.togglePlay();
        if (action === 'next') playerControllerRef.current.next();
      }
    } else {
      setError(`Need ${CONTROL_COST} points.`);
      setTimeout(() => setError(''), 3000);
    }
  };

  if (!embedUrl) return null;

  return (
    <div className="spotify-container glass-panel">
      <div className="spotify-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
          <Music size={14} /> FOCUS MUSIC
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Your Points: <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>{globalPoints}</span>
        </span>
      </div>

      <div className="spotify-player-wrapper">
        <div ref={containerRef}></div>

        {isLocked && (
          <div className="spotify-lock-overlay" style={{ gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="premium-button" onClick={() => handleControl('toggle')} style={{ padding: '8px', display: 'flex', alignItems: 'center' }} title="Toggle Play (2 Pts)">
                <PlayCircle size={20} />
              </button>
              <button className="premium-button" onClick={() => handleControl('next')} style={{ padding: '8px', display: 'flex', alignItems: 'center' }} title="Next Track (2 Pts)">
                <SkipForward size={20} />
              </button>
            </div>
            <button className="premium-button" onClick={handleUnlock} style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--text-muted)' }}>
              <Unlock size={16} /> Unlock Player (Cost: {UNLOCK_COST} Pts)
            </button>
            {error && <div className="error-text" style={{ fontSize: '0.8rem' }}>{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default SpotifyPlayer;
