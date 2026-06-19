import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, Check, Play, Loader, RotateCcw, UploadCloud, DownloadCloud, Settings2 } from 'lucide-react';
import { getWebContainer } from './WebContainerManager';

export default function GitPanel({ files }) {
  const [gitStatus, setGitStatus] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Advanced Git State
  const [branchName, setBranchName] = useState('main');
  const [newBranch, setNewBranch] = useState('');
  const [remoteUrl, setRemoteUrl] = useState(localStorage.getItem('git_remote') || '');
  const [patToken, setPatToken] = useState(localStorage.getItem('git_pat') || '');
  const [showSettings, setShowSettings] = useState(false);

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
      
      // Get current branch
      const branchProcess = await wc.spawn('git', ['branch', '--show-current']);
      let branchOutput = '';
      branchProcess.output.pipeTo(new WritableStream({
        write(data) { branchOutput += data; }
      }));
      await branchProcess.exit;
      if (branchOutput.trim()) {
        setBranchName(branchOutput.trim());
      }

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
      
      // Ensure username/email is set for commit
      await wc.spawn('git', ['config', '--global', 'user.email', 'focus@ide.local']).then(p => p.exit);
      await wc.spawn('git', ['config', '--global', 'user.name', 'Focus IDE']).then(p => p.exit);

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

  const handleBranch = async () => {
    if (!newBranch.trim()) return;
    setIsProcessing(true);
    try {
      const wc = await getWebContainer();
      await wc.spawn('git', ['checkout', '-b', newBranch]).then(p => p.exit);
      setNewBranch('');
      fetchStatus();
    } catch(e) { alert('Branch failed'); }
    setIsProcessing(false);
  };

  const handlePush = async () => {
    if (!remoteUrl) return alert('Please set a remote URL in Git Settings');
    setIsProcessing(true);
    try {
      const wc = await getWebContainer();
      // Embed PAT into URL if provided
      let finalUrl = remoteUrl;
      if (patToken && finalUrl.startsWith('https://')) {
        finalUrl = finalUrl.replace('https://', `https://${patToken}@`);
      }
      
      // Add or update remote
      await wc.spawn('git', ['remote', 'remove', 'origin']).then(p => p.exit).catch(()=>{});
      await wc.spawn('git', ['remote', 'add', 'origin', finalUrl]).then(p => p.exit);
      
      const push = await wc.spawn('git', ['push', '-u', 'origin', branchName]);
      await push.exit;
      alert('Pushed successfully!');
      fetchStatus();
    } catch(e) { alert('Push failed. Check PAT and URL.'); }
    setIsProcessing(false);
  };

  const saveSettings = () => {
    localStorage.setItem('git_remote', remoteUrl);
    localStorage.setItem('git_pat', patToken);
    setShowSettings(false);
  };

  return (
    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={16} /> Git <span style={{fontSize:'0.7rem', color:'var(--accent-cyan)'}}>({branchName})</span>
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', color: showSettings ? 'var(--accent-cyan)' : '#888', cursor: 'pointer' }}>
            <Settings2 size={14} />
          </button>
          <button onClick={fetchStatus} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
            <RotateCcw size={14} className={isProcessing ? "spin" : ""} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
          <div>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '4px' }}>Remote URL (HTTPS)</label>
            <input type="text" value={remoteUrl} onChange={e => setRemoteUrl(e.target.value)} placeholder="https://github.com/user/repo.git" style={{ width: '100%', padding: '4px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '2px' }} />
          </div>
          <div>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '4px' }}>Personal Access Token (Auth)</label>
            <input type="password" value={patToken} onChange={e => setPatToken(e.target.value)} placeholder="ghp_xxxxxxxxxxxx" style={{ width: '100%', padding: '4px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '2px' }} />
          </div>
          <button onClick={saveSettings} style={{ background: 'var(--accent-cyan)', color: '#000', border: 'none', padding: '4px', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold', marginTop: '4px' }}>Save Settings</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '5px' }}>
        <input 
          type="text" 
          placeholder="New branch..." 
          value={newBranch} 
          onChange={e => setNewBranch(e.target.value)} 
          style={{ flex: 1, padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid #444', color: 'white', borderRadius: '4px', fontSize: '0.8rem' }}
        />
        <button onClick={handleBranch} disabled={isProcessing || !newBranch} style={{ background: 'var(--accent-cyan)', color: 'black', border: 'none', borderRadius: '4px', padding: '0 8px', cursor: 'pointer' }}>
          <Plus size={14} />
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
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button 
            onClick={handlePush}
            disabled={isProcessing}
            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#ccc', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}
          >
            <UploadCloud size={14} /> Push
          </button>
          <button 
            disabled={isProcessing}
            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#ccc', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}
          >
            <DownloadCloud size={14} /> Pull
          </button>
        </div>
      </div>
    </div>
  );
}
