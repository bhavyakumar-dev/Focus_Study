import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal, Play, Bot, X, Loader, FileCode, Plus, Save, Cloud, Trash2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { db, doc, setDoc, getDoc } from './firebase';

const STORAGE_KEY = 'focusIDE_files';
const ACTIVE_KEY = 'focusIDE_activeFile';

function loadFilesFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [
    { id: 1, name: 'main.js', language: 'javascript', content: '// Welcome to Focus IDE V5\n\nconsole.log("System Optimal");\n' }
  ];
}

function loadActiveIdFromStorage() {
  try {
    const saved = localStorage.getItem(ACTIVE_KEY);
    if (saved) return Number(saved);
  } catch { /* ignore */ }
  return 1;
}

export default function CodeEditor() {
  const [files, setFiles] = useState(loadFilesFromStorage);
  const [activeFileId, setActiveFileId] = useState(loadActiveIdFromStorage);
  const [output, setOutput] = useState('Focus IDE Terminal — Ready.\n');
  const [isRunning, setIsRunning] = useState(false);
  
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saved', 'error', ''
  
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const containerRef = useRef(null);
  const activeFileIdRef = useRef(activeFileId);
  const filesRef = useRef(files);
  const outputRef = useRef(null);

  // Keep refs in sync so Monaco closure always has the latest value
  useEffect(() => { activeFileIdRef.current = activeFileId; }, [activeFileId]);
  useEffect(() => { filesRef.current = files; }, [files]);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  // ─── Auto-save to localStorage on every file change ───
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch { /* storage full, ignore */ }
  }, [files]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_KEY, String(activeFileId));
    } catch { /* ignore */ }
  }, [activeFileId]);

  // ─── Auto-scroll terminal to bottom ───
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // ─── Monaco Editor Initialization (runs once) ───
  useEffect(() => {
    if (typeof window !== 'undefined' && window.require && !window.nodeRequire) {
      window.nodeRequire = window.require;
      delete window.require;
      delete window.exports;
      delete window.module;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.38.0/min/vs/loader.min.js';
    script.onload = () => {
      window.require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.38.0/min/vs' }});
      window.require(['vs/editor/editor.main'], function() {
        if (containerRef.current) {
          editorRef.current = window.monaco.editor.create(containerRef.current, {
            value: activeFile.content,
            language: activeFile.language,
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: true },
            bracketPairColorization: { enabled: true },
            suggestOnTriggerCharacters: true,
            wordBasedSuggestions: 'currentDocument',
            quickSuggestions: { other: true, comments: false, strings: false },
            fontSize: 14,
            fontFamily: '"Fira Code", "Cascadia Code", monospace',
            fontLigatures: true,
            padding: { top: 15 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: 'all',
            scrollBeyondLastLine: false,
          });
          monacoRef.current = window.monaco;

          // Use ref to avoid stale closure on activeFileId
          editorRef.current.onDidChangeModelContent(() => {
            const val = editorRef.current.getValue();
            const currentActiveId = activeFileIdRef.current;
            setFiles(prev => prev.map(f => f.id === currentActiveId ? { ...f, content: val } : f));
          });
        }
      });
    };
    document.body.appendChild(script);

    return () => {
      if (editorRef.current) editorRef.current.dispose();
      try { document.body.removeChild(script); } catch { /* already removed */ }
    };
  }, []); // Run once

  // ─── Sync editor content when switching tabs ───
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        if (model.getValue() !== activeFile.content) {
          editorRef.current.setValue(activeFile.content);
        }
        monacoRef.current.editor.setModelLanguage(model, activeFile.language);
      }
    }
  }, [activeFileId]);

  // ─── File Operations ───
  const changeLanguage = (lang) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, language: lang } : f));
    if (editorRef.current && monacoRef.current) {
      monacoRef.current.editor.setModelLanguage(editorRef.current.getModel(), lang);
    }
  };

  const addNewFile = () => {
    const newId = Date.now();
    const count = files.length + 1;
    setFiles(prev => [...prev, { id: newId, name: `untitled_${count}.js`, language: 'javascript', content: '' }]);
    setActiveFileId(newId);
  };

  const closeTab = (e, fileId) => {
    e.stopPropagation();
    if (files.length <= 1) return; // Don't close last tab
    const remaining = files.filter(f => f.id !== fileId);
    setFiles(remaining);
    if (activeFileId === fileId) {
      setActiveFileId(remaining[remaining.length - 1].id);
    }
  };

  // ─── Cloud Save ───
  const saveToCloud = async () => {
    if (!db) {
      // Fallback: download files as JSON
      try {
        const blob = new Blob([JSON.stringify(files, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'focus_ide_backup.json';
        a.click();
        URL.revokeObjectURL(url);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 3000);
      } catch {
        setSaveStatus('error');
      }
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('focusUser') || '{"email":"guest"}');
    if (currentUser.isGuest || currentUser.email === 'guest') {
      // Still fallback to local download for guests
      try {
        const blob = new Blob([JSON.stringify(files, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'focus_ide_backup.json';
        a.click();
        URL.revokeObjectURL(url);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 3000);
      } catch {
        setSaveStatus('error');
      }
      return;
    }

    setIsSaving(true);
    try {
      const safeId = btoa(currentUser.email).substring(0, 15);
      const userCodesRef = doc(db, 'userCodes', safeId);
      await setDoc(userCodesRef, {
        updatedAt: Date.now(),
        files: files
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (e) {
      setSaveStatus('error');
      console.error('Cloud save failed:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Code Execution ───
  const executeCode = async () => {
    setIsRunning(true);
    setOutput(prev => prev + '\n--- Running ' + activeFile.name + ' ---\n');

    const isElectron = typeof window !== 'undefined' && window.nodeRequire;

    if (isElectron) {
      try {
        const fs = window.nodeRequire('fs');
        const path = window.nodeRequire('path');
        const { exec } = window.nodeRequire('child_process');
        const os = window.nodeRequire('os');

        const config = {
          javascript: { ext: 'js', cmd: 'node' },
          python: { ext: 'py', cmd: 'python' },
          cpp: { ext: 'cpp', cmd: 'g++' },
          java: { ext: 'java', cmd: 'java' },
          rust: { ext: 'rs', cmd: 'rustc' }
        };

        if (!config[activeFile.language]) {
          setOutput(prev => prev + `[Error] Local execution for "${activeFile.language}" is not supported yet.\n`);
          setIsRunning(false);
          return;
        }

        const tmpDir = os.tmpdir();
        const fileName = `focus_exec_${Date.now()}.${config[activeFile.language].ext}`;
        const filePath = path.join(tmpDir, fileName);

        fs.writeFileSync(filePath, activeFile.content);

        let command = `${config[activeFile.language].cmd} "${filePath}"`;
        if (activeFile.language === 'cpp') {
          const outPath = path.join(tmpDir, `focus_exec_${Date.now()}.exe`);
          command = `g++ "${filePath}" -o "${outPath}" && "${outPath}"`;
        } else if (activeFile.language === 'rust') {
          const outPath = path.join(tmpDir, `focus_exec_${Date.now()}.exe`);
          command = `rustc "${filePath}" -o "${outPath}" && "${outPath}"`;
        }

        exec(command, { cwd: tmpDir, timeout: 30000 }, (error, stdout, stderr) => {
          if (error) {
            setOutput(prev => prev + '[Error]\n' + (stderr || error.message) + '\n\nMake sure ' + config[activeFile.language].cmd + ' is installed and on your system PATH.\n');
          } else {
            setOutput(prev => prev + (stdout || '(Executed successfully with no output)\n'));
          }
          setIsRunning(false);
        });
        return; 
      } catch (e) {
        setOutput(prev => prev + '[System Error] ' + e.message + '\n');
        setIsRunning(false);
        return;
      }
    } else {
      // Web: simulate simple JS execution via eval (safe for user's own code)
      if (activeFile.language === 'javascript') {
        try {
          const originalLog = console.log;
          let captured = '';
          console.log = (...args) => { captured += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') + '\n'; };
          
          // Use Function constructor for slightly safer eval
          const fn = new Function(activeFile.content);
          fn();
          
          console.log = originalLog;
          setOutput(prev => prev + (captured || '(No output)\n'));
        } catch (e) {
          setOutput(prev => prev + '[Runtime Error] ' + e.message + '\n');
        }
      } else {
        setOutput(prev => prev + '[Info] Native execution for ' + activeFile.language + ' requires the Desktop .exe app.\nJavaScript can be executed in the browser.\n');
      }
      setIsRunning(false);
    }
  };

  // ─── Interactive Terminal ───
  const executeTerminalCommand = () => {
    const cmd = terminalInput.trim();
    if (!cmd) return;
    
    setTerminalHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    
    const isElectron = typeof window !== 'undefined' && window.nodeRequire;
    if (!isElectron) {
      // Web terminal: support basic commands
      if (cmd === 'clear' || cmd === 'cls') {
        setOutput('');
      } else if (cmd === 'help') {
        setOutput(prev => prev + `\n$ ${cmd}\nAvailable commands (web):\n  clear/cls  - Clear terminal\n  help       - Show this help\n  files      - List open files\n\nFor npm/pip/shell commands, use the Desktop .exe app.\n`);
      } else if (cmd === 'files') {
        const fileList = files.map(f => `  ${f.name} (${f.language})`).join('\n');
        setOutput(prev => prev + `\n$ ${cmd}\n${fileList}\n`);
      } else {
        setOutput(prev => prev + `\n$ ${cmd}\n[Info] Shell commands require the Desktop .exe app. Type "help" for web commands.\n`);
      }
      setTerminalInput('');
      return;
    }

    try {
      const { exec } = window.nodeRequire('child_process');
      const os = window.nodeRequire('os');
      const tmpDir = os.tmpdir();
      
      if (cmd === 'clear' || cmd === 'cls') {
        setOutput('');
        setTerminalInput('');
        return;
      }
      
      setOutput(prev => prev + `\n$ ${cmd}\n`);
      
      exec(cmd, { cwd: tmpDir, timeout: 60000 }, (error, stdout, stderr) => {
        if (error) {
          setOutput(prev => prev + (stderr || error.message) + '\n');
        } else {
          setOutput(prev => prev + (stdout || '') + (stderr || ''));
        }
      });
      setTerminalInput('');
    } catch (e) {
      setOutput(prev => prev + `\n[System Error] ${e.message}\n`);
    }
  };

  const handleTerminalKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeTerminalCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (terminalHistory.length > 0) {
        const newIndex = historyIndex < terminalHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setTerminalInput(terminalHistory[terminalHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setTerminalInput(terminalHistory[terminalHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setTerminalInput('');
      }
    }
  };

  // ─── AI Copilot ───
  const askAi = async () => {
    if (!aiPrompt.trim()) return;
    const geminiKey = localStorage.getItem('geminiKey');
    if (!geminiKey) {
      setAiResponse('Please enter a Gemini API Key in the Setup Screen Options to use AI Copilot.');
      return;
    }

    setIsAiThinking(true);
    setAiResponse('');
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `You are a strict, elite Pair Programming AI embedded in a Focus IDE.
      The user is working in ${activeFile.language}.
      Current Code:
      \`\`\`${activeFile.language}
      ${activeFile.content}
      \`\`\`
      User Request: ${aiPrompt}
      Respond concisely with expert advice, refactors, or debugging steps.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      setAiResponse(response.text || 'No response.');
    } catch (err) {
      setAiResponse('AI Error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div style={{
      width: '100%', height: '100%', backgroundColor: '#1e1e1e',
      display: 'flex', position: 'relative'
    }}>
      {/* LEFT SIDEBAR: FILE EXPLORER */}
      <div style={{ width: '200px', backgroundColor: '#252526', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '12px 15px', color: '#888', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <span>Explorer</span>
          <button onClick={addNewFile} title="New File" style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '2px' }}><Plus size={14} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {files.map(f => (
            <div 
              key={f.id} 
              onClick={() => setActiveFileId(f.id)}
              style={{
                padding: '6px 15px', display: 'flex', alignItems: 'center', gap: '8px',
                backgroundColor: f.id === activeFileId ? '#37373d' : 'transparent',
                color: f.id === activeFileId ? '#fff' : '#aaa',
                cursor: 'pointer', borderLeft: f.id === activeFileId ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                fontSize: '0.85rem',
                transition: 'background 0.15s ease'
              }}
            >
              <FileCode size={13} style={{ flexShrink: 0 }} /> 
              <input 
                type="text" 
                value={f.name}
                onChange={(e) => setFiles(prev => prev.map(file => file.id === f.id ? { ...file, name: e.target.value } : file))}
                onClick={(e) => e.stopPropagation()}
                style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none', width: '100%', fontSize: '0.82rem', fontFamily: 'inherit' }}
              />
            </div>
          ))}
        </div>
        <div style={{ padding: '10px', borderTop: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button 
            onClick={saveToCloud}
            disabled={isSaving}
            style={{ width: '100%', padding: '8px', background: 'var(--accent-purple)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', transition: 'opacity 0.2s' }}
          >
            {isSaving ? <Loader size={13} className="spin" /> : <Cloud size={13} />} 
            {db ? 'Save to Cloud' : 'Download Backup'}
          </button>
          {saveStatus === 'saved' && <div style={{ color: 'var(--accent-cyan)', fontSize: '0.7rem', textAlign: 'center' }}>✓ Saved successfully</div>}
          {saveStatus === 'error' && <div style={{ color: 'var(--danger)', fontSize: '0.7rem', textAlign: 'center' }}>✕ Save failed</div>}
          <div style={{ fontSize: '0.65rem', color: '#555', textAlign: 'center' }}>Auto-saved locally</div>
        </div>
      </div>

      {/* MAIN EDITOR AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* ═══ VS-Code Style Tab Bar ═══ */}
        <div style={{ 
          display: 'flex', alignItems: 'stretch', backgroundColor: '#252526', 
          borderBottom: '1px solid #333', overflowX: 'auto', flexShrink: 0,
          scrollbarWidth: 'thin'
        }}>
          {files.map(f => (
            <div
              key={f.id}
              onClick={() => setActiveFileId(f.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px',
                backgroundColor: f.id === activeFileId ? '#1e1e1e' : 'transparent',
                borderRight: '1px solid #333',
                borderTop: f.id === activeFileId ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                color: f.id === activeFileId ? '#fff' : '#888',
                cursor: 'pointer',
                fontSize: '0.82rem',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s ease'
              }}
            >
              <FileCode size={13} />
              <span>{f.name}</span>
              {files.length > 1 && (
                <button
                  onClick={(e) => closeTab(e, f.id)}
                  style={{ 
                    background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '0', 
                    marginLeft: '4px', display: 'flex', alignItems: 'center',
                    opacity: f.id === activeFileId ? 1 : 0.3,
                    transition: 'opacity 0.15s'
                  }}
                  title="Close tab"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          {/* New tab button */}
          <button
            onClick={addNewFile}
            style={{ 
              background: 'none', border: 'none', color: '#666', cursor: 'pointer', 
              padding: '8px 12px', display: 'flex', alignItems: 'center',
              transition: 'color 0.15s'
            }}
            title="New file"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Top Toolbar */}
        <div style={{ backgroundColor: '#2d2d2d', padding: '6px 15px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select 
              value={activeFile.language} 
              onChange={(e) => changeLanguage(e.target.value)}
              style={{ backgroundColor: '#1e1e1e', color: '#ccc', border: '1px solid #444', padding: '4px 8px', borderRadius: '4px', outline: 'none', fontSize: '0.8rem' }}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="rust">Rust</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="typescript">TypeScript</option>
            </select>
            
            <button 
              onClick={executeCode} 
              disabled={isRunning}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#0e7a0d', color: 'white', border: 'none', padding: '5px 14px', borderRadius: '4px', cursor: isRunning ? 'wait' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem', transition: 'opacity 0.2s' }}
            >
              {isRunning ? <Loader size={13} className="spin" /> : <Play size={13} />} Run
            </button>
          </div>

          <button 
            onClick={() => setIsAiOpen(!isAiOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: isAiOpen ? 'var(--accent-purple)' : 'transparent', color: isAiOpen ? 'white' : 'var(--accent-purple)', border: '1px solid var(--accent-purple)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}
          >
            <Bot size={13} /> Copilot
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Monaco Editor */}
          <div ref={containerRef} style={{ flex: 1, height: '100%' }} />

          {/* AI Sidebar Overlay */}
          {isAiOpen && (
            <div style={{ width: '320px', backgroundColor: '#252526', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--accent-purple)' }}>
                <strong style={{ fontSize: '0.85rem' }}>AI Copilot</strong>
                <button onClick={() => setIsAiOpen(false)} style={{ background:'none', border:'none', color:'#888', cursor:'pointer', padding: '2px' }}><X size={14}/></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', color: '#ccc', fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {isAiThinking ? <Loader size={18} className="spin" style={{ color: 'var(--accent-purple)' }} /> : (aiResponse || "Ask me to explain, debug, or write code.")}
              </div>
              <div style={{ padding: '8px', borderTop: '1px solid #333' }}>
                <input 
                  type="text" 
                  placeholder="Ask AI..." 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if(e.key === 'Enter') {
                      askAi();
                      setAiPrompt('');
                    }
                  }}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#3c3c3c', color: 'white', border: 'none', borderRadius: '4px', outline: 'none', fontSize: '0.82rem' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ═══ Terminal Output ═══ */}
        <div style={{ height: '180px', backgroundColor: '#1a1a1a', borderTop: '1px solid #333', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '4px 12px', color: '#666', fontSize: '0.72rem', borderBottom: '1px solid #252526', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span><Terminal size={11} style={{ verticalAlign: 'middle', marginRight: '5px' }} />Terminal</span>
            <button onClick={() => setOutput('')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.7rem' }}>Clear</button>
          </div>
          <div ref={outputRef} style={{ flex: 1, padding: '8px 12px', color: '#ccc', fontFamily: '"Cascadia Code", "Fira Code", monospace', overflowY: 'auto', fontSize: '0.8rem' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{output}</pre>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', padding: '4px 12px', borderTop: '1px solid #252526', backgroundColor: '#1e1e1e' }}>
            <span style={{ color: 'var(--accent-cyan)', marginRight: '8px', fontFamily: 'monospace', fontSize: '0.82rem', userSelect: 'none' }}>$</span>
            <input 
              type="text" 
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              onKeyDown={handleTerminalKeyDown}
              placeholder="Type command (try 'help')..."
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontFamily: '"Cascadia Code", "Fira Code", monospace', outline: 'none', fontSize: '0.82rem' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
