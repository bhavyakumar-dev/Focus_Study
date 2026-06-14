import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Play, Bot, X, Loader, FileCode, Plus, Save, Cloud } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { db, doc, setDoc, getDoc } from './firebase';

export default function CodeEditor() {
  const [files, setFiles] = useState([
    { id: 1, name: 'main.js', language: 'javascript', content: '// Welcome to Focus IDE V2\n\nconsole.log("System Optimal");\n' }
  ]);
  const [activeFileId, setActiveFileId] = useState(1);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const containerRef = useRef(null);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

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
            fontSize: 14,
            fontFamily: '"Fira Code", monospace',
            padding: { top: 20 }
          });
          monacoRef.current = window.monaco;

          editorRef.current.onDidChangeModelContent(() => {
            const val = editorRef.current.getValue();
            setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: val } : f));
          });
        }
      });
    };
    document.body.appendChild(script);

    return () => {
      if (editorRef.current) editorRef.current.dispose();
      document.body.removeChild(script);
    };
  }, []); // Run once

  // When active file changes, update monaco content and language without re-triggering onChange loops
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model.getValue() !== activeFile.content) {
        editorRef.current.setValue(activeFile.content);
      }
      monacoRef.current.editor.setModelLanguage(model, activeFile.language);
    }
  }, [activeFileId]);

  const changeLanguage = (lang) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, language: lang } : f));
    if (editorRef.current && monacoRef.current) {
      monacoRef.current.editor.setModelLanguage(editorRef.current.getModel(), lang);
    }
  };

  const addNewFile = () => {
    const newId = Date.now();
    setFiles(prev => [...prev, { id: newId, name: `untitled_${newId}.js`, language: 'javascript', content: '' }]);
    setActiveFileId(newId);
  };

  const saveToCloud = async () => {
    if (!db) {
      alert("Firebase not configured! Cannot save to cloud.");
      return;
    }
    const currentUser = JSON.parse(localStorage.getItem('focusUser') || '{"email":"guest"}');
    if (currentUser.isGuest || currentUser.email === 'guest') {
      alert("Please sign in to save files to the cloud.");
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
      alert("Saved to cloud successfully!");
    } catch (e) {
      alert("Failed to save: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const executeCode = async () => {
    setIsRunning(true);
    setOutput('Compiling/Running...');

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
          setOutput(`Local execution for ${activeFile.language} is not supported yet.`);
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

        exec(command, async (error, stdout, stderr) => {
          if (error) {
             setOutput('Error:\n' + (stderr || error.message));
          } else {
             setOutput(stdout || 'Executed successfully with no output.');
          }
          setIsRunning(false);
        });
        return; 
      } catch (e) {
         setOutput('Local Exec System Error: ' + e.message);
         setIsRunning(false);
         return;
      }
    }

    // Web Mode using Piston API
    try {
      const aliases = {
        javascript: 'javascript',
        python: 'python',
        java: 'java',
        cpp: 'cpp',
        rust: 'rust'
      };
      const versions = {
        javascript: '18.15.0',
        python: '3.10.0',
        java: '15.0.2',
        cpp: '10.2.0',
        rust: '1.68.2'
      };

      const lang = aliases[activeFile.language];
      if (!lang) throw new Error("Language not supported for Web Execution.");

      const res = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: lang,
          version: versions[lang],
          files: [{ content: activeFile.content }]
        })
      });

      const data = await res.json();
      if (data.run && data.run.output) {
        setOutput(data.run.output);
      } else {
        setOutput(data.message || 'Execution failed.');
      }
    } catch (err) {
      setOutput('Web Execution Error: ' + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const askAi = async () => {
    if (!aiPrompt.trim()) return;
    const geminiKey = localStorage.getItem('geminiKey');
    if (!geminiKey) {
      setAiResponse('Please enter a Gemini API Key in the Setup Screen Options to use AI Subagents.');
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
      setAiResponse('AI Error: ' + err.message);
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
      <div style={{ width: '200px', backgroundColor: '#252526', borderRight: '1px solid #444', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '15px', color: '#ccc', borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>EXPLORER</strong>
          <button onClick={addNewFile} title="New File" style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}><Plus size={16} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {files.map(f => (
            <div 
              key={f.id} 
              onClick={() => setActiveFileId(f.id)}
              style={{
                padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px',
                backgroundColor: f.id === activeFileId ? '#37373d' : 'transparent',
                color: f.id === activeFileId ? '#fff' : '#ccc',
                cursor: 'pointer', borderLeft: f.id === activeFileId ? '3px solid var(--accent-cyan)' : '3px solid transparent'
              }}
            >
              <FileCode size={14} /> 
              <input 
                type="text" 
                value={f.name}
                onChange={(e) => setFiles(prev => prev.map(file => file.id === f.id ? { ...file, name: e.target.value } : file))}
                onClick={(e) => e.stopPropagation()}
                style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none', width: '100%', fontSize: '0.85rem' }}
              />
            </div>
          ))}
        </div>
        <div style={{ padding: '15px', borderTop: '1px solid #444' }}>
          <button 
            onClick={saveToCloud}
            disabled={isSaving}
            style={{ width: '100%', padding: '8px', background: 'var(--accent-purple)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isSaving ? <Loader size={14} className="spin" /> : <Cloud size={14} />} Save to Cloud
          </button>
        </div>
      </div>

      {/* MAIN EDITOR AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Toolbar */}
        <div style={{ backgroundColor: '#2d2d2d', padding: '10px 20px', borderBottom: '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#ccc', fontWeight: 'bold' }}>{activeFile.name}</span>
            <select 
              value={activeFile.language} 
              onChange={(e) => changeLanguage(e.target.value)}
              style={{ backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #555', padding: '5px', borderRadius: '4px', outline: 'none' }}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="rust">Rust</option>
            </select>
            
            <button 
              onClick={executeCode} 
              disabled={isRunning}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'var(--accent-cyan)', color: 'black', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isRunning ? <Loader size={14} className="spin" /> : <Play size={14} />} Run
            </button>
          </div>

          <button 
            onClick={() => setIsAiOpen(!isAiOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'transparent', color: 'var(--accent-purple)', border: '1px solid var(--accent-purple)', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' }}
          >
            <Bot size={14} /> Copilot
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Monaco */}
          <div ref={containerRef} style={{ flex: 1, height: '100%' }} />

          {/* AI Sidebar Overlay */}
          {isAiOpen && (
            <div style={{ width: '350px', backgroundColor: '#252526', borderLeft: '1px solid #444', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px', borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', color: 'var(--accent-purple)' }}>
                <strong>Copilot</strong>
                <button onClick={() => setIsAiOpen(false)} style={{ background:'none', border:'none', color:'white', cursor:'pointer' }}><X size={16}/></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '15px', color: '#ccc', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                {isAiThinking ? <Loader size={20} className="spin" style={{ color: 'var(--accent-purple)' }} /> : (aiResponse || "Ask me to explain, debug, or write code.")}
              </div>
              <div style={{ padding: '10px', borderTop: '1px solid #444' }}>
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
                  style={{ width: '100%', padding: '8px', backgroundColor: '#3c3c3c', color: 'white', border: 'none', borderRadius: '4px', outline: 'none' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Terminal Output */}
        <div style={{ height: '150px', backgroundColor: '#1e1e1e', borderTop: '1px solid #444', padding: '10px', color: '#ccc', fontFamily: 'monospace', overflowY: 'auto' }}>
          <div style={{ color: '#888', marginBottom: '5px', fontSize: '0.8rem' }}>TERMINAL OUTPUT</div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
        </div>
      </div>
    </div>
  );
}
