import { useState, useEffect } from 'react';
import SetupScreen from './SetupScreen';
import FocusMode from './FocusMode';
import LoginScreen from './LoginScreen';

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

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('focusUser');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (user) => {
    setCurrentUser(user);
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

  const handleStartFocus = (data) => {
    setSessionData({ ...sessionData, ...data });
    if (data.geminiKey) {
      localStorage.setItem('geminiKey', data.geminiKey);
    }
    setIsFocusMode(true);
  };

  const handleEndFocus = (success, pointsEarned) => {
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

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} onGuest={handleGuest} />;
  }

  return (
    <div className="app-wrapper">
      {/* Top Bar showing User Info */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 50, display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '20px', color: 'var(--text-main)', fontSize: '0.8rem', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentUser.isGuest ? 'var(--text-muted)' : 'var(--accent-cyan)' }}></div>
        {currentUser.name}
        <button onClick={() => { localStorage.removeItem('focusUser'); setCurrentUser(null); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginLeft: '10px', fontSize: '0.7rem' }}>LOGOUT</button>
      </div>

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
        />
      )}
    </div>
  );
}

export default App;
