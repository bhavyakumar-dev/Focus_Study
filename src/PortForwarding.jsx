import React, { useState, useEffect } from 'react';
import { Globe, ExternalLink, Activity } from 'lucide-react';
import { getWebContainer } from './WebContainerManager';

export default function PortForwarding() {
  const [ports, setPorts] = useState({});

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const wc = await getWebContainer();
        wc.on('port', (port, type, url) => {
          if (!active) return;
          setPorts(prev => ({
            ...prev,
            [port]: { type, url }
          }));
        });
      } catch (e) {
        console.error("Failed to attach port listener", e);
      }
    };
    init();
    return () => { active = false; };
  }, []);

  return (
    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={16} /> Ports
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
        {Object.keys(ports).length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Activity size={12} /> Listening for open ports...
          </div>
        ) : (
          Object.entries(ports).map(([port, data]) => (
            <div key={port} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 'bold' }}>Port {port}</span>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>{data.type}</span>
              </div>
              <a 
                href={data.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: 'var(--accent-cyan)', 
                  textDecoration: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  fontSize: '0.8rem',
                  backgroundColor: 'rgba(0, 255, 255, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              >
                Open <ExternalLink size={12} />
              </a>
            </div>
          ))
        )}
      </div>
      
      <div style={{ fontSize: '0.7rem', color: '#555', textAlign: 'center' }}>
        Ports will appear automatically when processes like Vite or Express run in the terminal.
      </div>
    </div>
  );
}
