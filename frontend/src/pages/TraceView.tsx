import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

export function TraceView() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <header className="app-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 'var(--text-lg)', margin: 0 }}>
            Trace: <span className="text-mono" style={{ color: 'var(--accent-light)', fontSize: 'var(--text-sm)' }}>{id?.slice(0, 8)}...</span>
          </h1>
        </div>
      </header>

      <div className="app-content">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)', opacity: 0.3 }}>⏱</div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
            Trace Timeline
          </h2>
          <p className="text-muted" style={{ fontSize: 'var(--text-sm)', maxWidth: 500, margin: '0 auto' }}>
            The interactive trace timeline will be implemented in Phase 4. Each agent step will be displayed with 
            full prompt/response details, tool calls, confidence indicators, and inline hallucination highlighting.
          </p>
        </motion.div>
      </div>
    </>
  );
}
