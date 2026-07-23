import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../lib/auth';

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode]       = useState<'login' | 'register'>('login');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate('/portfolio');
      } else {
        await signUp(email, password);
        setSuccess('Account created! Check your email to confirm, then log in.');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 16px' }}>
      <div className="pixel-card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: 'var(--pink)', marginBottom: 10 }}>▣ MARKETSURGE</div>
          <div style={{ fontSize: 9, color: 'var(--text-3)' }}>
            {mode === 'login' ? 'SIGN IN TO YOUR ACCOUNT' : 'CREATE AN ACCOUNT'}
          </div>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 7, color: 'var(--text-3)', marginBottom: 6 }}>EMAIL</div>
            <input
              className="pixel-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <div style={{ fontSize: 7, color: 'var(--text-3)', marginBottom: 6 }}>PASSWORD</div>
            <input
              className="pixel-input"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{ fontSize: 7, color: 'var(--down)', padding: '8px 12px', background: 'var(--down-bg)', border: '2px solid var(--down)' }}>
              ▼ {error}
            </div>
          )}

          {success && (
            <div style={{ fontSize: 7, color: 'var(--up)', padding: '8px 12px', background: 'var(--up-bg)', border: '2px solid var(--up)' }}>
              ▲ {success}
            </div>
          )}

          <button className="pixel-btn active-btn" type="submit" disabled={loading} style={{ fontSize: 9, padding: '12px' }}>
            {loading ? 'PLEASE WAIT...' : mode === 'login' ? 'SIGN IN ▶' : 'CREATE ACCOUNT ▶'}
          </button>
        </form>

        <div className="pixel-divider" />

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 7, color: 'var(--text-3)', marginBottom: 10 }}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </div>
          <button
            className="pixel-btn"
            style={{ fontSize: 7 }}
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
          >
            {mode === 'login' ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </button>
        </div>

        <div style={{ marginTop: 16, fontSize: 7, color: 'var(--text-3)', textAlign: 'center', lineHeight: 2 }}>
          Your portfolio is saved securely via Supabase.
        </div>
      </div>
    </div>
  );
}
