'use client';
// app/components/LoginScreen.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ onBack }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) { setError('Please enter email and password'); return; }
    setLoading(true); setError('');
    await new Promise(r => setTimeout(r, 600)); // simulate network
    const result = login(email, password);
    if (!result.success) { setError(result.error); setLoading(false); }
    // success → AuthContext updates user → App re-renders automatically
  };

  const fillDemo = () => {
    setEmail('demo@alphalens.ai');
    setPassword('Alpha@2025');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', position: 'relative',
    }}>
      {/* Back to landing */}
      <button
        onClick={onBack}
        style={{ position: 'absolute', top: '24px', left: '32px', background: 'transparent', border: 'none', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '10px', cursor: 'pointer', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        ← Back
      </button>

      {/* Logo top center */}
      <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontStyle: 'italic', color: 'var(--beige)', textAlign: 'center' }}>
          AlphaLens <span style={{ fontStyle: 'normal', color: 'var(--beige-mid)', fontSize: '15px' }}>AI</span>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Card */}
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-lg)', padding: '40px 36px' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '26px', color: 'var(--beige)', marginBottom: '6px', letterSpacing: '-0.01em' }}>
            Welcome back
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--beige-dim)', marginBottom: '28px' }}>
            Sign in to your research terminal
          </div>

          {/* Demo pill */}
          <button
            onClick={fillDemo}
            style={{ width: '100%', padding: '10px', marginBottom: '20px', background: 'var(--bg-elevated)', border: '1px dashed var(--border-soft)', borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--beige-dim)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-soft)'}
          >
            <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Use demo account</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', color: 'var(--beige-mid)' }}>demo@alphalens.ai</span>
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '0.1em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', color: 'var(--off-white)', fontFamily: 'var(--sans)', fontSize: '13px', padding: '10px 12px', borderRadius: 'var(--r-sm)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', color: 'var(--off-white)', fontFamily: 'var(--sans)', fontSize: '13px', padding: '10px 40px 10px 12px', borderRadius: 'var(--r-sm)', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.05em' }}
                >
                  {showPass ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 12px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 'var(--r-sm)', fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ background: loading ? 'var(--bg-elevated)' : 'var(--beige)', color: 'var(--bg)', border: 'none', fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 600, padding: '12px', borderRadius: 'var(--r-sm)', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px', transition: 'background 0.12s' }}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>

        {/* Credentials hint */}
        <div style={{ marginTop: '20px', padding: '14px 16px', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Demo Credentials</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { label: 'Email', val: 'demo@alphalens.ai' },
              { label: 'Password', val: 'Alpha@2025' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', minWidth: '60px' }}>{row.label}:</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', color: 'var(--beige-mid)' }}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
