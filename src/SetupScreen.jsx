import { useState } from 'react';
import { Play, Flame, Award, FileText, Video, Music, Star } from 'lucide-react';
import { getRankFromPoints } from './utils/levels';

function SetupScreen({ onStart, stats, initialGeminiKey }) {
  const [materialType, setMaterialType] = useState('youtube'); // 'youtube' or 'pdf'
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [password, setPassword] = useState('');
  const [geminiKey, setGeminiKey] = useState(initialGeminiKey || '');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isPomodoro, setIsPomodoro] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    let finalPdfUrl = null;

    if (materialType === 'youtube') {
      if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
        setError('Please enter a valid YouTube URL');
        return;
      }
    } else {
      if (!pdfFile) {
        setError('Please select a PDF file');
        return;
      }
      finalPdfUrl = URL.createObjectURL(pdfFile);
    }

    if (!password) {
      setError('Please set an emergency exit password');
      return;
    }
    
    // Validate Spotify URL if provided
    let spotifyId = '';
    let spotifyType = '';
    if (spotifyUrl) {
      if (!spotifyUrl.includes('spotify.com')) {
        setError('Please enter a valid Spotify URL or leave blank');
        return;
      }
      try {
        const urlObj = new URL(spotifyUrl);
        const parts = urlObj.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          spotifyType = parts[0]; // e.g., 'playlist', 'album', 'track'
          spotifyId = parts[1];
        }
      } catch (e) {
        setError('Invalid Spotify URL');
        return;
      }
    }

    setError('');
    
    onStart({ 
      materialType,
      videoUrl: materialType === 'youtube' ? videoUrl : '', 
      pdfUrl: finalPdfUrl,
      password, 
      geminiKey,
      spotifyEmbedUrl: spotifyId ? `https://open.spotify.com/embed/${spotifyType}/${spotifyId}?utm_source=generator` : '',
      isPomodoro
    });
  };

  const rankInfo = getRankFromPoints(stats.points);

  return (
    <div className="setup-container">
      <div className="setup-card glass-panel">
        <h1 className="setup-title">FOCUS CORE</h1>
        
        <div className="stats-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
            <div className="stat-item" style={{ flex: 1 }}>
              <div className="stat-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <Flame size={24} color="var(--danger)" /> {stats.streak}
              </div>
              <div className="stat-label">Day Streak</div>
            </div>
            <div className="stat-item" style={{ flex: 1 }}>
              <div className="stat-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: rankInfo.color }}>
                <Award size={24} color={rankInfo.color} /> Lvl {rankInfo.level}
              </div>
              <div className="stat-label">{rankInfo.title}</div>
            </div>
          </div>
          
          {/* Rank Progress Bar */}
          <div style={{ padding: '0 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
              <span>{stats.points} XP</span>
              <span>{rankInfo.nextRankPoints ? `${rankInfo.nextRankPoints} XP` : 'MAX'}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${rankInfo.progressToNextRank}%`, height: '100%', background: rankInfo.color, transition: 'width 0.5s ease' }}></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button"
              className={`premium-button ${materialType === 'youtube' ? '' : 'danger-button'}`}
              style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '10px', background: materialType === 'youtube' ? '' : 'rgba(255,255,255,0.05)', color: materialType === 'youtube' ? '' : 'var(--text-muted)', border: '1px solid var(--glass-border)' }}
              onClick={() => setMaterialType('youtube')}
            >
              <Video size={20}/> Video
            </button>
            <button 
              type="button"
              className={`premium-button ${materialType === 'pdf' ? '' : 'danger-button'}`}
              style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '10px', background: materialType === 'pdf' ? '' : 'rgba(255,255,255,0.05)', color: materialType === 'pdf' ? '' : 'var(--text-muted)', border: '1px solid var(--glass-border)' }}
              onClick={() => setMaterialType('pdf')}
            >
              <FileText size={20}/> PDF
            </button>
          </div>

          {materialType === 'youtube' ? (
            <div>
              <label className="stat-label" style={{ display: 'block', marginBottom: '5px' }}>YouTube Video URL</label>
              <input 
                type="text" 
                className="premium-input" 
                placeholder="https://www.youtube.com/watch?v=..." 
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="stat-label" style={{ display: 'block', marginBottom: '5px' }}>Upload PDF Document</label>
              <input 
                type="file" 
                accept="application/pdf"
                className="premium-input" 
                onChange={(e) => setPdfFile(e.target.files[0])}
              />
            </div>
          )}

          <div>
            <label className="stat-label" style={{ display: 'block', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Music size={14}/> Spotify Playlist / Album URL (Optional)
            </label>
            <input 
              type="text" 
              className="premium-input" 
              placeholder="e.g. https://open.spotify.com/playlist/..." 
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="stat-label" style={{ display: 'block', marginBottom: '5px' }}>Gemini API Key (Optional)</label>
            <input 
              type="password" 
              className="premium-input" 
              placeholder="Leave blank to disable AI" 
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
            />
          </div>

          <div>
            <label className="stat-label" style={{ display: 'block', marginBottom: '5px' }}>Emergency Exit Password</label>
            <input 
              type="password" 
              className="premium-input" 
              placeholder="Set a password to exit early" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
            <input 
              type="checkbox" 
              id="pomodoro-toggle"
              checked={isPomodoro}
              onChange={(e) => setIsPomodoro(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-purple)' }}
            />
            <label htmlFor="pomodoro-toggle" className="stat-label" style={{ cursor: 'pointer' }}>Enable Pomodoro Mode (25m Focus / 5m Break)</label>
          </div>

          {error && <div className="error-text">{error}</div>}

          <button type="submit" className="premium-button" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <Play size={20} /> Initialize Core
          </button>
        </form>
      </div>
    </div>
  );
}

export default SetupScreen;
