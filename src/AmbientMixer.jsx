import React, { useState, useEffect, useRef } from 'react';
import { Waves, Wind, Activity, CloudRain } from 'lucide-react';

export default function AmbientMixer() {
  const [volumes, setVolumes] = useState({ brown: 0, pink: 0, white: 0, rain: 0 });
  const audioCtxRef = useRef(null);
  const nodesRef = useRef({});

  const sounds = [
    { id: 'rain', label: 'Heavy Rain', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=heavy-rain-nature-sounds-8186.mp3' },
    { id: 'cafe', label: 'Cafe Chatter', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_7d5a57dc2d.mp3?filename=cafe-background-noise-10706.mp3' },
    { id: 'lofi', label: 'Lo-Fi Chill', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3' },
    { id: 'fire', label: 'Campfire', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=crackling-fireplace-nature-sounds-8012.mp3' },
    { id: 'binaural_alpha', label: 'Alpha Waves (Focus)', url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_df3d0aebaf.mp3?filename=binaural-alpha-14-hz-16474.mp3' },
    { id: 'binaural_theta', label: 'Theta Waves (Deep)', url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_731e84d4b1.mp3?filename=binaural-theta-4-hz-16472.mp3' }
  ];

  // Initialize Web Audio API on first interaction
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      // Function to create noise buffers
      const createNoise = (type) => {
        const bufferSize = ctx.sampleRate * 2; // 2 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);

        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (type === 'white') {
            output[i] = white;
          } else if (type === 'pink') {
            // Very simple pink noise approximation
            lastOut = (lastOut * 0.99) + (white * 0.05);
            output[i] = lastOut;
          } else if (type === 'brown') {
            // Brown noise (integration of white noise)
            lastOut = (lastOut + (white * 0.02)) / 1.02;
            output[i] = lastOut * 3.5;
          }
        }
        return buffer;
      };

      const setupNode = (type) => {
        const source = ctx.createBufferSource();
        // Rain uses white noise as the base, then filters it
        source.buffer = createNoise(type === 'rain' ? 'white' : type);
        source.loop = true;
        
        let lastNode = source;

        if (type === 'rain') {
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 1000;
          
          // Modulate filter to simulate wind/gusts of rain
          const lfo = ctx.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.value = 0.2; // slow gusts
          const lfoGain = ctx.createGain();
          lfoGain.gain.value = 500;
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          lfo.start();

          source.connect(filter);
          lastNode = filter;
        }
        
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0; // start muted
        
        lastNode.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start();
        
        return gainNode;
      };

      nodesRef.current = {
        brown: setupNode('brown'),
        pink: setupNode('pink'),
        white: setupNode('white'),
        rain: setupNode('rain')
      };
    }
    
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const handleVolumeChange = (id, vol) => {
    setVolumes(prev => ({ ...prev, [id]: vol }));
    
    // Lazy initialize on first slider movement
    if (!audioCtxRef.current) {
      initAudio();
    }
    
    if (nodesRef.current[id]) {
      // Exponential curve for smoother volume perception
      const gain = (vol / 100) * (vol / 100);
      nodesRef.current[id].gain.setTargetAtTime(gain, audioCtxRef.current.currentTime, 0.1);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-purple)', textAlign: 'center' }}>Neural Acoustic Mixer</h3>
      <div style={{ fontSize: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', marginTop: '-10px' }}>
        Synthesized focus frequencies
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Waves size={18} color={volumes.brown > 0 ? "var(--accent-cyan)" : "var(--text-muted)"} />
          <div style={{ width: '80px', fontSize: '0.8rem' }}>Deep Brown</div>
          <input type="range" min="0" max="100" value={volumes.brown} onChange={(e) => handleVolumeChange('brown', parseInt(e.target.value))} style={{ flex: 1, accentColor: 'var(--accent-cyan)' }} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wind size={18} color={volumes.pink > 0 ? "var(--accent-purple)" : "var(--text-muted)"} />
          <div style={{ width: '80px', fontSize: '0.8rem' }}>Pink Noise</div>
          <input type="range" min="0" max="100" value={volumes.pink} onChange={(e) => handleVolumeChange('pink', parseInt(e.target.value))} style={{ flex: 1, accentColor: 'var(--accent-purple)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={18} color={volumes.white > 0 ? "white" : "var(--text-muted)"} />
          <div style={{ width: '80px', fontSize: '0.8rem' }}>White Noise</div>
          <input type="range" min="0" max="100" value={volumes.white} onChange={(e) => handleVolumeChange('white', parseInt(e.target.value))} style={{ flex: 1, accentColor: 'white' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CloudRain size={18} color={volumes.rain > 0 ? "#3b82f6" : "var(--text-muted)"} />
          <div style={{ width: '80px', fontSize: '0.8rem' }}>Heavy Rain</div>
          <input type="range" min="0" max="100" value={volumes.rain} onChange={(e) => handleVolumeChange('rain', parseInt(e.target.value))} style={{ flex: 1, accentColor: '#3b82f6' }} />
        </div>
      </div>
    </div>
  );
}
