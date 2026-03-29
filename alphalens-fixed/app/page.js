'use client';
import './globals.css';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import StockPanel from './components/StockPanel';
import AlertsPanel from './components/AlertsPanel';
import RecommendationsPanel from './components/RecommendationsPanel';
import ScamScanner from './components/ScamScanner';
import NewsPanel from './components/NewsPanel';
import ComparePanel from './components/ComparePanel';
import ChatPanel from './components/ChatPanel';
import PortfolioTab from './components/PortfolioTab';

function AppShell() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState('landing'); // 'landing' | 'login'
  const [activeView, setActiveView] = useState('research');
  const [activeRailTab, setActiveRailTab] = useState('chat');
  const [currentSymbol, setCurrentSymbol] = useState('');
  const [currentStock, setCurrentStock] = useState(null);
  const [alerts, setAlerts] = useState([]);

  if (loading) return (
    <div style={{ height: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontStyle: 'italic', color: 'var(--beige-dim)' }}>AlphaLens AI</div>
    </div>
  );

  // Not logged in → landing or login
  if (!user) {
    if (screen === 'login') return <LoginScreen onBack={() => setScreen('landing')} />;
    return <LandingPage onEnter={() => setScreen('login')} />;
  }

  // Logged in → main app
  const handleSearch = (symbol) => { setCurrentSymbol(symbol); setActiveView('research'); };

  const renderCenter = () => {
    switch (activeView) {
      case 'compare':        return <ComparePanel />;
      case 'alerts':         return <AlertsPanel symbol={currentSymbol} alerts={alerts} />;
      case 'recommendations':return <RecommendationsPanel />;
      case 'scam':           return <ScamScanner symbol={currentStock?.displaySymbol} stock={currentStock} />;
      case 'news':           return <NewsPanel symbol={currentSymbol} standalone />;
      case 'research': default:
        return <StockPanel symbol={currentSymbol} onStockLoad={setCurrentStock} onAlertsLoad={setAlerts} />;
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '196px 1fr 340px', gridTemplateRows: '100vh', height: '100vh', overflow: 'hidden' }}>
      <Sidebar activeView={activeView} onViewChange={setActiveView} alertCount={alerts.length} />
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar onSearch={handleSearch} onOpenRecommendations={() => setActiveView('recommendations')} currentSymbol={currentSymbol} />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{renderCenter()}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-raised)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {[{ id: 'chat', label: 'AI Chat' }, { id: 'portfolio', label: 'Portfolio' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveRailTab(tab.id)} style={{ flex: 1, padding: '13px 8px', background: 'transparent', border: 'none', fontFamily: 'var(--mono)', fontSize: '9.5px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center', color: activeRailTab === tab.id ? 'var(--beige)' : 'var(--muted)', borderBottom: `2px solid ${activeRailTab === tab.id ? 'var(--beige)' : 'transparent'}`, transition: 'color 0.12s, border-color 0.12s' }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeRailTab === 'chat' ? <ChatPanel stockContext={currentStock} /> : <PortfolioTab />}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppShell /></AuthProvider>;
}
