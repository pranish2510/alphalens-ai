'use client';
// app/components/Sidebar.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { id: 'research',         label: 'Research',       icon: '◈', group: 'ANALYSIS' },
  { id: 'compare',          label: 'Compare',        icon: '⇄', group: 'ANALYSIS' },
  { id: 'alerts',           label: 'Smart Alerts',   icon: '◎', group: 'ANALYSIS' },
  { id: 'recommendations',  label: 'Picks for You',  icon: '✦', group: 'TOOLS' },
  { id: 'scam',             label: 'Risk Scanner',   icon: '⚑', group: 'TOOLS' },
  { id: 'news',             label: 'News Feed',      icon: '≡', group: 'TOOLS' },
];

export default function Sidebar({ activeView, onViewChange, alertCount = 0 }) {
  const [time, setTime] = useState('');
  const { user, logout } = useAuth();

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const groups = [...new Set(NAV_ITEMS.map(i => i.group))];

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--bg-raised)', overflow: 'hidden', width: '196px', flexShrink: 0 }}>
      {/* Header */}
      <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '18px', fontStyle: 'italic', color: 'var(--beige)', letterSpacing: '-0.01em', lineHeight: 1 }}>
          AlphaLens <span style={{ fontStyle: 'normal', fontWeight: 400, color: 'var(--beige-mid)', fontSize: '14px' }}>AI</span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '5px' }}>
          Research Terminal
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 10px 0', flex: 1, overflowY: 'auto' }}>
        {groups.map(group => (
          <div key={group}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '0 8px', marginBottom: '5px', marginTop: '14px' }}>{group}</div>
            {NAV_ITEMS.filter(i => i.group === group).map(item => (
              <button key={item.id} onClick={() => onViewChange(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: 'var(--r-sm)', cursor: 'pointer', width: '100%', textAlign: 'left', background: activeView === item.id ? 'var(--bg-elevated)' : 'transparent', color: activeView === item.id ? 'var(--beige)' : 'var(--beige-dim)', border: 'none', fontSize: '12.5px', fontFamily: 'var(--sans)', transition: 'background 0.12s, color 0.12s', position: 'relative' }}
                onMouseEnter={e => { if (activeView !== item.id) { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--beige-mid)'; } }}
                onMouseLeave={e => { if (activeView !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--beige-dim)'; } }}
              >
                {activeView === item.id && <span style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '2px', background: 'var(--beige)', borderRadius: '1px' }} />}
                <span style={{ fontSize: '13px', opacity: 0.75, flexShrink: 0 }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'alerts' && alertCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'var(--red-dim)', color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: '8px', padding: '1px 5px', borderRadius: '2px', border: '1px solid var(--red)' }}>{alertCount}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* User + Footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* User info */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--beige-ghost)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--beige)', flexShrink: 0 }}>{user.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--sans)', fontSize: '11px', color: 'var(--beige-mid)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>{user.plan}</div>
            </div>
            <button onClick={logout} title="Sign out" style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', flexShrink: 0 }}>⎋</button>
          </div>
        )}
        {/* Live clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'var(--bg-surface)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', flexShrink: 0, animation: 'blink 2.4s ease-in-out infinite' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', color: 'var(--beige-dim)' }}>Live</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', marginLeft: 'auto' }}>{time}</span>
        </div>
      </div>
    </aside>
  );
}
