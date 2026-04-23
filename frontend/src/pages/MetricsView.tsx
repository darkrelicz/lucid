import { motion } from 'framer-motion';

export function MetricsView() {
  return (
    <>
      <header className="app-header">
        <h1 className="page-title" style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Metrics</h1>
      </header>

      <div className="app-content">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)', opacity: 0.3 }}>◎</div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
            Metrics Dashboard
          </h2>
          <p className="text-muted" style={{ fontSize: 'var(--text-sm)', maxWidth: 500, margin: '0 auto' }}>
            Aggregate hallucination rate charts, per-model breakdowns, tool reliability scores, and 
            before/after tuning comparisons will be implemented in Phase 4.
          </p>
        </motion.div>
      </div>
    </>
  );
}
