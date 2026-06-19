import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, XCircle, Beaker, Loader, AlertTriangle } from 'lucide-react';
import { getWebContainer } from './WebContainerManager';

export default function TestRunner({ files }) {
  const [isRunning, setIsRunning] = useState(false);
  const [testOutput, setTestOutput] = useState('');
  const [testStatus, setTestStatus] = useState('idle'); // idle, running, pass, fail

  const runTests = async () => {
    setIsRunning(true);
    setTestStatus('running');
    setTestOutput('Starting tests...\n');
    
    try {
      const wc = await getWebContainer();
      
      // Check if package.json has a test script
      const packageJsonFile = files.find(f => f.name === 'package.json');
      if (!packageJsonFile) {
        setTestOutput('No package.json found. Cannot run tests.');
        setTestStatus('fail');
        setIsRunning(false);
        return;
      }
      
      try {
        const pkg = JSON.parse(packageJsonFile.content);
        if (!pkg.scripts || !pkg.scripts.test || pkg.scripts.test.includes('Error: no test specified')) {
          setTestOutput('No test script defined in package.json.\nAdd "test": "jest" or similar to run tests.');
          setTestStatus('fail');
          setIsRunning(false);
          return;
        }
      } catch (e) {
        setTestOutput('Invalid package.json format.');
        setTestStatus('fail');
        setIsRunning(false);
        return;
      }

      const process = await wc.spawn('npm', ['test']);
      
      let output = '';
      process.output.pipeTo(new WritableStream({
        write(data) { 
          output += data; 
          setTestOutput(prev => prev + data);
        }
      }));
      
      const exitCode = await process.exit;
      if (exitCode === 0) {
        setTestStatus('pass');
      } else {
        setTestStatus('fail');
      }
    } catch (e) {
      setTestOutput(prev => prev + '\nError executing tests.');
      setTestStatus('fail');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Beaker size={16} /> Test Runner
        </h3>
        <button 
          onClick={runTests} 
          disabled={isRunning}
          style={{ background: isRunning ? 'var(--accent-purple)' : 'var(--accent-cyan)', color: 'black', border: 'none', borderRadius: '4px', padding: '4px 12px', cursor: isRunning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
        >
          {isRunning ? <Loader size={14} className="spin" /> : <Play size={14} />} {isRunning ? 'Running...' : 'Run Tests'}
        </button>
      </div>

      {testStatus === 'pass' && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <CheckCircle size={16} /> All Tests Passed!
        </div>
      )}
      
      {testStatus === 'fail' && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <XCircle size={16} /> Tests Failed. Check output below.
        </div>
      )}

      <div style={{ flex: 1, backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '4px', padding: '10px', overflowY: 'auto', fontFamily: '"Cascadia Code", monospace', fontSize: '0.75rem', color: '#ccc', whiteSpace: 'pre-wrap' }}>
        {testOutput || <div style={{ color: '#555', fontStyle: 'italic', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
          <AlertTriangle size={24} />
          <span>No test results yet. Configure Jest/Mocha in your package.json and hit Run.</span>
        </div>}
      </div>
    </div>
  );
}
