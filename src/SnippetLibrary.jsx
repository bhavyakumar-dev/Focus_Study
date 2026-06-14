import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Clipboard, Code2 } from 'lucide-react';
import { db, doc, setDoc, getDoc } from './firebase';

export default function SnippetLibrary({ onInsert, onClose }) {
  const [snippets, setSnippets] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load from Firebase or localStorage
  useEffect(() => {
    const loadSnippets = async () => {
      setIsLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('focusUser') || '{"email":"guest"}');
      
      if (!db || currentUser.isGuest || currentUser.email === 'guest') {
        const localSnippets = JSON.parse(localStorage.getItem('focusIDE_snippets') || '[]');
        setSnippets(localSnippets);
        setIsLoading(false);
        return;
      }

      try {
        const safeId = btoa(currentUser.email).substring(0, 15);
        const ref = doc(db, 'userSnippets', safeId);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().snippets) {
          setSnippets(snap.data().snippets);
        } else {
          setSnippets([]);
        }
      } catch (e) {
        console.error('Failed to load snippets', e);
        setSnippets(JSON.parse(localStorage.getItem('focusIDE_snippets') || '[]'));
      }
      setIsLoading(false);
    };
    loadSnippets();
  }, []);

  const saveSnippets = async (newSnippets) => {
    setSnippets(newSnippets);
    localStorage.setItem('focusIDE_snippets', JSON.stringify(newSnippets));

    const currentUser = JSON.parse(localStorage.getItem('focusUser') || '{"email":"guest"}');
    if (db && !currentUser.isGuest && currentUser.email !== 'guest') {
      try {
        const safeId = btoa(currentUser.email).substring(0, 15);
        await setDoc(doc(db, 'userSnippets', safeId), {
          updatedAt: Date.now(),
          snippets: newSnippets
        });
      } catch (e) {
        console.error('Failed to sync snippets', e);
      }
    }
  };

  const handleAdd = () => {
    if (!newTitle.trim() || !newCode.trim()) return;
    const s = {
      id: Date.now(),
      title: newTitle,
      code: newCode
    };
    saveSnippets([...snippets, s]);
    setNewTitle('');
    setNewCode('');
    setIsAdding(false);
  };

  const handleDelete = (id) => {
    saveSnippets(snippets.filter(s => s.id !== id));
  };

  return (
    <div style={{ width: '320px', backgroundColor: '#252526', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffb000' }}>
        <strong style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Code2 size={14}/> Snippet Library
        </strong>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#888', cursor:'pointer', padding: '2px' }}><X size={14}/></button>
      </div>

      <div style={{ padding: '10px', borderBottom: '1px solid #333' }}>
        {isAdding ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input 
              placeholder="Snippet Title..." 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)}
              style={{ padding: '6px', backgroundColor: '#3c3c3c', color: '#fff', border: 'none', borderRadius: '3px', fontSize: '0.8rem' }}
            />
            <textarea 
              placeholder="Code snippet..." 
              value={newCode} 
              onChange={e => setNewCode(e.target.value)}
              rows={4}
              style={{ padding: '6px', backgroundColor: '#3c3c3c', color: '#fff', border: 'none', borderRadius: '3px', fontSize: '0.8rem', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleAdd} style={{ flex: 1, padding: '6px', backgroundColor: 'var(--accent-cyan)', color: '#000', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Save</button>
              <button onClick={() => setIsAdding(false)} style={{ flex: 1, padding: '6px', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)} 
            style={{ width: '100%', padding: '6px', backgroundColor: '#333', color: '#ccc', border: '1px dashed #555', borderRadius: '3px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
          >
            <Plus size={14}/> Add New Snippet
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isLoading ? (
          <div style={{ color: '#888', fontSize: '0.8rem', textAlign: 'center' }}>Loading...</div>
        ) : snippets.length === 0 ? (
          <div style={{ color: '#666', fontSize: '0.8rem', textAlign: 'center', marginTop: '20px' }}>No snippets saved yet.</div>
        ) : (
          snippets.map(s => (
            <div key={s.id} style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ padding: '6px 10px', backgroundColor: '#2a2a2a', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#ccc', fontSize: '0.8rem', fontWeight: '500' }}>{s.title}</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => onInsert(s.code)} title="Insert into code" style={{ background:'none', border:'none', color:'var(--accent-cyan)', cursor:'pointer', padding: '2px' }}><Clipboard size={12}/></button>
                  <button onClick={() => handleDelete(s.id)} title="Delete" style={{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', padding: '2px' }}><Trash2 size={12}/></button>
                </div>
              </div>
              <pre style={{ margin: 0, padding: '8px 10px', fontSize: '0.75rem', color: '#9cdcfe', overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: '100px' }}>
                {s.code}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
