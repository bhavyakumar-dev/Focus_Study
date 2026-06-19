import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, X, Loader } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function InlineAIPrompt({ position, onClose, onApply, selectionText, fileLanguage }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const geminiKey = localStorage.getItem('geminiKey');
    if (!geminiKey) {
      alert('Please set your Gemini API key in Setup to use Inline AI.');
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      
      const systemInstruction = `You are a world-class AI coding assistant. The user has selected some code (or an empty cursor) in a ${fileLanguage} file. Generate ONLY the raw code to replace the selection or insert at the cursor. Do NOT wrap in markdown \`\`\` blocks. Do NOT explain.`;
      
      const userPrompt = `Selection:\n${selectionText || '(Empty)'}\n\nUser Request: ${prompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      });

      if (response.text) {
        let insertText = response.text.replace(/^\s*\n/, '').replace(/^```.*\n/, '').replace(/```$/, '');
        onApply(insertText);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate code.');
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  if (!position) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: '400px',
        backgroundColor: 'rgba(20, 20, 30, 0.95)',
        border: '1px solid var(--accent-purple)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5), 0 0 10px rgba(176, 0, 255, 0.3)',
        borderRadius: '8px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Sparkles size={14}/> Inline AI (Cursor-Style)
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X size={14}/></button>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input 
          ref={inputRef}
          type="text" 
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={selectionText ? "How should I rewrite this?" : "What should I generate?"}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            padding: '5px',
            outline: 'none',
            fontSize: '0.9rem'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleGenerate();
            if (e.key === 'Escape') onClose();
          }}
          disabled={isGenerating}
        />
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          style={{
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
            border: 'none',
            color: 'white',
            borderRadius: '4px',
            padding: '6px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          {isGenerating ? <Loader size={14} className="spin" /> : <Bot size={14}/>}
        </button>
      </div>
    </div>
  );
}
