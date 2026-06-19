import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal, Play, Bot, X, Loader, FileCode, Plus, Save, Cloud, Trash2, Users, Globe, Settings, Palette, Code2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { db, doc, setDoc, getDoc } from './firebase';
import { getWebContainer, syncFilesToWebContainer, onServerReady } from './WebContainerManager';
import XTermTerminal from './XTermTerminal';
import SnippetLibrary from './SnippetLibrary';
import { initVimMode } from 'monaco-vim';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';
import DocumentPreviewPane from './DocumentPreviewPane';
import InlineAIPrompt from './InlineAIPrompt';
import PackageManager from './PackageManager';
import EnvVariablesManager from './EnvVariablesManager';
import GitPanel from './GitPanel';
import GlobalSearch from './GlobalSearch';
import PortForwarding from './PortForwarding';
import { formatCode } from './utils/formatter';

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
  
  const [isCollabEnabled, setIsCollabEnabled] = useState(false);
  
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isGhostTextEnabled, setIsGhostTextEnabled] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saved', 'error', ''
  
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [renamingFileId, setRenamingFileId] = useState(null);
  const [webcontainer, setWebcontainer] = useState(null);
  const [serverPreviewUrl, setServerPreviewUrl] = useState(null);
  
  const [vimModeEnabled, setVimModeEnabled] = useState(false);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [isSnippetsOpen, setIsSnippetsOpen] = useState(false);
  const [isDocPreviewOpen, setIsDocPreviewOpen] = useState(false);
  const isGhostTextEnabledRef = useRef(isGhostTextEnabled);
  
  // Command Palette
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const commandInputRef = useRef(null);

  // Inline AI
  const [inlineAIPosition, setInlineAIPosition] = useState(null);
  const [inlineAISelection, setInlineAISelection] = useState('');
  const [inlineAIRange, setInlineAIRange] = useState(null);
  
  // Sidebar State
  const [sidebarTab, setSidebarTab] = useState('explorer'); // 'explorer', 'packages', 'env', 'git'
  const [isZenMode, setIsZenMode] = useState(false);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const containerRef = useRef(null);
  const activeFileIdRef = useRef(activeFileId);
  const filesRef = useRef(files);
  const outputRef = useRef(null);
  const xtermRef = useRef(null);
  
  const yDocRef = useRef(null);
  const yProviderRef = useRef(null);
  const yBindingRef = useRef(null);
  const vimInstanceRef = useRef(null);
  const vimStatusBarRef = useRef(null);
  
  // Determine if we are in Electron
  const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;

  useEffect(() => {
    if (!isElectron && !webcontainer) {
      getWebContainer().then(instance => {
        setWebcontainer(instance);
        // Sync initial files
        syncFilesToWebContainer(filesRef.current).catch(console.error);
      }).catch(console.error);
    }

    // Listen for WebContainer dev servers
    const unsubscribe = onServerReady((url) => {
      setServerPreviewUrl(url);
    });
    return unsubscribe;
  }, [isElectron, webcontainer]);


  // Keep refs in sync so Monaco closure always has the latest value
  useEffect(() => { activeFileIdRef.current = activeFileId; }, [activeFileId]);
  useEffect(() => { isGhostTextEnabledRef.current = isGhostTextEnabled; }, [isGhostTextEnabled]);
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

  // ─── Command Palette Listeners ───
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isCommandPaletteOpen && commandInputRef.current) {
      commandInputRef.current.focus();
      setCommandQuery('');
    }
  }, [isCommandPaletteOpen]);

  const commandOptions = [
    ...files.map(f => ({ type: 'file', label: `Open ${f.name}`, id: f.id, icon: <FileCode size={14}/> })),
    { type: 'action', label: 'Toggle Vim Mode', action: () => setVimModeEnabled(!vimModeEnabled), icon: <Code2 size={14}/> },
    { type: 'action', label: 'Toggle Light/Dark Theme', action: () => setEditorTheme(prev => prev === 'vs-dark' ? 'vs-light' : 'vs-dark'), icon: <Palette size={14}/> },
    { type: 'action', label: 'Toggle AI Ghost Text', action: () => setIsGhostTextEnabled(!isGhostTextEnabled), icon: <Bot size={14}/> }
  ].filter(c => c.label.toLowerCase().includes(commandQuery.toLowerCase()));

  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(editorTheme);
    }
  }, [editorTheme]);

  useEffect(() => {
    if (vimModeEnabled && editorRef.current && vimStatusBarRef.current) {
      vimInstanceRef.current = initVimMode(editorRef.current, vimStatusBarRef.current);
    } else {
      if (vimInstanceRef.current) {
        vimInstanceRef.current.dispose();
        vimInstanceRef.current = null;
      }
    }
  }, [vimModeEnabled]);

  // ─── Monaco Editor Initialization (runs once) ───
  useEffect(() => {
    let inlineCompletionsDisposable = null;
    // Determine if we are running in Electron
    const isElectronEnv = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
    
    // Attempt to save Node's require if in Electron
    if (isElectronEnv && typeof window !== 'undefined' && window.require && !window.nodeRequire) {
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

          // Add Prettier Formatter Action
          editorRef.current.addAction({
            id: 'format-prettier',
            label: 'Format with Prettier',
            keybindings: [window.monaco.KeyMod.Shift | window.monaco.KeyMod.Alt | window.monaco.KeyCode.KeyF],
            run: async (ed) => {
              const val = ed.getValue();
              const formatted = await formatCode(val, activeFile.language);
              ed.setValue(formatted);
            }
          });

          // Add Inline AI Action
          editorRef.current.addAction({
            id: 'inline-ai',
            label: 'Generate with AI',
            keybindings: [window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KeyI],
            run: (ed) => {
              const selection = ed.getSelection();
              const selectedText = ed.getModel().getValueInRange(selection);
              const position = ed.getScrolledVisiblePosition(selection.getStartPosition());
              const domNode = ed.getDomNode();
              const rect = domNode.getBoundingClientRect();
              
              setInlineAISelection(selectedText);
              setInlineAIRange(selection);
              setInlineAIPosition({
                top: rect.top + position.top + 25,
                left: rect.left + position.left
              });
            }
          });

          // Add Zen Mode Action
          editorRef.current.addAction({
            id: 'toggle-zen-mode',
            label: 'Toggle Zen Mode',
            keybindings: [window.monaco.KeyCode.F11],
            run: () => {
              setIsZenMode(prev => !prev);
            }
          });

          inlineCompletionsDisposable = window.monaco.languages.registerInlineCompletionsProvider('*', {
            provideInlineCompletions: async (model, position, context, token) => {
              if (!isGhostTextEnabledRef.current) return { items: [] };
              const geminiKey = localStorage.getItem('geminiKey');
              if (!geminiKey) return { items: [] };

              const textBeforePointer = model.getValueInRange({
                startLineNumber: 1, startColumn: 1,
                endLineNumber: position.lineNumber, endColumn: position.column
              });
              const textAfterPointer = model.getValueInRange({
                startLineNumber: position.lineNumber, startColumn: position.column,
                endLineNumber: model.getLineCount(), endColumn: model.getLineMaxColumn(model.getLineCount())
              });

              // Only trigger if at the end of a line or after a space
              if (textBeforePointer.trim() === '') return { items: [] };

              try {
                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({ apiKey: geminiKey });
                const prompt = `You are an inline code autocomplete AI.
      Code before cursor:
      ${textBeforePointer}
      <CURSOR>
      Code after cursor:
      ${textAfterPointer}
      
      Respond with ONLY the exact code that should be inserted at the cursor position to complete the thought. Do NOT wrap in markdown \`\`\` blocks. Do NOT explain.`;
                
                const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: [{ role: 'user', parts: [{ text: prompt }] }]
                });
                
                if (response.text) {
                  let insertText = response.text.replace(/^\s*\n/, '').replace(/^```.*\n/, '').replace(/```$/, '');
                  return {
                    items: [{ insertText }]
                  };
                }
              } catch(e) { return { items: [] }; }
              return { items: [] };
            },
            freeInlineCompletions: () => {}
          });
        }
      });
    };
    document.body.appendChild(script);

    return () => {
      if (inlineCompletionsDisposable) inlineCompletionsDisposable.dispose();
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

  useEffect(() => {
    if (!isCollabEnabled) {
      if (yBindingRef.current) {
        yBindingRef.current.destroy();
        yBindingRef.current = null;
      }
      if (yProviderRef.current) {
        yProviderRef.current.destroy();
        yProviderRef.current = null;
      }
      yDocRef.current = null;
      return;
    }

    if (isCollabEnabled && !yDocRef.current) {
      yDocRef.current = new Y.Doc();
      yProviderRef.current = new WebrtcProvider('focus-ide-collab-room', yDocRef.current);
    }

    if (isCollabEnabled && editorRef.current) {
      if (yBindingRef.current) {
        yBindingRef.current.destroy();
        yBindingRef.current = null;
      }
      const yText = yDocRef.current.getText('file-' + activeFileId);
      
      yBindingRef.current = new MonacoBinding(
        yText,
        editorRef.current.getModel(),
        new Set([editorRef.current]),
        yProviderRef.current.awareness
      );
    }
  }, [isCollabEnabled, activeFileId]);

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

  const startRename = (e, fileId) => {
    e.stopPropagation();
    setRenamingFileId(fileId);
  };

  const finishRename = () => {
    setRenamingFileId(null);
  };

  const handleRenameInput = (e, fileId) => {
    if (e.key === 'Enter') {
      finishRename();
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

    const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;

    if (isElectron) {
      try {
        const req = window.nodeRequire || window.require;
        const fs = req('fs');
        const path = req('path');
        const { exec } = req('child_process');
        const os = req('os');

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
      // ─── Web Execution Engine ───
      if (activeFile.language === 'javascript') {
        try {
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          let captured = '';
          const capture = (prefix, ...args) => { captured += (prefix ? `[${prefix}] ` : '') + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') + '\n'; };
          
          console.log = (...args) => capture('', ...args);
          console.error = (...args) => capture('ERR', ...args);
          console.warn = (...args) => capture('WARN', ...args);
          
          const fn = new Function(activeFile.content);
          const result = fn();
          if (result !== undefined) captured += '→ ' + String(result) + '\n';
          
          console.log = originalLog;
          console.error = originalError;
          console.warn = originalWarn;
          setOutput(prev => prev + (captured || '(No output)\n'));
        } catch (e) {
          setOutput(prev => prev + '[Runtime Error] ' + e.message + '\n');
        }
      } else if (activeFile.language === 'python') {
        // Python execution via Pyodide (WebAssembly CPython)
        setOutput(prev => prev + 'Loading Python runtime (Pyodide)...\n');
        try {
          if (!window._pyodide) {
            // Lazy-load Pyodide
            if (!document.getElementById('pyodide-script')) {
              const script = document.createElement('script');
              script.id = 'pyodide-script';
              script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
              document.head.appendChild(script);
              await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load Pyodide CDN'));
              });
            }
            window._pyodide = await window.loadPyodide();
          }
          
          const pyodide = window._pyodide;
          
          // Capture stdout/stderr
          pyodide.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
          `);
          
          try {
            pyodide.runPython(activeFile.content);
          } catch (pyErr) {
            const stderr = pyodide.runPython('sys.stderr.getvalue()');
            setOutput(prev => prev + '[Python Error]\n' + (stderr || pyErr.message) + '\n');
            setIsRunning(false);
            return;
          }
          
          const stdout = pyodide.runPython('sys.stdout.getvalue()');
          setOutput(prev => prev + (stdout || '(No output)\n'));
        } catch (e) {
          setOutput(prev => prev + '[Pyodide Error] ' + e.message + '\n');
        }
      } else if (activeFile.language === 'typescript') {
        // TypeScript: strip types and run as JS
        try {
          // Simple type-stripping: remove type annotations (basic but functional)
          let jsCode = activeFile.content
            .replace(/:\s*(string|number|boolean|any|void|never|unknown|object|undefined|null)(\[\])?/g, '')
            .replace(/:\s*\{[^}]*\}/g, '')
            .replace(/<[A-Z][^>]*>/g, '')
            .replace(/\bas\s+\w+/g, '')
            .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
            .replace(/type\s+\w+\s*=\s*[^;]+;/g, '');
          
          const originalLog = console.log;
          let captured = '';
          console.log = (...args) => { captured += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') + '\n'; };
          
          const fn = new Function(jsCode);
          fn();
          
          console.log = originalLog;
          setOutput(prev => prev + (captured || '(No output)\n'));
        } catch (e) {
          setOutput(prev => prev + '[TS Runtime Error] ' + e.message + '\n');
        }
      } else if (activeFile.language === 'html') {
      } else if (activeFile.language === 'html') {
        try {
          const blob = new Blob([activeFile.content], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setOutput(prev => prev + 'HTML preview opened in a new tab.\n');
        } catch (e) {
          setOutput(prev => prev + '[Error] ' + e.message + '\n');
        }
      } else {
        // Fallback or Native Node/Python execution via WebContainers
        if (webcontainer && xtermRef.current) {
          try {
            await syncFilesToWebContainer(filesRef.current);
            if (activeFile.language === 'javascript') {
              xtermRef.current.runCommand(`node "${activeFile.name}"`);
            } else if (activeFile.language === 'python') {
              xtermRef.current.runCommand(`python3 "${activeFile.name}"`);
            } else if (activeFile.language === 'cpp' || activeFile.language === 'java') {
              // Polyglot execution via Piston API
              setOutput(prev => prev + `[Info] Compiling and running ${activeFile.language} via Piston Cloud...\n`);
              
              const langConfig = activeFile.language === 'cpp' 
                ? { language: 'cpp', version: '10.2.0' }
                : { language: 'java', version: '15.0.2' };

              fetch('https://emacs.piston.rs/api/v2/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...langConfig,
                  files: [{ name: activeFile.name, content: activeFile.content }]
                })
              })
              .then(res => res.json())
              .then(data => {
                if (data.run && data.run.output) {
                  setOutput(prev => prev + data.run.output + '\n');
                } else if (data.compile && data.compile.output) {
                  setOutput(prev => prev + '[Compile Error]\n' + data.compile.output + '\n');
                } else {
                  setOutput(prev => prev + JSON.stringify(data) + '\n');
                }
              })
              .catch(err => {
                setOutput(prev => prev + '[Cloud Execution Error] ' + err.message + '\n');
              })
              .finally(() => setIsRunning(false));
              return; // return early to avoid setting isRunning to false below
            } else {
              setOutput(prev => prev + `[Info] Running generic file in WebContainer.\n`);
              xtermRef.current.runCommand(`cat "${activeFile.name}"`);
            }
          } catch (e) {
            setOutput(prev => prev + '[WebContainer Error] ' + e.message + '\n');
          }
        } else {
          setOutput(prev => prev + `[Info] WebContainer is booting or not available. Please wait a moment.\n`);
        }
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
    
    const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
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
      // In Electron, if Monaco loaded, it might have saved Node's require as nodeRequire
      const req = window.nodeRequire || window.require;
      const { exec } = req('child_process');
      const os = req('os');
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
      const prompt = `You are Jarvis, an elite, highly empathetic, and human-like AI programming companion embedded in Focus IDE. 
      Speak in a friendly, conversational, and encouraging tone. Do not sound robotic. Be a true partner to the user.
      The user's active file is: ${activeFile.name} (${activeFile.language}).
      Here is the current code context:
      \`\`\`
      ${activeFile.content}
      \`\`\`
      The user asks: ${aiPrompt}`;

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

  const explainTerminalError = async () => {
    const termContent = isElectron ? output : (xtermRef.current?.getBuffer() || '');
    if (!termContent.trim()) return;
    
    const geminiKey = localStorage.getItem('geminiKey');
    if (!geminiKey) {
      setIsAiOpen(true);
      setAiResponse('Please enter a Gemini API Key in the Setup Screen Options to use AI Copilot.');
      return;
    }

    setIsAiOpen(true);
    setIsAiThinking(true);
    setAiResponse('');
    setAiPrompt('Explain this terminal output...');
    
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `You are Jarvis, an elite, highly empathetic, and human-like debugging AI embedded in Focus IDE.
      Speak in a friendly, conversational, and encouraging tone. Be a true partner.
      The user just ran some code or commands and got this terminal output:
      \`\`\`
      ${termContent}
      \`\`\`
      Current active file code (${activeFile.language}):
      \`\`\`
      ${activeFile.content}
      \`\`\`
      Identify any errors in the terminal output, explain what went wrong conversationally, and provide a fix.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      if (response.text) {
        setAiResponse(response.text);
      }
    } catch (e) {
      setAiResponse('[AI Error] ' + e.message);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div style={{
      width: '100%', height: '100%', backgroundColor: '#1e1e1e',
      display: 'flex', position: 'relative'
    }}>
      {/* LEFT ACTIVITY BAR */}
      {!isZenMode && (
        <div style={{ width: '48px', backgroundColor: '#1e1e1e', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10px', flexShrink: 0, gap: '15px' }}>
          <button onClick={() => setSidebarTab('explorer')} title="Explorer" style={{ background: 'none', border: 'none', color: sidebarTab === 'explorer' ? 'var(--accent-cyan)' : '#888', cursor: 'pointer' }}><FileCode size={24} /></button>
          <button onClick={() => setSidebarTab('search')} title="Search" style={{ background: 'none', border: 'none', color: sidebarTab === 'search' ? 'var(--accent-cyan)' : '#888', cursor: 'pointer' }}><Search size={24} /></button>
          <button onClick={() => setSidebarTab('packages')} title="Packages" style={{ background: 'none', border: 'none', color: sidebarTab === 'packages' ? 'var(--accent-cyan)' : '#888', cursor: 'pointer' }}><Palette size={24} /></button>
          <button onClick={() => setSidebarTab('git')} title="Source Control" style={{ background: 'none', border: 'none', color: sidebarTab === 'git' ? 'var(--accent-cyan)' : '#888', cursor: 'pointer' }}><Code2 size={24} /></button>
          <button onClick={() => setSidebarTab('env')} title="Environment Variables" style={{ background: 'none', border: 'none', color: sidebarTab === 'env' ? 'var(--accent-cyan)' : '#888', cursor: 'pointer' }}><Settings size={24} /></button>
          <button onClick={() => setSidebarTab('ports')} title="Ports" style={{ background: 'none', border: 'none', color: sidebarTab === 'ports' ? 'var(--accent-cyan)' : '#888', cursor: 'pointer' }}><Globe size={24} /></button>
        </div>
      )}

      {/* LEFT SIDEBAR: DYNAMIC PANEL */}
      {!isZenMode && (
        <div style={{ width: '250px', backgroundColor: '#252526', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {sidebarTab === 'explorer' && (
          <>
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
                    transition: 'background 0.15s ease',
                    userSelect: 'none'
                  }}
                >
                  <FileCode size={13} style={{ flexShrink: 0 }} /> 
                  {renamingFileId === f.id ? (
                    <input 
                      autoFocus
                      type="text" 
                      value={f.name}
                      onChange={(e) => setFiles(prev => prev.map(file => file.id === f.id ? { ...file, name: e.target.value } : file))}
                      onBlur={finishRename}
                      onKeyDown={(e) => handleRenameInput(e, f.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ background: '#252526', border: '1px solid var(--accent-cyan)', color: 'inherit', outline: 'none', width: '100%', fontSize: '0.82rem', fontFamily: 'inherit', padding: '2px 4px' }}
                    />
                  ) : (
                    <span 
                      onDoubleClick={(e) => startRename(e, f.id)}
                      title="Double-click to rename"
                      style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {f.name}
                    </span>
                  )}
                  {f.id !== activeFileId && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteFile(f.id); }}
                      style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '2px', opacity: 0.6 }}
                      title="Delete File"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
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
          </>
        )}
        
        {sidebarTab === 'search' && <GlobalSearch files={files} onSelectFile={setActiveFileId} />}
        {sidebarTab === 'packages' && <PackageManager files={files} setFiles={setFiles} />}
        {sidebarTab === 'git' && <GitPanel files={files} />}
        {sidebarTab === 'env' && <EnvVariablesManager files={files} setFiles={setFiles} />}
        {sidebarTab === 'ports' && <PortForwarding />}
      </div>
      )}

      {/* MAIN EDITOR AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* ═══ Breadcrumbs ═══ */}
        <div style={{ padding: '4px 15px', fontSize: '0.75rem', color: '#888', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>Focus OS</span> <span style={{ opacity: 0.5 }}>/</span> 
          <span>src</span> <span style={{ opacity: 0.5 }}>/</span> 
          <span style={{ color: 'var(--accent-cyan)' }}>{activeFile ? activeFile.name : 'Unknown'}</span>
        </div>

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select value={editorTheme} onChange={e => setEditorTheme(e.target.value)} style={{ background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '4px', fontSize: '0.75rem', outline: 'none' }}>
              <option value="vs-dark">Dark</option>
              <option value="vs-light">Light</option>
              <option value="hc-black">High Contrast</option>
            </select>
            {(activeFile.language === 'markdown' || activeFile.language === 'latex') && (
              <button 
                onClick={() => setIsDocPreviewOpen(!isDocPreviewOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: isDocPreviewOpen ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: isDocPreviewOpen ? '#10b981' : '#aaa', border: `1px solid ${isDocPreviewOpen ? '#10b981' : '#444'}`, padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s', boxShadow: isDocPreviewOpen ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none' }}
              >
                <FileCode size={13} /> Document Preview
              </button>
            )}
            <button 
              onClick={() => setVimModeEnabled(!vimModeEnabled)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: vimModeEnabled ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: vimModeEnabled ? '#10b981' : '#aaa', border: `1px solid ${vimModeEnabled ? '#10b981' : '#444'}`, padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s', boxShadow: vimModeEnabled ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none' }}
            >
              Vim
            </button>
            <button 
              onClick={() => setIsCollabEnabled(!isCollabEnabled)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: isCollabEnabled ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: isCollabEnabled ? '#10b981' : '#aaa', border: `1px solid ${isCollabEnabled ? '#10b981' : '#444'}`, padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s', boxShadow: isCollabEnabled ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none' }}
            >
              <Users size={13} /> Collab
            </button>
            <button 
              onClick={() => setIsGhostTextEnabled(!isGhostTextEnabled)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: isGhostTextEnabled ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: isGhostTextEnabled ? '#10b981' : '#aaa', border: `1px solid ${isGhostTextEnabled ? '#10b981' : '#444'}`, padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s', boxShadow: isGhostTextEnabled ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none' }}
            >
              <Bot size={13} /> Ghost Text
            </button>
            <button 
              onClick={() => setIsSnippetsOpen(!isSnippetsOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: isSnippetsOpen ? 'var(--accent-purple)' : 'transparent', color: isSnippetsOpen ? 'white' : 'var(--accent-purple)', border: '1px solid var(--accent-purple)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}
            >
              <Code2 size={13} /> Snippets
            </button>
            <button 
              onClick={() => setIsAiOpen(!isAiOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: isAiOpen ? 'var(--accent-purple)' : 'transparent', color: isAiOpen ? 'white' : 'var(--accent-purple)', border: '1px solid var(--accent-purple)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}
            >
              <Bot size={13} /> Copilot
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Monaco Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div ref={containerRef} style={{ flex: 1, height: '100%' }} />
            {vimModeEnabled && <div ref={vimStatusBarRef} style={{ padding: '2px 10px', fontSize: '0.75rem', backgroundColor: '#333', color: '#ccc', fontFamily: '"Cascadia Code", monospace', flexShrink: 0 }} />}
          </div>

          {isSnippetsOpen && (
            <SnippetLibrary 
              onClose={() => setIsSnippetsOpen(false)}
              onInsert={(code) => {
                if (editorRef.current) {
                  const position = editorRef.current.getPosition();
                  editorRef.current.executeEdits('snippets', [{
                    range: new window.monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                    text: code,
                    forceMoveMarkers: true
                  }]);
                  editorRef.current.focus();
                }
              }}
            />
          )}

          {isDocPreviewOpen && (activeFile.language === 'markdown' || activeFile.language === 'latex') && (
            <DocumentPreviewPane 
              activeFile={activeFile} 
              onClose={() => setIsDocPreviewOpen(false)} 
            />
          )}

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

          {/* Web Preview Iframe */}
          {serverPreviewUrl && (
            <div style={{ width: '400px', backgroundColor: '#fff', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ padding: '8px 12px', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc', color: '#333', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Globe size={12}/> Live Preview</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a href={serverPreviewUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>Open Tab</a>
                  <button onClick={() => setServerPreviewUrl(null)} style={{ background:'none', border:'none', color:'#888', cursor:'pointer', padding: '0' }}><X size={14}/></button>
                </div>
              </div>
              <iframe src={serverPreviewUrl} style={{ flex: 1, border: 'none', width: '100%', height: '100%' }} title="Live Preview" />
            </div>
          )}
        </div>

        {/* ═══ Terminal Output ═══ */}
        <div style={{ height: '180px', backgroundColor: '#1a1a1a', borderTop: '1px solid #333', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '4px 12px', color: '#666', fontSize: '0.72rem', borderBottom: '1px solid #252526', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span><Terminal size={11} style={{ verticalAlign: 'middle', marginRight: '5px' }} />Terminal {isElectron ? '(Local)' : '(WebContainer)'}</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={explainTerminalError} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px' }}><Bot size={11}/> Explain Error</button>
              {isElectron && <button onClick={() => setOutput('')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.7rem' }}>Clear</button>}
            </div>
          </div>
          
          {isElectron ? (
            <>
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
                  placeholder="Type command..."
                  style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontFamily: '"Cascadia Code", "Fira Code", monospace', outline: 'none', fontSize: '0.82rem' }}
                />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, padding: '4px' }}>
              <XTermTerminal ref={xtermRef} webcontainer={webcontainer} />
            </div>
          )}
        </div>
      </div>

      {/* ═══ Command Palette Overlay ═══ */}
      {isCommandPaletteOpen && (
        <div className="command-palette-overlay" onClick={() => setIsCommandPaletteOpen(false)}>
          <div className="command-palette-container" onClick={e => e.stopPropagation()}>
            <input 
              ref={commandInputRef}
              type="text" 
              className="command-palette-input"
              placeholder="Search files or run commands (e.g., 'Toggle Theme')..." 
              value={commandQuery}
              onChange={(e) => setCommandQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commandOptions.length > 0) {
                  const selected = commandOptions[0];
                  if (selected.type === 'file') setActiveFileId(selected.id);
                  if (selected.type === 'action') selected.action();
                  setIsCommandPaletteOpen(false);
                }
              }}
            />
            <div className="command-palette-list">
              {commandOptions.map((cmd, idx) => (
                <div 
                  key={idx} 
                  className="command-item"
                  onClick={() => {
                    if (cmd.type === 'file') setActiveFileId(cmd.id);
                    if (cmd.type === 'action') cmd.action();
                    setIsCommandPaletteOpen(false);
                  }}
                >
                  <div className="command-item-icon">{cmd.icon}</div>
                  <span style={{ fontSize: '0.95rem' }}>{cmd.label}</span>
                </div>
              ))}
              {commandOptions.length === 0 && (
                <div style={{ padding: '15px 24px', color: '#666', fontStyle: 'italic', fontSize: '0.9rem' }}>No results found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Inline AI Prompt Overlay ═══ */}
      <InlineAIPrompt 
        position={inlineAIPosition}
        selectionText={inlineAISelection}
        fileLanguage={activeFile.language}
        onClose={() => setInlineAIPosition(null)}
        onApply={(code) => {
          if (editorRef.current && inlineAIRange) {
            editorRef.current.executeEdits('inline-ai', [{
              range: inlineAIRange,
              text: code,
              forceMoveMarkers: true
            }]);
          }
        }}
      />

    </div>
  );
}
