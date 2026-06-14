import { useState, useEffect, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import GeminiAssistant from './GeminiAssistant';
import FocusTracker from './FocusTracker';
import UnlockModal from './UnlockModal';

function FocusMode({ sessionData, onEnd }) {
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
      } else if (showWarning) {
        // Returned to tab, but needs to re-enter fullscreen or dismiss warning
        // Let's keep it paused until they interact
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [showWarning]);

  // Anti-cheat: Fullscreen change (pressing ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Exited full screen!
        setIsPlaying(false);
        setShowUnlockModal(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleFocusBroken = () => {
    setIsPlaying(false);
    setIsDead(true);
    setShowWarning(true);
  };

  const resumeFocus = async () => {
    setShowWarning(false);
    setIsDead(false);
    // Attempt to re-enter full screen
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
    // Video finished naturally!
    onEnd(true, Math.floor(focusSeconds / 10));
  };

  const forceQuit = () => {
    // User gave up
    onEnd(false, 0);
  };

  const safeExit = () => {
    // Exited early but legally (with password), maybe give half points or 0 points but keep streak?
    // Let's say safe exit gives 0 points but keeps streak
    // The requirement says "exiting early will not reward points", but keeps streak.
    // However, the App.jsx logic currently: handleEndFocus(success, points)
    onEnd(true, 0);
  };

  const cancelUnlock = () => {
    setShowUnlockModal(false);
    resumeFocus();
  };

  return (
    <div className="focus-container" ref={containerRef}>
      
      {/* Gamification Core */}
      <FocusTracker focusSeconds={focusSeconds} isDead={isDead} />

      {/* Main Video Area */}
      <div className="video-section">
        <VideoPlayer 
          videoUrl={sessionData.videoUrl} 
          isPlaying={isPlaying} 
          onEnd={handleVideoEnd}
        />
      </div>

      {/* AI Assistant */}
      <GeminiAssistant apiKey={sessionData.geminiKey} />

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
          onUnlock={safeExit} 
          onCancel={cancelUnlock}
          forceQuit={forceQuit}
        />
      )}
    </div>
  );
}

export default FocusMode;
