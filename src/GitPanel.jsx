import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, Check, Play, Loader, RotateCcw } from 'lucide-react';
import { getWebContainer } from './WebContainerManager';

export default function GitPanel({ files }) {
  const [gitStatus, setGitStatus] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchStatus = async () => {
    setIsProcessing(true);
    try {
      const wc = await getWebContainer();
      
      // Ensure git is initialized
      await wc.spawn('git', ['init']);
      
      const process = await wc.spawn('git', ['status', '-s']);
      let output = '';
      process.output.pipeTo(new WritableStream({
        write(data) { output += data; }
      }));
      await process.exit;
      setGitStatus(output || 'No changes');
    } catch (e) {
      setGitStatus('Error fetching git status');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [files]);

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    setIsProcessing(true);
    try {
      const wc = await getWebContainer();
      await wc.spawn('git', ['add', '.']).then(p => p.exit);
      await wc.spawn('git', ['commit', '-m', commitMessage]).then(p => p.exit);
      setCommitMessage('');
      fetchStatus();
    } catch (e) {
      console.error(e);
      alert('Commit failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={16} /> Source Control
        </h3>
        <button onClick={fetchStatus} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
          <RotateCcw size={14} className={isProcessing ? "spin" : ""} />
        </button>
      </div>

      <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '10px' }}>CHANGES</div>
        {gitStatus === 'No changes' ? (
          <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>Working tree clean</div>
        ) : (
          <pre style={{ margin: 0, fontSize: '0.8rem', color: 'var(--accent-cyan)', whiteSpace: 'pre-wrap' }}>
            {gitStatus}
          </pre>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <textarea 
          placeholder="Commit message"
          value={commitMessage}
          onChange={e => setCommitMessage(e.target.value)}
          rows={3}
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            color: 'white',
            padding: '8px',
            fontSize: '0.85rem',
            resize: 'none',
            outline: 'none'
          }}
        />
        <button 
          onClick={handleCommit}
          disabled={isProcessing || !commitMessage.trim()}
          style={{
            backgroundColor: 'var(--accent-purple)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            cursor: (isProcessing || !commitMessage.trim()) ? 'not-allowed' : 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold'
          }}
        >
          {isProcessing ? <Loader size={16} className="spin" /> : <Check size={16} />} Commit
        </button>
      </div>
    </div>
  );
}
