import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

const XTermTerminal = forwardRef(({ webcontainer, onClear }, ref) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const processRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new Terminal({
      theme: {
        background: '#1a1a1a',
        foreground: '#cccccc',
        cursor: '#00f0ff',
      },
      fontFamily: '"Cascadia Code", "Fira Code", monospace',
      fontSize: 13,
      convertEol: true,
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    let shellProcess = null;

    const startShell = async () => {
      if (!webcontainer) return;
      try {
        term.write('\x1b[36mBooting Replit-style WebContainer OS...\x1b[0m\r\n');
        
        // Spawn jsh (built-in shell)
        shellProcess = await webcontainer.spawn('jsh', {
          terminal: {
            cols: term.cols,
            rows: term.rows,
          },
        });
        processRef.current = shellProcess;

        // Pipe shell output to terminal
        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              term.write(data);
            },
          })
        );

        // Pipe terminal input to shell
        const input = shellProcess.input.getWriter();
        term.onData((data) => {
          input.write(data);
        });

      } catch (err) {
        term.write(`\r\n\x1b[31mFailed to start shell: ${err.message}\x1b[0m\r\n`);
      }
    };

    startShell();

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        if (processRef.current) {
          processRef.current.resize({
            cols: term.cols,
            rows: term.rows,
          });
        }
      } catch (e) { /* ignore */ }
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      if (processRef.current) processRef.current.kill();
      term.dispose();
    };
  }, [webcontainer]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    clear: () => {
      if (xtermRef.current) xtermRef.current.clear();
    },
    runCommand: async (cmd) => {
      if (!webcontainer || !processRef.current) return;
      const input = processRef.current.input.getWriter();
      await input.write(cmd + '\r');
      input.releaseLock();
    }
  }));

  // Expose a clear function if needed
  useEffect(() => {
    if (onClear) {
      onClear(() => {
        if (xtermRef.current) {
          xtermRef.current.clear();
        }
      });
    }
  }, [onClear]);

  return (
    <div 
      ref={terminalRef} 
      style={{ width: '100%', height: '100%', overflow: 'hidden' }} 
    />
  );
});

export default XTermTerminal;
