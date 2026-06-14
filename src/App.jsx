import { useState, useEffect } from 'react';
import SetupScreen from './SetupScreen';
import FocusMode from './FocusMode';

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

  return (
    <div className="app-container">
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
