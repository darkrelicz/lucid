import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type RunSummary, type RunCreate, type RunStatus } from '../services/api';
import './Dashboard.css';

const STATUS_LABELS: Record<RunStatus, string> = {
  pending: '● Pending',
  running: '◌ Running',
  completed: '✓ Completed',
  failed: '✗ Failed',
  cancelled: '○ Cancelled',
};

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="badge badge-confidence-medium">—</span>;
  const pct = Math.round(score * 100);
  const level = pct >= 80 ? 'high' : pct >= 50 ? 'medium' : 'low';
  return <span className={`badge badge-confidence-${level}`}>{pct}%</span>;
}

function NewRunModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (run: RunSummary) => void }) {
  const [goal, setGoal] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    try {
      const run = await api.createRun({ goal: goal.trim(), model });
      onCreated(run);
      setGoal('');
      onClose();
    } catch (err) {
      console.error('Failed to create run:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">New Agent Run</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Goal</label>
            <textarea
              className="input"
              placeholder="Describe the goal for the agent..."
              value={goal}
              onChange={e => setGoal(e.target.value)}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Model</label>
            <select className="input" value={model} onChange={e => setModel(e.target.value)}>
              <optgroup label="OpenAI">
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </optgroup>
              <optgroup label="Anthropic">
                <option value="claude-4-sonnet">Claude 4 Sonnet</option>
                <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              </optgroup>
              <optgroup label="Local (Ollama)">
                <option value="ollama/llama3">Llama 3</option>
                <option value="ollama/mistral">Mistral</option>
              </optgroup>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !goal.trim()}>
            {loading ? <span className="spinner" /> : null}
            Launch Run
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      setLoading(true);
      const data = await api.listRuns();
      setRuns(data);
      setError(null);
    } catch (err) {
      setError('Unable to connect to backend. Is the API running?');
      // Show demo data when API is unavailable
      setRuns(getDemoRuns());
    } finally {
      setLoading(false);
    }
  };

  const totalRuns = runs.length;
  const avgConfidence = runs.length > 0
    ? runs.reduce((sum, r) => sum + (r.confidence_score ?? 0), 0) / runs.length
    : 0;
  const totalHallucinations = runs.reduce((sum, r) => sum + r.hallucination_count, 0);
  const completedRuns = runs.filter(r => r.status === 'completed').length;

  return (
    <>
      <header className="app-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Dashboard</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + New Run
        </button>
      </header>

      <div className="app-content">
        {error && (
          <div className="demo-banner">
            <span>⚡</span> {error} Showing demo data.
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <motion.div className="card stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <div className="stat-label">Total Runs</div>
            <div className="stat-value">{totalRuns}</div>
          </motion.div>
          <motion.div className="card stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="stat-label">Completed</div>
            <div className="stat-value" style={{ color: 'var(--confidence-high)' }}>{completedRuns}</div>
          </motion.div>
          <motion.div className="card stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="stat-label">Avg Confidence</div>
            <div className="stat-value">{(avgConfidence * 100).toFixed(0)}%</div>
          </motion.div>
          <motion.div className="card stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="stat-label">Hallucinations</div>
            <div className="stat-value" style={{ color: 'var(--confidence-low)' }}>{totalHallucinations}</div>
          </motion.div>
        </div>

        {/* Run List */}
        <div className="page-header">
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Recent Runs</h2>
          </div>
        </div>

        {loading ? (
          <div className="runs-list">
            {[1, 2, 3].map(i => (
              <div key={i} className="card run-card-skeleton">
                <div className="skeleton" style={{ width: '60%', height: 20, marginBottom: 12 }} />
                <div className="skeleton" style={{ width: '40%', height: 14 }} />
              </div>
            ))}
          </div>
        ) : runs.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">◈</div>
            <div className="empty-state-title">No runs yet</div>
            <div className="empty-state-text">
              Launch your first agent run to start auditing for hallucinations.
            </div>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              + Launch First Run
            </button>
          </div>
        ) : (
          <div className="runs-list">
            <AnimatePresence>
              {runs.map((run, i) => (
                <motion.div
                  key={run.id}
                  className="card card-clickable run-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/runs/${run.id}`)}
                >
                  <div className="run-card-header">
                    <div className="run-card-goal truncate">{run.goal}</div>
                    <span className={`badge badge-status badge-status-${run.status}`}>
                      {STATUS_LABELS[run.status]}
                    </span>
                  </div>
                  <div className="run-card-meta">
                    <span className="run-card-model text-mono">{run.model}</span>
                    <span className="run-card-divider">·</span>
                    <span>{run.total_steps} steps</span>
                    <span className="run-card-divider">·</span>
                    <span>{run.total_tokens.toLocaleString()} tokens</span>
                    <span className="run-card-divider">·</span>
                    <span>${run.total_cost.toFixed(4)}</span>
                    <span className="run-card-divider">·</span>
                    <ConfidenceBadge score={run.confidence_score} />
                    {run.hallucination_count > 0 && (
                      <>
                        <span className="run-card-divider">·</span>
                        <span className="badge badge-confidence-low">
                          {run.hallucination_count} hallucination{run.hallucination_count !== 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="run-card-time text-muted">
                    {new Date(run.created_at).toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <NewRunModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onCreated={(run) => setRuns(prev => [run, ...prev])}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Demo data for when the API is unavailable
function getDemoRuns(): RunSummary[] {
  return [
    {
      id: 'demo-001',
      goal: 'Research the latest advances in quantum computing and summarize the top 3 breakthroughs',
      model: 'gpt-4o',
      status: 'completed',
      total_steps: 12,
      total_tokens: 8432,
      total_cost: 0.0847,
      confidence_score: 0.73,
      hallucination_count: 3,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date(Date.now() - 3500000).toISOString(),
    },
    {
      id: 'demo-002',
      goal: 'Analyze the economic impact of AI regulation in the EU and provide key statistics',
      model: 'claude-4-sonnet',
      status: 'completed',
      total_steps: 9,
      total_tokens: 6218,
      total_cost: 0.0523,
      confidence_score: 0.89,
      hallucination_count: 1,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      completed_at: new Date(Date.now() - 7100000).toISOString(),
    },
    {
      id: 'demo-003',
      goal: 'Find and summarize the key findings from the 2025 IPCC climate report',
      model: 'gpt-4o-mini',
      status: 'failed',
      total_steps: 5,
      total_tokens: 2103,
      total_cost: 0.0021,
      confidence_score: 0.31,
      hallucination_count: 7,
      created_at: new Date(Date.now() - 10800000).toISOString(),
      completed_at: null,
    },
    {
      id: 'demo-004',
      goal: 'Compare PostgreSQL vs MySQL performance benchmarks for OLTP workloads',
      model: 'gpt-4o',
      status: 'running',
      total_steps: 4,
      total_tokens: 3201,
      total_cost: 0.0310,
      confidence_score: null,
      hallucination_count: 0,
      created_at: new Date(Date.now() - 300000).toISOString(),
      completed_at: null,
    },
  ];
}
