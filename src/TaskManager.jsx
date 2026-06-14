import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]);
    setNewTask('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-purple)', textAlign: 'center' }}>Session Tasks</h3>
      
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '5px' }}>
        {tasks.length === 0 && <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>No tasks added.</div>}
        
        {tasks.map(task => (
          <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
            <button 
              onClick={() => toggleTask(task.id)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
            >
              {task.done ? <CheckCircle2 size={16} color="var(--accent-cyan)" /> : <Circle size={16} color="var(--text-muted)" />}
            </button>
            <span style={{ flex: 1, fontSize: '0.85rem', textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'var(--text-muted)' : 'white' }}>
              {task.text}
            </span>
            <button 
              onClick={() => deleteTask(task.id)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', opacity: 0.5 }}
            >
              <Trash2 size={14} color="var(--danger)" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={addTask} style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
        <input 
          type="text" 
          placeholder="New task..." 
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="premium-input"
          style={{ padding: '8px', fontSize: '0.8rem' }}
        />
        <button type="submit" className="premium-button" style={{ padding: '8px', flexShrink: 0 }}>
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}
