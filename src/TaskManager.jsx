import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Bot, Loader, Target } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function TaskManager() {
  const [tasks, setTasks] = useState([
    { id: 't1', text: 'Define Project Architecture', status: 'todo' },
    { id: 't2', text: 'Set up Database Schema', status: 'todo' },
    { id: 't3', text: 'Write Unit Tests', status: 'todo' }
  ]);
  const [newTask, setNewTask] = useState('');
  const [aiGoal, setAiGoal] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // HTML5 Drag state
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: newTask, status: 'todo' }]);
    setNewTask('');
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleDragStart = (e, id) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    // slight delay to prevent the dragged element from disappearing immediately
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedTaskId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    
    setTasks(prev => prev.map(t => 
      t.id === draggedTaskId ? { ...t, status } : t
    ));
    setDraggedTaskId(null);
  };

  const generateAiBreakdown = async () => {
    if (!aiGoal.trim()) return;
    const geminiKey = localStorage.getItem('geminiKey');
    if (!geminiKey) {
      alert("Please configure your Gemini API Key in Setup to use the AI Architect.");
      return;
    }

    setIsAiThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `You are a strict, highly efficient project manager. 
      The user's massive goal is: "${aiGoal}"
      Break this down into exactly 3-5 actionable, highly specific micro-tasks.
      Respond ONLY with a JSON array of strings. Example: ["Task 1", "Task 2", "Task 3"]
      Do NOT include markdown wrapping like \`\`\`json. Just output the array.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      let text = response.text || '';
      // Clean up markdown if AI accidentally included it
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const newTasks = JSON.parse(text);
      if (Array.isArray(newTasks)) {
        const aiTasks = newTasks.map((t, i) => ({
          id: `ai_${Date.now()}_${i}`,
          text: t,
          status: 'todo'
        }));
        setTasks(prev => [...prev, ...aiTasks]);
        setAiGoal('');
      }
    } catch (err) {
      console.error(err);
      alert("AI Breakdown failed. Ensure your API key is correct and check console.");
    } finally {
      setIsAiThinking(false);
    }
  };

  const Column = ({ title, status, color }) => (
    <div 
      style={{
        flex: 1, 
        minWidth: '150px',
        backgroundColor: 'rgba(0,0,0,0.3)', 
        borderRadius: '8px', 
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        borderTop: `3px solid ${color}`
      }}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, status)}
    >
      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#ccc', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {title}
      </h4>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
        {tasks.filter(t => t.status === status).map(t => (
          <div 
            key={t.id}
            draggable
            onDragStart={(e) => handleDragStart(e, t.id)}
            onDragEnd={handleDragEnd}
            style={{ 
              backgroundColor: status === 'in_progress' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.05)', 
              border: status === 'in_progress' ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
              padding: '10px', 
              borderRadius: '6px', 
              fontSize: '0.8rem',
              cursor: 'grab',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: status === 'in_progress' ? `0 0 10px ${color}` : 'none'
            }}
          >
            <span style={{ flex: 1, wordBreak: 'break-word', color: status === 'done' ? '#888' : '#fff', textDecoration: status === 'done' ? 'line-through' : 'none' }}>
              {status === 'in_progress' && <Target size={12} color={color} style={{ marginRight: '5px', verticalAlign: 'middle' }} />}
              {t.text}
            </span>
            <button 
              onClick={() => deleteTask(t.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 5px', color: 'var(--danger)', opacity: 0.5 }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {tasks.filter(t => t.status === status).length === 0 && (
          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#666', marginTop: '20px' }}>Drop here</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', minWidth: '500px', height: '400px' }}>
      
      {/* AI Breakdown Input */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Enter a massive goal (e.g. Build Auth System)..." 
          value={aiGoal}
          onChange={(e) => setAiGoal(e.target.value)}
          className="premium-input"
          style={{ padding: '8px', fontSize: '0.85rem' }}
        />
        <button 
          onClick={generateAiBreakdown}
          disabled={isAiThinking}
          className="premium-button" 
          style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--accent-purple)' }}
        >
          {isAiThinking ? <Loader size={16} className="spin" /> : <Bot size={16} />} 
          AI Breakdown
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div style={{ display: 'flex', gap: '10px', flex: 1, overflow: 'hidden' }}>
        <Column title="Todo" status="todo" color="#888" />
        <Column title="Current Focus" status="in_progress" color="var(--accent-cyan)" />
        <Column title="Done" status="done" color="#0f0" />
      </div>

      {/* Manual Add Task */}
      <form onSubmit={addTask} style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Manual quick add task..." 
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="premium-input"
          style={{ padding: '8px', fontSize: '0.8rem' }}
        />
        <button type="submit" className="premium-button" style={{ padding: '8px', flexShrink: 0, background: 'rgba(255,255,255,0.1)' }}>
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}
