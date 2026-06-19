import React, { useState } from 'react';
import { Package, Search, Download, Loader, Trash2 } from 'lucide-react';
import { getWebContainer } from './WebContainerManager';

export default function PackageManager({ files, setFiles }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [logs, setLogs] = useState('');

  // Extract dependencies from package.json if it exists
  const packageJsonFile = files.find(f => f.name === 'package.json');
  let dependencies = {};
  if (packageJsonFile) {
    try {
      const parsed = JSON.parse(packageJsonFile.content);
      dependencies = { ...(parsed.dependencies || {}), ...(parsed.devDependencies || {}) };
    } catch (e) {
      // invalid json
    }
  }

  const handleInstall = async (pkgName) => {
    if (!pkgName.trim()) return;
    setIsInstalling(true);
    setLogs(`Installing ${pkgName}...\\n`);
    try {
      const wc = await getWebContainer();
      const process = await wc.spawn('npm', ['install', pkgName]);
      
      process.output.pipeTo(new WritableStream({
        write(data) {
          setLogs(prev => prev + data);
        }
      }));
      
      const exitCode = await process.exit;
      if (exitCode === 0) {
        setLogs(prev => prev + `\\n✅ Successfully installed ${pkgName}`);
        setSearchQuery('');
        // We should ideally re-sync the package.json file from the webcontainer to our state
        const pkgData = await wc.fs.readFile('/package.json', 'utf-8');
        setFiles(prev => prev.map(f => f.name === 'package.json' ? { ...f, content: pkgData } : f));
      } else {
        setLogs(prev => prev + `\\n❌ Installation failed with code ${exitCode}`);
      }
    } catch (e) {
      console.error(e);
      setLogs(prev => prev + `\\n❌ Error: ${e.message}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleRemove = async (pkgName) => {
    setIsInstalling(true);
    setLogs(`Removing ${pkgName}...\\n`);
    try {
      const wc = await getWebContainer();
      const process = await wc.spawn('npm', ['uninstall', pkgName]);
      
      process.output.pipeTo(new WritableStream({
        write(data) {
          setLogs(prev => prev + data);
        }
      }));
      
      const exitCode = await process.exit;
      if (exitCode === 0) {
        setLogs(prev => prev + `\\n✅ Successfully removed ${pkgName}`);
        const pkgData = await wc.fs.readFile('/package.json', 'utf-8');
        setFiles(prev => prev.map(f => f.name === 'package.json' ? { ...f, content: pkgData } : f));
      } else {
        setLogs(prev => prev + `\\n❌ Removal failed with code ${exitCode}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Package size={16} /> Package Manager
      </h3>

      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input 
            type="text" 
            placeholder="Search npm packages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleInstall(searchQuery); }}
            style={{
              width: '100%',
              padding: '8px 10px 8px 30px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              color: 'white',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <button 
          onClick={() => handleInstall(searchQuery)}
          disabled={isInstalling || !searchQuery.trim()}
          style={{
            backgroundColor: 'var(--accent-purple)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '0 15px',
            cursor: isInstalling ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          {isInstalling ? <Loader size={14} className="spin" /> : <Download size={14} />}
        </button>
      </div>

      {logs && (
        <div style={{ 
          fontSize: '0.75rem', 
          fontFamily: 'monospace', 
          backgroundColor: 'rgba(0,0,0,0.3)', 
          padding: '10px', 
          borderRadius: '4px',
          maxHeight: '100px',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          color: '#aaa'
        }}>
          {logs}
        </div>
      )}

      <div>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#888' }}>Dependencies</h4>
        {Object.keys(dependencies).length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>No packages installed yet.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(dependencies).map(([pkg, version]) => (
              <li key={pkg} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.02)',
                padding: '8px 10px',
                borderRadius: '4px',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'var(--text-light)' }}>{pkg}</span>
                  <span style={{ color: '#666', fontSize: '0.75rem' }}>{version}</span>
                </div>
                <button 
                  onClick={() => handleRemove(pkg)}
                  disabled={isInstalling}
                  style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '5px' }}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
