import { useState, useEffect, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import PdfViewer from './PdfViewer';
import GeminiAssistant from './GeminiAssistant';
import FocusTracker from './FocusTracker';
import UnlockModal from './UnlockModal';
import SpotifyPlayer from './SpotifyPlayer';

function FocusMode({ sessionData, onEnd, globalPoints, onSpendPoints }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [isDead, setIsDead] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const containerRef = useRef(null);
  
  // Enter full screen on mount
  useEffect(() => {
    const enterFullscreen = async () => {
      if (containerRef.current && !document.fullscreenElement) {
        try {
          await containerRef.current.requestFullscreen();
        } catch (err) {
          console.error("Error attempting to enable fullscreen:", err);
        }
      }
    };
    enterFullscreen();
  }, []);

  // Timer logic
  useEffect(() => {
    let interval;
    if (isPlaying && !isDead) {
      interval = setInterval(() => {
        setFocusSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isDead]);

  // Anti-cheat: Visibility change (switching tabs/windows)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleFocusBroken();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [showWarning]);

  // Anti-cheat: Fullscreen change (pressing ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsPlaying(false);
        setShowUnlockModal(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Anti-cheat: Aggressive Keyboard Shortcut Blocking
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent standard Tab to stop keyboard navigation escaping the iframe/window if possible
      if (e.key === 'Tab') {
        e.preventDefault();
      }
      
      // We can attempt to prevent default on Ctrl/Alt combos, but modern browsers usually override this.
      if ((e.ctrlKey && e.key === 'Tab') || (e.altKey && e.key === 'Tab')) {
        e.preventDefault();
        // Since we can't reliably block it, we trigger a warning just in case they are trying it
        handleFocusBroken();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFocusBroken = () => {
    setIsPlaying(false);
    setIsDead(true);
    setShowWarning(true);
  };

  const resumeFocus = async () => {
    setShowWarning(false);
    setIsDead(false);
    if (containerRef.current && !document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
      } catch (err) {
        console.error(err);
      }
    }
    setIsPlaying(true);
  };

  const handleVideoEnd = () => {
    onEnd(true, Math.floor(focusSeconds / 10));
  };

  const forceQuit = () => {
    onEnd(false, 0);
  };

  const safeExit = () => {
    onEnd(true, 0);
  };

  const cancelUnlock = () => {
    setShowUnlockModal(false);
    resumeFocus();
  };

  const pdfSafeExit = () => {
    onEnd(true, Math.floor(focusSeconds / 10));
  };

  return (
    <div className="focus-container" ref={containerRef}>
      
      {/* Gamification Core */}
      <FocusTracker focusSeconds={focusSeconds} isDead={isDead} />

      {/* Main Content Area */}
      <div className="video-section">
        {sessionData.materialType === 'youtube' ? (
          <VideoPlayer 
            videoUrl={sessionData.videoUrl} 
            isPlaying={isPlaying} 
            onEnd={handleVideoEnd}
          />
        ) : (
          <PdfViewer pdfUrl={sessionData.pdfUrl} />
        )}
      </div>

      {/* Sidebar Area: AI & Spotify */}
      {(sessionData.geminiKey || sessionData.spotifyEmbedUrl) && (
        <div className="sidebar-container">
          {sessionData.geminiKey && (
            <GeminiAssistant apiKey={sessionData.geminiKey} />
          )}
          {sessionData.spotifyEmbedUrl && (
            <SpotifyPlayer 
              embedUrl={sessionData.spotifyEmbedUrl} 
              globalPoints={globalPoints} 
              onSpendPoints={onSpendPoints} 
              isPlaying={isPlaying}
            />
          )}
        </div>
      )}

      {/* Overlays */}
      {showWarning && (
        <div className="warning-overlay">
          <div className="warning-content glass-panel">
            <h1 className="warning-title">FOCUS BROKEN</h1>
            <p>You switched tabs or lost focus! Your core has been damaged.</p>
            <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>
              Return to your study session immediately to resume.
            </p>
            <button className="premium-button" style={{ marginTop: '30px' }} onClick={resumeFocus}>
              Resume Session
            </button>
          </div>
        </div>
      )}

      {showUnlockModal && (
        <UnlockModal 
          requiredPassword={sessionData.password} 
          onUnlock={sessionData.materialType === 'pdf' ? pdfSafeExit : safeExit} 
          onCancel={cancelUnlock}
          forceQuit={forceQuit}
        />
      )}
    </div>
  );
}

export default FocusMode;
