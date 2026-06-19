import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import { getWebContainer } from './WebContainerManager';

export default function EnvVariablesManager({ files, setFiles }) {
  const [envVars, setEnvVars] = useState([]);
  const [showValues, setShowValues] = useState({});

  useEffect(() => {
    const envFile = files.find(f => f.name === '.env');
    if (envFile) {
      const vars = envFile.content.split('\\n').filter(l => l.includes('=')).map(l => {
        const [key, ...val] = l.split('=');
        return { key: key.trim(), value: val.join('=').trim() };
      });
      setEnvVars(vars);
    }
  }, [files]);

  const handleAdd = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const handleUpdate = (index, field, value) => {
    const newVars = [...envVars];
    newVars[index][field] = value;
    setEnvVars(newVars);
  };

  const handleRemove = (index) => {
    const newVars = envVars.filter((_, i) => i !== index);
    setEnvVars(newVars);
  };

  const handleSave = async () => {
    const content = envVars.filter(v => v.key).map(v => `${v.key}=${v.value}`).join('\\n');
    let envFile = files.find(f => f.name === '.env');
    
    if (envFile) {
      setFiles(prev => prev.map(f => f.name === '.env' ? { ...f, content } : f));
    } else {
      setFiles(prev => [...prev, { id: Date.now(), name: '.env', content, language: 'plaintext' }]);
    }
    
    // Sync to WebContainer
    try {
      const wc = await getWebContainer();
      await wc.fs.writeFile('/.env', content);
      alert('Secrets saved to WebContainer!');
    } catch (e) {
      console.error(e);
      alert('Failed to sync to WebContainer');
    }
  };

  const toggleShow = (index) => {
    setShowValues(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={16} /> Secrets (.env)
        </h3>
        <button 
          onClick={handleAdd}
          style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
        >
          <Plus size={14} /> Add
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
        {envVars.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>No environment variables defined.</div>
        ) : (
          envVars.map((v, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                <input 
                  type="text" 
                  placeholder="KEY" 
                  value={v.key}
                  onChange={e => handleUpdate(i, 'key', e.target.value)}
                  style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '5px', borderRadius: '4px', fontSize: '0.8rem', outline: 'none' }}
                />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showValues[i] ? "text" : "password"} 
                    placeholder="VALUE" 
                    value={v.value}
                    onChange={e => handleUpdate(i, 'value', e.target.value)}
                    style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '5px 30px 5px 5px', borderRadius: '4px', fontSize: '0.8rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                  />
                  <button onClick={() => toggleShow(i)} style={{ position: 'absolute', right: '5px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                    {showValues[i] ? <EyeOff size={12}/> : <Eye size={12}/>}
                  </button>
                </div>
              </div>
              <button onClick={() => handleRemove(i)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <button 
        onClick={handleSave}
        style={{
          backgroundColor: 'rgba(176, 0, 255, 0.2)',
          color: 'var(--accent-purple)',
          border: '1px solid var(--accent-purple)',
          borderRadius: '4px',
          padding: '8px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 'bold'
        }}
      >
        <Save size={16} /> Save .env
      </button>
    </div>
  );
}
