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
import { Lock, Unlock, Command, Clock, Zap, Activity } from 'lucide-react';
import WidgetPanel from './WidgetPanel';
import MultiplayerWidget from './MultiplayerWidget';
import HealthProtocols from './HealthProtocols';
import FocusPet from './FocusPet';
import CommandPalette from './CommandPalette';

function FocusMode({ sessionData, onEnd, globalPoints, onSpendPoints, currentUser }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [isDead, setIsDead] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isWidgetsLocked, setIsWidgetsLocked] = useState(true);
  
  // Pomodoro States
  const [pomodoroPhase, setPomodoroPhase] = useState('work'); // 'work' or 'break'
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const containerRef = useRef(null);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
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

  const handleEndSession = () => {
    // Only grant points if they were not distracted
    if (!isDead) {
      const earnedPoints = Math.floor(focusSeconds / 60) * 10;
      onEnd(true, earnedPoints, focusSeconds);
    } else {
      onEnd(false, 0, focusSeconds);
    }
  };

  const handleVideoEnd = () => {
    onEnd(true, Math.floor(focusSeconds / 10), focusSeconds);
  };

  const forceQuit = () => {
    onEnd(false, 0, focusSeconds);
  };

  const safeExit = () => {
    onEnd(true, 0, focusSeconds);
  };

  const cancelUnlock = () => {
    setShowUnlockModal(false);
    resumeFocus();
  };

  const pdfSafeExit = () => {
    onEnd(true, Math.floor(focusSeconds / 10));
  };

  const handleCommand = (cmdId) => {
    switch (cmdId) {
      case '__open_palette': setIsPaletteOpen(true); break;
      case 'toggle-widgets': setIsWidgetsLocked(!isWidgetsLocked); break;
      case 'end-session': handleEndSession(); break;
      case 'fullscreen':
        if (containerRef.current && !document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch(() => {});
        }
        break;
      default: break;
    }
  };

  return (
    <div className="focus-container" ref={containerRef}>
      <HealthProtocols isPlaying={isPlaying} isDead={isDead} />
      
      {/* Lock Widgets Toggle */}
      <button 
        className="sidebar-toggle-btn"
        onClick={() => setIsWidgetsLocked(!isWidgetsLocked)}
        style={{ right: '20px', top: '20px', zIndex: 1000, background: isWidgetsLocked ? 'rgba(0,0,0,0.5)' : 'var(--danger)' }}
        title="Toggle Widget Dragging"
      >
        {isWidgetsLocked ? <Lock size={20} /> : <Unlock size={20} />}
      </button>

      {/* Gamification Core Widget */}
      <WidgetPanel title="Core" defaultPosition={{ x: 20, y: 20 }} isLocked={isWidgetsLocked} zIndex={40}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
      </WidgetPanel>

      {/* Main Content Area */}
      <div className="video-section" style={{ paddingRight: 0 }}>
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

      {/* Draggable Widgets */}
      {sessionData.geminiKey && (
        <WidgetPanel title="AI Assistant" defaultPosition={{ x: 800, y: 80 }} isLocked={isWidgetsLocked}>
          <GeminiAssistant apiKey={sessionData.geminiKey} />
        </WidgetPanel>
      )}
      
      <WidgetPanel title="Ambient Sounds" defaultPosition={{ x: 800, y: 450 }} isLocked={isWidgetsLocked}>
        <AmbientMixer />
      </WidgetPanel>

      <WidgetPanel title="Task Manager" defaultPosition={{ x: 800, y: 600 }} isLocked={isWidgetsLocked}>
        <TaskManager />
      </WidgetPanel>

      <WidgetPanel title="Quick Notes" defaultPosition={{ x: 20, y: 200 }} isLocked={isWidgetsLocked}>
        <Scratchpad />
      </WidgetPanel>

      <WidgetPanel title="Focus Pet" defaultPosition={{ x: 20, y: 400 }} isLocked={isWidgetsLocked}>
        <FocusPet isDead={isDead} isPlaying={isPlaying} />
      </WidgetPanel>

      {sessionData.roomId && (
        <WidgetPanel title="Multiplayer Sync" defaultPosition={{ x: 20, y: 600 }} isLocked={isWidgetsLocked}>
          <MultiplayerWidget 
            roomId={sessionData.roomId} 
            roomPassword={sessionData.roomPassword}
            currentUser={currentUser} 
            isDead={isDead} 
            focusSeconds={focusSeconds} 
          />
        </WidgetPanel>
      )}

      {sessionData.spotifyEmbedUrl && (
        <WidgetPanel title="Spotify" defaultPosition={{ x: 300, y: 20 }} isLocked={isWidgetsLocked}>
          <SpotifyPlayer 
            embedUrl={sessionData.spotifyEmbedUrl} 
            globalPoints={globalPoints} 
            onSpendPoints={onSpendPoints} 
            isPlaying={isPlaying}
          />
        </WidgetPanel>
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

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isPaletteOpen} 
        onClose={() => setIsPaletteOpen(false)} 
        onCommand={handleCommand} 
      />

      {/* ═══ Status Bar ═══ */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '24px',
        backgroundColor: 'rgba(0, 120, 212, 0.9)', display: 'flex', alignItems: 'center',
        padding: '0 12px', gap: '16px', fontSize: '0.7rem', color: 'white',
        zIndex: 50, backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={11} /> {isDead ? 'BROKEN' : isPlaying ? 'DEEP FOCUS' : 'PAUSED'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={11} /> {formatTime(focusSeconds)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Activity size={11} /> {Math.floor(focusSeconds / 60) * 10} XP
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ opacity: 0.7, cursor: 'pointer' }} onClick={() => setIsPaletteOpen(true)} title="Command Palette (Ctrl+K)">
          <Command size={11} /> Ctrl+K
        </div>
        <div style={{ opacity: 0.7 }}>
          {sessionData.materialType === 'code' ? 'IDE Mode' : sessionData.materialType === 'youtube' ? 'Video Mode' : 'PDF Mode'}
        </div>
      </div>
    </div>
  );
}

export default FocusMode;
