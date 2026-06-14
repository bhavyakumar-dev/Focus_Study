import React, { useState, useEffect } from 'react';
import { Activity, Eye, Droplet, Accessibility } from 'lucide-react';

export default function HealthProtocols({ isPlaying, isDead }) {
  const [postureAlert, setPostureAlert] = useState(false);
  const [waterAlert, setWaterAlert] = useState(false);
  const [eyeAlert, setEyeAlert] = useState(false);
  const [eyeSecondsLeft, setEyeSecondsLeft] = useState(20);

  // Time intervals in seconds
  const POSTURE_INTERVAL = 15 * 60; // 15 mins
  const WATER_INTERVAL = 30 * 60; // 30 mins
  const EYE_INTERVAL = 20 * 60; // 20 mins

  useEffect(() => {
    let postureTimer;
    let waterTimer;
    let eyeTimer;

    if (isPlaying && !isDead) {
      postureTimer = setInterval(() => {
        setPostureAlert(true);
        setTimeout(() => setPostureAlert(false), 5000); // Auto-hide after 5s
      }, POSTURE_INTERVAL * 1000);

      waterTimer = setInterval(() => {
        setWaterAlert(true);
        setTimeout(() => setWaterAlert(false), 5000);
      }, WATER_INTERVAL * 1000);

      eyeTimer = setInterval(() => {
        setEyeAlert(true);
        setEyeSecondsLeft(20);
      }, EYE_INTERVAL * 1000);
    }

    return () => {
      clearInterval(postureTimer);
      clearInterval(waterTimer);
      clearInterval(eyeTimer);
    };
  }, [isPlaying, isDead]);

  useEffect(() => {
    let countdown;
    if (eyeAlert && eyeSecondsLeft > 0) {
      countdown = setInterval(() => {
        setEyeSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (eyeSecondsLeft === 0) {
      setEyeAlert(false);
    }
    return () => clearInterval(countdown);
  }, [eyeAlert, eyeSecondsLeft]);

  return (
    <>
      {/* HUD Alerts */}
      <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 1000 }}>
        {postureAlert && (
          <div className="glass-panel" style={{ background: 'rgba(255,165,0,0.8)', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeIn 0.5s', padding: '10px 20px', borderRadius: '30px' }}>
            <Accessibility size={20} />
            <strong>Posture Check!</strong> Sit up straight and align your spine.
          </div>
        )}

        {waterAlert && (
          <div className="glass-panel" style={{ background: 'rgba(0,191,255,0.8)', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeIn 0.5s', padding: '10px 20px', borderRadius: '30px' }}>
            <Droplet size={20} />
            <strong>Hydration Protocol:</strong> Take a sip of water.
          </div>
        )}
      </div>

      {/* 20-20-20 Full Screen Override */}
      {eyeAlert && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999, color: 'white'
        }}>
          <Eye size={64} color="var(--accent-cyan)" style={{ marginBottom: '20px' }} />
          <h1 style={{ fontSize: '3rem', margin: 0 }}>20-20-20 Rule</h1>
          <p style={{ fontSize: '1.5rem', color: '#ccc' }}>Look 20 feet away for 20 seconds.</p>
          <div style={{ fontSize: '5rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--accent-cyan)', marginTop: '20px' }}>
            00:{eyeSecondsLeft.toString().padStart(2, '0')}
          </div>
          <p style={{ marginTop: '20px', color: '#666' }}>Do not exit fullscreen. This will clear automatically.</p>
        </div>
      )}
    </>
  );
}
