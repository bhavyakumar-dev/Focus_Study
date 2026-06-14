import React, { useMemo } from 'react';
import { Activity, Clock, Zap, Target, X } from 'lucide-react';

export default function AnalyticsDashboard({ stats, sessionLogs, onClose }) {
  // Compute analytics
  const totalFocusTime = useMemo(() => {
    return sessionLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
  }, [sessionLogs]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  // Generate a mock heatmap grid for 100 days
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    // Create last 84 days (12 weeks)
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toLocaleDateString();
      const logsForDay = sessionLogs.filter(l => l.date === dateString);
      const daySeconds = logsForDay.reduce((acc, log) => acc + log.duration, 0);
      
      let intensity = 0; // 0-4
      if (daySeconds > 0) intensity = 1;
      if (daySeconds > 3600) intensity = 2; // > 1 hr
      if (daySeconds > 7200) intensity = 3; // > 2 hrs
      if (daySeconds > 14400) intensity = 4; // > 4 hrs

      days.push({ date: dateString, intensity, seconds: daySeconds });
    }
    return days;
  }, [sessionLogs]);

  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case 1: return 'rgba(0, 255, 204, 0.3)';
      case 2: return 'rgba(0, 255, 204, 0.6)';
      case 3: return 'rgba(0, 255, 204, 0.8)';
      case 4: return 'rgba(0, 255, 204, 1.0)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
        position: 'relative', padding: '40px'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <h2 className="cyber-title" style={{ fontSize: '2rem', marginBottom: '30px' }}><Activity size={28} /> Neural Analytics</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
            <Clock size={24} color="var(--accent-purple)" style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Deep Work</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{formatTime(totalFocusTime)}</div>
          </div>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
            <Zap size={24} color="var(--accent-cyan)" style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Lifetime XP</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.points}</div>
          </div>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
            <Target size={24} color="var(--danger)" style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Highest Streak</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.streak} Days</div>
          </div>
        </div>

        <h3 style={{ marginBottom: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={18} /> Contribution Heatmap
        </h3>
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '40px', overflowX: 'auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(12, 1fr)', 
            gridAutoFlow: 'column', 
            gridTemplateRows: 'repeat(7, 1fr)', 
            gap: '6px',
            width: 'max-content'
          }}>
            {heatmapDays.map((day, i) => (
              <div 
                key={i}
                title={`${day.date}: ${formatTime(day.seconds)}`}
                style={{
                  width: '14px', height: '14px', borderRadius: '3px',
                  backgroundColor: getIntensityColor(day.intensity),
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.2)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>12 Weeks Ago</span>
            <span>Today</span>
          </div>
        </div>

        <h3 style={{ marginBottom: '15px', color: 'var(--text-main)' }}>Recent Sessions</h3>
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.9rem' }}>Date</th>
                <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.9rem' }}>Material</th>
                <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.9rem' }}>Duration</th>
                <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.9rem' }}>XP Earned</th>
              </tr>
            </thead>
            <tbody>
              {sessionLogs.slice().reverse().slice(0, 10).map((log, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '15px', fontSize: '0.9rem' }}>{log.date}</td>
                  <td style={{ padding: '15px', fontSize: '0.9rem', textTransform: 'capitalize' }}>{log.type}</td>
                  <td style={{ padding: '15px', fontSize: '0.9rem' }}>{formatTime(log.duration)}</td>
                  <td style={{ padding: '15px', fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>+{log.xp} XP</td>
                </tr>
              ))}
              {sessionLogs.length === 0 && (
                <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No sessions recorded yet. Enter Focus Mode to begin tracking.</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
