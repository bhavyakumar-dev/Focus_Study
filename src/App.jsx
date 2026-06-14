import { useState, useEffect } from 'react';
import SetupScreen from './SetupScreen';
import FocusMode from './FocusMode';

function App() {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [sessionData, setSessionData] = useState({
    videoUrl: '',
    password: '',
    geminiKey: localStorage.getItem('geminiKey') || '',
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
    if (success) {
      setStats((prev) => ({
        points: prev.points + pointsEarned,
        streak: prev.streak + 1,
      }));
    } else {
      setStats((prev) => ({
        points: prev.points,
        streak: 0, // Reset streak on failure
      }));
    }
  };

  return (
    <>
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
        />
      )}
    </>
  );
}

export default App;
