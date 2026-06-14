import React, { useState } from 'react';
import { User, Mail, Lock, Shield, ArrowRight } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from './firebase';

export default function LoginScreen({ onLogin, onGuest }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please fill in all fields");
    
    setLoading(true);
    setError('');
    
    try {
      if (auth) {
        if (isRegistering) {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
        onLogin({ email, name: email.split('@')[0], isGuest: false });
      } else {
        throw new Error("Firebase not configured");
      }
    } catch (err) {
      console.warn("Firebase Auth failed, falling back to local simulation:", err);
      // Local Simulation (Fallback)
      setTimeout(() => {
        localStorage.setItem('focusUser', JSON.stringify({ email, method: 'email' }));
        onLogin({ email, name: email.split('@')[0], isGuest: false });
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (auth && googleProvider) {
        const result = await signInWithPopup(auth, googleProvider);
        onLogin({ email: result.user.email, name: result.user.displayName, isGuest: false });
      } else {
        throw new Error("Firebase not configured");
      }
    } catch (err) {
      console.warn("Firebase Google Auth failed, falling back to local simulation:", err);
      setTimeout(() => {
        localStorage.setItem('focusUser', JSON.stringify({ email: 'google.user@gmail.com', method: 'google' }));
        onLogin({ email: 'google.user@gmail.com', name: 'Google User', isGuest: false });
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container" style={{ justifyContent: 'center' }}>
      <div className="setup-card glass-panel" style={{ maxWidth: '400px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Shield size={48} color="var(--accent-purple)" style={{ marginBottom: '15px' }} />
          <h1 className="cyber-title" style={{ fontSize: '1.8rem', margin: '0 0 10px 0' }}>SYSTEM LOGIN</h1>
          <p style={{ color: 'var(--text-muted)' }}>Authenticate to sync your Focus Streaks</p>
        </div>

        {error && <div className="minimal-error" style={{ marginBottom: '15px' }}>{error}</div>}

        <button 
          onClick={handleGoogleAuth}
          className="premium-button" 
          style={{ width: '100%', marginBottom: '20px', backgroundColor: 'white', color: 'black' }}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px', height: '20px', marginRight: '10px' }} />
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <span style={{ padding: '0 10px', fontSize: '0.8rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>

        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="minimal-input-wrapper">
            <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '15px', top: '12px' }} />
            <input 
              type="email" 
              className="minimal-sub-input" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          
          <div className="minimal-input-wrapper">
            <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '15px', top: '12px' }} />
            <input 
              type="password" 
              className="minimal-sub-input" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" className="minimal-start-btn" disabled={loading}>
            {loading ? 'Authenticating...' : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            type="button" 
            onClick={() => setIsRegistering(!isRegistering)}
            style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Register'}
          </button>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button 
            onClick={onGuest}
            style={{ 
              background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-muted)', 
              padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem',
              display: 'inline-flex', alignItems: 'center', gap: '5px'
            }}
          >
            Continue as Guest <ArrowRight size={12} />
          </button>
        </div>

      </div>
    </div>
  );
}
