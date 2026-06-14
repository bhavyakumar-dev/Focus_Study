import { useState } from 'react';
import { Play, Flame, Award, FileText, Youtube } from 'lucide-react';

function SetupScreen({ onStart, stats, initialGeminiKey }) {
  const [materialType, setMaterialType] = useState('youtube'); // 'youtube' or 'pdf'
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [password, setPassword] = useState('');
  const [geminiKey, setGeminiKey] = useState(initialGeminiKey || '');
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
    if (!geminiKey) {
      setError('Gemini API key is required for the AI assistant');
      return;
    }
    setError('');
    
    onStart({ 
      materialType,
      videoUrl: materialType === 'youtube' ? videoUrl : '', 
      pdfUrl: finalPdfUrl,
      password, 
      geminiKey 
    });
  };

  return (
    <div className="setup-container">
      <div className="setup-card glass-panel">
        <h1 className="setup-title">FOCUS CORE</h1>
        
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <Flame size={24} color="var(--danger)" /> {stats.streak}
            </div>
            <div className="stat-label">Day Streak</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <Award size={24} color="var(--accent-purple)" /> {stats.points}
            </div>
            <div className="stat-label">Total Points</div>
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
              <Youtube size={20}/> Video
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
            <label className="stat-label" style={{ display: 'block', marginBottom: '5px' }}>Emergency Exit Password</label>
            <input 
              type="password" 
              className="premium-input" 
              placeholder="Set a password to exit early" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="stat-label" style={{ display: 'block', marginBottom: '5px' }}>Gemini API Key</label>
            <input 
              type="password" 
              className="premium-input" 
              placeholder="AI requires a Gemini API Key" 
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
            />
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
