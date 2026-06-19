import React, { useState, useEffect } from 'react';
import { Settings, Monitor, Type, AlignLeft, Map } from 'lucide-react';

export default function SettingsPanel({ settings, setSettings }) {
  
  const handleChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('focusIDE_settings', JSON.stringify(newSettings));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '15px', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-light)', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        <Settings size={18} />
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Editor Settings</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, overflowY: 'auto' }}>
        
        {/* Theme */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Monitor size={14} /> Theme
          </label>
          <select 
            value={settings.theme} 
            onChange={(e) => handleChange('theme', e.target.value)}
            style={{ padding: '8px', background: '#1e1e1e', color: 'white', border: '1px solid #333', borderRadius: '4px', outline: 'none' }}
          >
            <option value="vs-dark">Dark (vs-dark)</option>
            <option value="vs-light">Light (vs-light)</option>
            <option value="hc-black">High Contrast</option>
          </select>
        </div>

        {/* Font Size */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Type size={14} /> Font Size ({settings.fontSize}px)
          </label>
          <input 
            type="range" 
            min="10" max="30" 
            value={settings.fontSize} 
            onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Word Wrap */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <AlignLeft size={14} /> Word Wrap
          </label>
          <input 
            type="checkbox" 
            checked={settings.wordWrap === 'on'} 
            onChange={(e) => handleChange('wordWrap', e.target.checked ? 'on' : 'off')}
            style={{ cursor: 'pointer' }}
          />
        </div>

        {/* Minimap */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Map size={14} /> Show Minimap
          </label>
          <input 
            type="checkbox" 
            checked={settings.minimap} 
            onChange={(e) => handleChange('minimap', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
}
