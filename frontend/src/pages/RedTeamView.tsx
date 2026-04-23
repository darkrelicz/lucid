import { motion } from 'framer-motion';

export function RedTeamView() {
  return (
    <>
      <header className="app-header">
        <h1 className="page-title" style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Red Team</h1>
        <button className="btn btn-primary" disabled>
          ⚑ Launch Sweep
        </button>
      </header>

      <div className="app-content">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)', opacity: 0.3 }}>⚑</div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
            Adversarial Red-Teaming
          </h2>
          <p className="text-muted" style={{ fontSize: 'var(--text-sm)', maxWidth: 500, margin: '0 auto' }}>
            Automated adversarial testing will be implemented in Phase 5B. Configure attack categories, 
            launch sweeps across models, and view vulnerability heatmaps showing where your agent is weakest.
          </p>
        </motion.div>
      </div>
    </>
  );
}
