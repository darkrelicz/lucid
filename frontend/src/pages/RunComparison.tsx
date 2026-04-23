import { motion } from 'framer-motion';

export function RunComparison() {
  return (
    <>
      <header className="app-header">
        <h1 className="page-title" style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Compare Runs</h1>
      </header>

      <div className="app-content">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)', opacity: 0.3 }}>⇋</div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
            Run Comparison
          </h2>
          <p className="text-muted" style={{ fontSize: 'var(--text-sm)', maxWidth: 500, margin: '0 auto' }}>
            Side-by-side comparison of two runs will be implemented in Phase 4. Compare traces, 
            hallucination counts, and final outputs across different models or configurations.
          </p>
        </motion.div>
      </div>
    </>
  );
}
