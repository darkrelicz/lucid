import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { TraceView } from './pages/TraceView';
import { RunComparison } from './pages/RunComparison';
import { RedTeamView } from './pages/RedTeamView';
import { TuningPanel } from './pages/TuningPanel';
import { MetricsView } from './pages/MetricsView';
import './App.css';

function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">◈</div>
        <span className="sidebar-brand-text">Lucid</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main</div>
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon">◉</span>
          Dashboard
        </NavLink>
        <NavLink to="/metrics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon">◎</span>
          Metrics
        </NavLink>

        <div className="sidebar-section-label">Analysis</div>
        <NavLink to="/compare" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon">⇋</span>
          Compare Runs
        </NavLink>
        <NavLink to="/red-team" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon">⚑</span>
          Red Team
        </NavLink>

        <div className="sidebar-section-label">Configure</div>
        <NavLink to="/tuning" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon">⚙</span>
          Tuning
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-link" style={{ opacity: 0.5 }}>
          <span className="sidebar-link-icon">v</span>
          v0.1.0
        </div>
      </div>
    </aside>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/runs/:id" element={<TraceView />} />
            <Route path="/compare" element={<RunComparison />} />
            <Route path="/red-team" element={<RedTeamView />} />
            <Route path="/tuning" element={<TuningPanel />} />
            <Route path="/metrics" element={<MetricsView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
