import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Play, Bot, X, Loader } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function CodeEditor() {
  const [code, setCode] = useState('// Welcome to the Focus IDE.\n\nfunction init() {\n  console.log("System optimal.");\n}\n\ninit();');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Load Monaco via CDN directly to bypass npm hangs
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.38.0/min/vs/loader.min.js';
    script.onload = () => {
      window.require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.38.0/min/vs' }});
      window.require(['vs/editor/editor.main'], function() {
        if (containerRef.current) {
          editorRef.current = window.monaco.editor.create(containerRef.current, {
            value: code,
            language: language,
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: '"Fira Code", monospace',
            padding: { top: 20 },
            scrollbar: { vertical: 'hidden' }
          });
          monacoRef.current = window.monaco;

          editorRef.current.onDidChangeModelContent(() => {
            setCode(editorRef.current.getValue());
          });
        }
      });
    };
    document.body.appendChild(script);

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
      document.body.removeChild(script);
    };
  }, []);

  // Update Monaco language dynamically
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      monacoRef.current.editor.setModelLanguage(editorRef.current.getModel(), language);
    }
  }, [language]);

  const executeCode = async () => {
    setIsRunning(true);
    setOutput('Compiling/Running...');
    
    // Map Monaco language to Piston language
    const langMap = {
      javascript: 'javascript',
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      rust: 'rust'
    };

    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: langMap[language] || language,
          version: '*',
          files: [{ content: code }]
        })
      });
      const data = await response.json();
      if (data.run) {
        setOutput(data.run.output || 'No output.');
      } else {
        setOutput(data.message || 'Execution failed.');
      }
    } catch (err) {
      setOutput('Network error: ' + err.message);
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
      The user is working in ${language}.
      Current Code:
      \`\`\`${language}
      ${code}
      \`\`\`
      User Request: ${aiPrompt}
      Respond concisely with expert advice, refactors, or debugging steps. Do NOT refuse unless the request is unrelated to programming.`;

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
      width: '100%',
      height: '100%',
      backgroundColor: '#1e1e1e', // Monaco dark
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Top Toolbar */}
      <div style={{
        backgroundColor: '#2d2d2d',
        padding: '10px 20px',
        borderBottom: '1px solid #444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            style={{ backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #555', padding: '5px', borderRadius: '4px', outline: 'none' }}
          >
            <option value="javascript">JavaScript (Node)</option>
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
            {isRunning ? <Loader size={14} className="spin" /> : <Play size={14} />} 
            Run Code
          </button>
        </div>

        <button 
          onClick={() => setIsAiOpen(!isAiOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'var(--accent-purple)', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' }}
        >
          <Bot size={14} /> AI Subagent
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Monaco Editor Container */}
        <div ref={containerRef} style={{ flex: 1, height: '100%' }} />

        {/* AI Sidebar Overlay */}
        {isAiOpen && (
          <div style={{
            width: '350px',
            backgroundColor: '#252526',
            borderLeft: '1px solid #444',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-5px 0 15px rgba(0,0,0,0.5)'
          }}>
            <div style={{ padding: '10px', borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', color: 'var(--accent-purple)' }}>
              <strong>AI Coder Subagent</strong>
              <button onClick={() => setIsAiOpen(false)} style={{ background:'none', border:'none', color:'white', cursor:'pointer' }}><X size={16}/></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', color: '#ccc', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
              {aiResponse || "I am reading your code... Ask me to debug, explain, or refactor."}
            </div>

            <div style={{ padding: '10px', borderTop: '1px solid #444' }}>
              <input 
                type="text" 
                placeholder="Ask AI (e.g. 'Optimize this loop')..." 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askAi()}
                style={{ width: '100%', padding: '8px', backgroundColor: '#3c3c3c', color: 'white', border: 'none', borderRadius: '4px', outline: 'none' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Terminal Output */}
      <div style={{
        height: '150px',
        backgroundColor: '#1e1e1e',
        borderTop: '1px solid #444',
        padding: '10px',
        color: '#ccc',
        fontFamily: 'monospace',
        overflowY: 'auto'
      }}>
        <div style={{ color: '#888', marginBottom: '5px' }}>Terminal Output</div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
      </div>
    </div>
  );
}
