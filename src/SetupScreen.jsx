import { useState } from 'react';
import { Play, Flame, Award, Settings2, Shield } from 'lucide-react';
import { getRankFromPoints } from './utils/levels';

export default function SetupScreen({ onStart, stats, initialGeminiKey }) {
  const [materialType, setMaterialType] = useState('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [password, setPassword] = useState('');
  const [geminiKey, setGeminiKey] = useState(initialGeminiKey || '');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isPomodoro, setIsPomodoro] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  const rankInfo = getRankFromPoints(stats.points);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    let finalPdfUrl = pdfUrl;
    if (materialType === 'youtube') {
      if (!videoUrl) return setError('Please enter a YouTube URL');
      try { new URL(videoUrl); } catch { return setError('Invalid YouTube URL'); }
    } else {
      if (!pdfUrl) return setError('Please enter a PDF URL or upload one');
    }

    let spotifyId = '';
    let spotifyType = 'playlist';
    if (spotifyUrl) {
      const trackMatch = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
      const playlistMatch = spotifyUrl.match(/playlist\/([a-zA-Z0-9]+)/);
      const albumMatch = spotifyUrl.match(/album\/([a-zA-Z0-9]+)/);
      
      if (trackMatch) { spotifyId = trackMatch[1]; spotifyType = 'track'; }
      else if (playlistMatch) { spotifyId = playlistMatch[1]; spotifyType = 'playlist'; }
      else if (albumMatch) { spotifyId = albumMatch[1]; spotifyType = 'album'; }
    }

    onStart({ 
      materialType,
      videoUrl: materialType === 'youtube' ? videoUrl : '', 
      pdfUrl: finalPdfUrl,
      password, 
      geminiKey,
      spotifyEmbedUrl: spotifyId ? `https://open.spotify.com/embed/${spotifyType}/${spotifyId}?utm_source=generator&theme=0` : '',
      isPomodoro
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      const fileUrl = URL.createObjectURL(file);
      setPdfUrl(fileUrl);
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  return (
    <div className="minimal-setup-wrapper">
      
      {/* Top Right Stats Badge */}
      <div className="minimal-stats-badge">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Flame size={14} color="var(--danger)" /> {stats.streak}
        </div>
        <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: rankInfo.color }}>
          <Award size={14} /> Lvl {rankInfo.level}
        </div>
      </div>

      <div className="minimal-container">
        
        <h1 className="minimal-title">F O C U S</h1>
        <p className="minimal-subtitle">Enter your study material to begin.</p>

        <form onSubmit={handleSubmit} className="minimal-form">
          
          <div className="minimal-toggle-group">
            <button 
              type="button" 
              className={`minimal-toggle-btn ${materialType === 'youtube' ? 'active' : ''}`}
              onClick={() => setMaterialType('youtube')}
            >
              YouTube
            </button>
            <button 
              type="button" 
              className={`minimal-toggle-btn ${materialType === 'pdf' ? 'active' : ''}`}
              onClick={() => setMaterialType('pdf')}
            >
              PDF Document
            </button>
          </div>

          <div className="minimal-input-wrapper">
            {materialType === 'youtube' ? (
              <input 
                type="text" 
                className="minimal-main-input" 
                placeholder="Paste YouTube URL..." 
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            ) : (
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <input 
                  type="text" 
                  className="minimal-main-input" 
                  placeholder="Paste PDF URL..." 
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                />
                <label className="minimal-upload-btn">
                  Upload
                  <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>
              </div>
            )}
          </div>

          {/* Advanced Options Toggle */}
          <button type="button" className="minimal-advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
            <Settings2 size={14} /> {showAdvanced ? 'Hide Options' : 'Options'}
          </button>

          {showAdvanced && (
            <div className="minimal-advanced-panel">
              <input 
                type="text" 
                className="minimal-sub-input" 
                placeholder="Spotify Playlist URL (Optional)" 
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
              />
              <input 
                type="password" 
                className="minimal-sub-input" 
                placeholder="Gemini API Key (Optional)" 
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
              <input 
                type="password" 
                className="minimal-sub-input" 
                placeholder="Emergency Exit Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label className="minimal-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={isPomodoro}
                  onChange={(e) => setIsPomodoro(e.target.checked)}
                />
                Enable 25/5 Pomodoro Mode
              </label>
            </div>
          )}

          {error && <div className="minimal-error">{error}</div>}

          <button type="submit" className="minimal-start-btn">
            <Play size={16} fill="currentColor" /> INITIATE DEEP WORK
          </button>

        </form>

      </div>
    </div>
  );
}
