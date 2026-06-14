import React, { useState, useEffect, useRef } from 'react';
import { CloudRain, Flame, Trees, Coffee } from 'lucide-react';

const SOUNDS = [
  { id: 'rain', name: 'Rain', icon: CloudRain, file: '/sounds/rain.mp3' },
  { id: 'fire', name: 'Fireplace', icon: Flame, file: '/sounds/fire.mp3' },
  { id: 'forest', name: 'Forest', icon: Trees, file: '/sounds/forest.mp3' },
  { id: 'cafe', name: 'Cafe', icon: Coffee, file: '/sounds/cafe.mp3' }
];

export default function AmbientMixer() {
  const [volumes, setVolumes] = useState({ rain: 0, fire: 0, forest: 0, cafe: 0 });
  const audioRefs = useRef({});

  const handleVolumeChange = (id, vol) => {
    setVolumes(prev => ({ ...prev, [id]: vol }));
    if (audioRefs.current[id]) {
      audioRefs.current[id].volume = vol / 100;
      if (vol > 0 && audioRefs.current[id].paused) {
        audioRefs.current[id].play().catch(e => console.log("Audio play blocked", e));
      } else if (vol === 0) {
        audioRefs.current[id].pause();
      }
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-purple)', textAlign: 'center' }}>Ambient Mixer</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {SOUNDS.map((sound) => (
          <div key={sound.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <sound.icon size={18} color={volumes[sound.id] > 0 ? "var(--accent-cyan)" : "var(--text-muted)"} />
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volumes[sound.id]} 
              onChange={(e) => handleVolumeChange(sound.id, parseInt(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent-cyan)' }}
            />
            {/* Hidden audio elements, looping */}
            <audio 
              ref={el => audioRefs.current[sound.id] = el} 
              src={sound.file} 
              loop 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
