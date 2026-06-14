import { useState } from 'react';
import { Play, Flame, Award, Settings2, Shield, Wand2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { getRankFromPoints } from './utils/levels';

export default function SetupScreen({ onStart, stats, initialGeminiKey }) {
  const [materialType, setMaterialType] = useState('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [password, setPassword] = useState('');
  const [geminiKey, setGeminiKey] = useState(initialGeminiKey || '');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [isPomodoro, setIsPomodoro] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [isGeneratingPlaylist, setIsGeneratingPlaylist] = useState(false);

  const handleGeneratePlaylist = async () => {
    if (!geminiKey) {
      return setError('Please enter a Gemini API Key first to generate a playlist.');
    }
    const topic = prompt('What are you focusing on today? (e.g., Coding, Math, Reading, Lo-Fi)');
    if (!topic) return;

    setIsGeneratingPlaylist(true);
    setError('');
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `I am studying/working on: "${topic}". Give me ONLY a single valid Spotify Playlist ID that is great for focusing on this topic. Do not output URLs, JSON, markdown, or any explanation. ONLY the 22-character alphanumeric ID.` }]
          }
        ]
      });
      const generatedId = response.text?.trim();
      if (generatedId) {
        // Build the embed URL based on the ID returned. If the AI returns a full URL by accident, we just use it directly.
        if (generatedId.includes('http')) {
          setSpotifyUrl(generatedId);
        } else {
          setSpotifyUrl(`https://open.spotify.com/playlist/${generatedId}`);
        }
      }
    } catch (err) {
      console.error(err);
      setError('AI Playlist Generation failed. Check API key or network.');
    } finally {
      setIsGeneratingPlaylist(false);
    }
  };

  const rankInfo = getRankFromPoints(stats.points);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    let finalPdfUrl = pdfUrl;
    let finalVideoUrl = videoUrl;

    if (materialType === 'youtube') {
      if (!videoUrl) return setError('Please enter a YouTube URL');
      try { new URL(videoUrl); } catch { return setError('Invalid YouTube URL'); }
    } else if (materialType === 'pdf') {
      if (!pdfUrl) return setError('Please enter a PDF URL or upload one');
      finalVideoUrl = ''; // Clear video
    } else if (materialType === 'code') {
      finalVideoUrl = ''; // Clear video
    }
    // No URL validation needed for 'code'

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
      videoUrl: finalVideoUrl, 
      pdfUrl: finalPdfUrl,
      password, 
      geminiKey,
      roomId,
      roomPassword,
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
            <button 
              type="button" 
              className={`minimal-toggle-btn ${materialType === 'code' ? 'active' : ''}`}
              onClick={() => setMaterialType('code')}
            >
              Code Editor
            </button>
          </div>

          {materialType !== 'code' && (
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
          )}

          {/* Advanced Options Toggle */}
          <button type="button" className="minimal-advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
            <Settings2 size={14} /> {showAdvanced ? 'Hide Options' : 'Options'}
          </button>

          {showAdvanced && (
            <div className="minimal-advanced-panel">
              <input 
                type="password" 
                className="minimal-sub-input" 
                placeholder="Gemini API Key (Needed for AI Assistant & Playlist)" 
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="minimal-sub-input" 
                  style={{ flex: 1 }}
                  placeholder="Spotify Playlist URL (Optional)" 
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                />
                <button 
                  type="button" 
                  className="minimal-upload-btn"
                  onClick={handleGeneratePlaylist}
                  disabled={isGeneratingPlaylist}
                  style={{ backgroundColor: 'rgba(189, 147, 249, 0.2)', color: '#bd93f9', border: '1px solid rgba(189, 147, 249, 0.4)' }}
                >
                  <Wand2 size={14} /> {isGeneratingPlaylist ? '...' : 'AI Generate'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="minimal-sub-input" 
                  style={{ flex: 1 }}
                  placeholder="Study Room Code (Optional)" 
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.trim().toUpperCase())}
                />
                <input 
                  type="password" 
                  className="minimal-sub-input" 
                  style={{ flex: 1 }}
                  placeholder="Room Password" 
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                />
              </div>
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
