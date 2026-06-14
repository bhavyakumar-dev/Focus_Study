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

    const isElectron = typeof window !== 'undefined' && window.require;

    if (isElectron) {
      try {
        const fs = window.require('fs');
        const path = window.require('path');
        const { exec } = window.require('child_process');
        const os = window.require('os');

        const config = {
          javascript: { ext: 'js', cmd: 'node' },
          python: { ext: 'py', cmd: 'python' },
          cpp: { ext: 'cpp', cmd: 'g++' },
          java: { ext: 'java', cmd: 'java' }
        };

        if (!config[language]) {
          setOutput(`Local execution for ${language} is not supported yet.`);
          setIsRunning(false);
          return;
        }

        const tmpDir = os.tmpdir();
        const fileName = `focus_exec_${Date.now()}.${config[language].ext}`;
        const filePath = path.join(tmpDir, fileName);

        fs.writeFileSync(filePath, code);

        let command = `${config[language].cmd} "${filePath}"`;
        if (language === 'cpp') {
           const outPath = path.join(tmpDir, `focus_exec_${Date.now()}.exe`);
           command = `g++ "${filePath}" -o "${outPath}" && "${outPath}"`;
        }

        exec(command, async (error, stdout, stderr) => {
          if (error) {
             let errorMsg = stderr || error.message;
             
             // AI AUTO INSTALLER LOGIC
             if (errorMsg.includes('ModuleNotFoundError') || errorMsg.includes('Cannot find module')) {
                setOutput('Missing module detected. Asking AI to auto-install...');
                const geminiKey = localStorage.getItem('geminiKey');
                if (geminiKey) {
                   try {
                     const ai = new GoogleGenAI({ apiKey: geminiKey });
                     const prompt = `The following ${language} code failed to execute due to a missing package. 
Error: ${errorMsg}
Provide ONLY the terminal command to install the missing package globally or locally (e.g., 'pip install requests' or 'npm install axios'). Do NOT include any markdown or explanation.`;
                     const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: [{ role: 'user', parts: [{ text: prompt }] }] });
                     const installCmd = response.text?.trim();
                     if (installCmd && !installCmd.includes('```')) {
                        setOutput(`Auto-installing via: ${installCmd}...`);
                        exec(installCmd, { cwd: tmpDir }, (iErr, iStd, iSerr) => {
                           if (iErr) {
                              setOutput(`Auto-install failed.\n${iSerr || iErr.message}`);
                              setIsRunning(false);
                           } else {
                              setOutput('Auto-install complete! Re-running code...');
                              exec(command, (rErr, rStd, rSerr) => {
                                  setOutput(rErr ? (rSerr || rErr.message) : rStd);
                                  setIsRunning(false);
                              });
                           }
                        });
                        return; // Wait for install and re-run
                     }
                   } catch (aiErr) {
                     console.error("AI Install Failed:", aiErr);
                   }
                }
             }

             // Write to Crash Log
             try {
                const crashLogPath = path.join(os.homedir(), 'Documents', 'Focus_CrashLogs.txt');
                const logEntry = `\n[${new Date().toISOString()}] EXECUTION CRASH\nLanguage: ${language}\nError: ${errorMsg}\n`;
                fs.appendFileSync(crashLogPath, logEntry);
             } catch(e) {}

             setOutput('Error: ' + errorMsg);
          } else {
             setOutput(stdout);
          }
          setIsRunning(false);
        });
        return; // Native execution handed off to async child_process
      } catch (e) {
         setOutput('Local Exec System Error: ' + e.message);
         setIsRunning(false);
         return;
      }
    }

    if (language === 'javascript') {
      // Native JS Execution in browser (Web Mode)
      let consoleOutput = [];
      const originalLog = console.log;
      const originalError = console.error;
      
      console.log = (...args) => {
        consoleOutput.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        originalLog(...args);
      };
      console.error = (...args) => {
        consoleOutput.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        originalError(...args);
      };

      try {
        // eslint-disable-next-line no-new-func
        const userCode = new Function(code);
        userCode();
        setOutput(consoleOutput.join('\n') || 'Code executed successfully (no console output).');
      } catch (err) {
        setOutput('Error: ' + err.toString());
      } finally {
        console.log = originalLog;
        console.error = originalError;
        setIsRunning(false);
      }
      return;
    }

    // For other languages in Web Mode, use AI Simulation
    const geminiKey = localStorage.getItem('geminiKey');
    if (!geminiKey) {
      setOutput('The public Compiler API was shut down.\n\nPlease enter a Gemini API Key in the Setup Screen Options to enable the AI Code Simulator for Python, C++, Java, and Rust. \n\n(JavaScript will continue to run natively offline without a key, or you can use the Windows .exe version for native execution of all languages).');
      setIsRunning(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `You are a strict, sandboxed code execution engine. 
      The user is running this ${language} code:
      \`\`\`${language}
      ${code}
      \`\`\`
      Simulate the exact standard output (stdout and stderr) that a real compiler/interpreter would produce. 
      If there is a syntax error, output the realistic compiler error. 
      Return ONLY the raw text output. Do NOT wrap it in markdown blocks, do NOT explain the code, do NOT say "Output:". Just give me the exact text that would appear in the terminal.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      setOutput(response.text?.trim() || 'No output from simulator.');
    } catch (err) {
      setOutput('AI Simulator Error: ' + err.message);
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
