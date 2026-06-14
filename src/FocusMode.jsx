import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import PdfViewer from './PdfViewer';
import GeminiAssistant from './GeminiAssistant';
import FocusTracker from './FocusTracker';
import UnlockModal from './UnlockModal';
import SpotifyPlayer from './SpotifyPlayer';
import AmbientMixer from './AmbientMixer';
import TaskManager from './TaskManager';
import Scratchpad from './Scratchpad';
import CodeEditor from './CodeEditor';
import { getRankFromPoints } from './utils/levels';

function FocusMode({ sessionData, onEnd, globalPoints, onSpendPoints }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [isDead, setIsDead] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  // Pomodoro States
  const [pomodoroPhase, setPomodoroPhase] = useState('work'); // 'work' or 'break'
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
        
        if (sessionData.isPomodoro) {
          setPomodoroTimeLeft((prev) => {
            if (prev <= 1) {
              // Switch phase
              const newPhase = pomodoroPhase === 'work' ? 'break' : 'work';
              setPomodoroPhase(newPhase);
              
              // Play a sound? (Optional, maybe later)
              return newPhase === 'work' ? 25 * 60 : 5 * 60;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isDead, sessionData.isPomodoro, pomodoroPhase]);

  // Anti-cheat: Visibility change (switching tabs/windows)
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Ignore visibility cheat during Pomodoro Break!
      if (sessionData.isPomodoro && pomodoroPhase === 'break') return;

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
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 40, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <FocusTracker focusSeconds={focusSeconds} isDead={isDead} />
        
        {/* Pomodoro Display */}
        {sessionData.isPomodoro && (
          <div className="glass-panel" style={{ padding: '10px 15px', color: pomodoroPhase === 'work' ? 'var(--danger)' : 'var(--accent-cyan)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {pomodoroPhase === 'work' ? 'FOCUS PHASE' : 'BREAK TIME (FREE ROAM)'}
            </div>
            <div style={{ fontSize: '1.5rem', fontFamily: 'monospace' }}>
              {Math.floor(pomodoroTimeLeft / 60).toString().padStart(2, '0')}:
              {(pomodoroTimeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="video-section">
        {/* Collapsible Sidebar Toggle */}
        <button 
          className="sidebar-toggle-btn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{ right: isSidebarOpen ? '370px' : '20px' }}
        >
          {isSidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {sessionData.materialType === 'youtube' ? (
          <VideoPlayer 
            videoUrl={sessionData.videoUrl} 
            isPlaying={isPlaying} 
            onEnd={handleVideoEnd}
          />
        ) : sessionData.materialType === 'code' ? (
          <CodeEditor />
        ) : (
          <PdfViewer pdfUrl={sessionData.pdfUrl} />
        )}
      </div>

      {/* Sidebar Area: Utilities, AI, & Media */}
      <div className={`sidebar-section ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
          {sessionData.geminiKey && (
            <GeminiAssistant apiKey={sessionData.geminiKey} />
          )}
          
          {/* Ambient Sounds */}
          <AmbientMixer />

          {/* Task Manager */}
          <TaskManager />

          {/* Quick Notes */}
          <Scratchpad />

          {sessionData.spotifyEmbedUrl && (
            <SpotifyPlayer 
              embedUrl={sessionData.spotifyEmbedUrl} 
              globalPoints={globalPoints} 
              onSpendPoints={onSpendPoints} 
              isPlaying={isPlaying}
            />
          )}
        </div>

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
