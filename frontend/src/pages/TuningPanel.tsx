import { motion } from 'framer-motion';

export function TuningPanel() {
  return (
    <>
      <header className="app-header">
        <h1 className="page-title" style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Tuning</h1>
      </header>

      <div className="app-content">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)', opacity: 0.3 }}>⚙</div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
            Tuning & Mitigation Controls
          </h2>
          <p className="text-muted" style={{ fontSize: 'var(--text-sm)', maxWidth: 500, margin: '0 auto' }}>
            Prompt editing, guardrail configuration, retrieval tuning, and model parameter controls will be 
            implemented in Phase 5A. All changes are versioned so their impact on hallucination rates can be measured.
          </p>
        </motion.div>
      </div>
    </>
  );
}
