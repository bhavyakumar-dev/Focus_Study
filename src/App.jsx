import { useState, useEffect } from 'react';
import SetupScreen from './SetupScreen';
import FocusMode from './FocusMode';
import LoginScreen from './LoginScreen';
import AnalyticsDashboard from './AnalyticsDashboard';
import { Activity } from 'lucide-react';

function App() {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [sessionData, setSessionData] = useState({
    materialType: 'youtube',
    videoUrl: '',
    pdfUrl: '',
    password: '',
    geminiKey: localStorage.getItem('geminiKey') || '',
    spotifyEmbedUrl: ''
  });

  const [stats, setStats] = useState({
    points: parseInt(localStorage.getItem('focusPoints') || '0', 10),
    streak: parseInt(localStorage.getItem('focusStreak') || '0', 10),
  });

  const [sessionLogs, setSessionLogs] = useState(() => {
    const saved = localStorage.getItem('focusSessionLogs');
    return saved ? JSON.parse(saved) : [];
  });

  const [showAnalytics, setShowAnalytics] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('focusUser');
    return saved ? JSON.parse(saved) : { email: 'guest@local', name: 'Guest', isGuest: true };
  });

  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setShowLoginModal(false);
  };

  const handleGuest = () => {
    const guestUser = { email: 'guest@local', name: 'Guest', isGuest: true };
    localStorage.setItem('focusUser', JSON.stringify(guestUser));
    setCurrentUser(guestUser);
  };

  useEffect(() => {
    localStorage.setItem('focusPoints', stats.points.toString());
    localStorage.setItem('focusStreak', stats.streak.toString());
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('focusSessionLogs', JSON.stringify(sessionLogs));
  }, [sessionLogs]);

  const handleStartFocus = (data) => {
    setSessionData({ ...sessionData, ...data });
    if (data.geminiKey) {
      localStorage.setItem('geminiKey', data.geminiKey);
    }
    setIsFocusMode(true);
  };

  const handleEndFocus = (success, pointsEarned, durationSeconds = 0) => {
    setIsFocusMode(false);
    
    const today = new Date().toLocaleDateString();
    const lastStreakDate = localStorage.getItem('lastStreakDate');

    if (success) {
      setStats((prev) => {
        let newStreak = prev.streak;
        // Only increment streak if they haven't succeeded today yet
        if (lastStreakDate !== today) {
          newStreak += 1;
          localStorage.setItem('lastStreakDate', today);
        }
        return {
          ...prev,
          points: prev.points + pointsEarned,
          streak: newStreak,
        };
      });

      // Log the session for Epic 1 Analytics
      setSessionLogs((prev) => [...prev, {
        date: new Date().toLocaleDateString(),
        timestamp: Date.now(),
        duration: durationSeconds,
        xp: pointsEarned,
        type: sessionData.materialType
      }]);
    } else {
      setStats((prev) => ({
        ...prev,
        points: prev.points,
        streak: 0, // Reset streak on failure
      }));
      localStorage.removeItem('lastStreakDate'); // Clear date so they can restart streak tomorrow or today
    }
  };

  const handleSpendPoints = (amount) => {
    if (stats.points >= amount) {
      setStats((prev) => ({
        ...prev,
        points: prev.points - amount
      }));
      return true;
    }
    return false;
  };

  return (
    <div className="app-wrapper">
      {/* Top Bar showing User Info */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 50, display: 'flex', alignItems: 'center', gap: '15px' }}>
        {!isFocusMode && (
          <button 
            onClick={() => setShowAnalytics(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '20px', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
          >
            <Activity size={14} /> Analytics
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '20px', color: 'var(--text-main)', fontSize: '0.8rem', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentUser.isGuest ? 'var(--text-muted)' : 'var(--accent-cyan)' }}></div>
          {currentUser.name}
          {!currentUser.isGuest ? (
             <button onClick={() => { localStorage.removeItem('focusUser'); setCurrentUser({ email: 'guest@local', name: 'Guest', isGuest: true }); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginLeft: '10px', fontSize: '0.7rem' }}>LOGOUT</button>
          ) : (
             <button onClick={() => setShowLoginModal(true)} style={{ background: 'var(--accent-cyan)', border: 'none', borderRadius: '15px', padding: '2px 8px', color: 'black', cursor: 'pointer', marginLeft: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>SIGN IN</button>
          )}
        </div>
      </div>

      {showLoginModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)' }}>
          <button onClick={() => setShowLoginModal(false)} style={{ position: 'absolute', top: 20, right: 20, zIndex: 10000, background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
          <LoginScreen onLogin={handleLogin} onGuest={() => setShowLoginModal(false)} />
        </div>
      )}

      {showAnalytics && <AnalyticsDashboard stats={stats} sessionLogs={sessionLogs} onClose={() => setShowAnalytics(false)} />}

      {/* Dynamic Background Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {!isFocusMode ? (
        <SetupScreen 
          onStart={handleStartFocus} 
          stats={stats} 
          initialGeminiKey={sessionData.geminiKey} 
        />
      ) : (
        <FocusMode 
          sessionData={sessionData} 
          onEnd={handleEndFocus} 
          globalPoints={stats.points}
          onSpendPoints={handleSpendPoints}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

export default App;
