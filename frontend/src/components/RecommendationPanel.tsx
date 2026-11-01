import type { Advisory } from '../types';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

export default function RecommendationPanel({
  advisory,
  onAccept,
  accepting,
}: {
  advisory: Advisory;
  onAccept: () => void;
  accepting: boolean;
}) {
  return (
    <div className="card" style={{ borderTop: '4px solid var(--havells-red)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Recommended Program</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Engine: <strong style={{ color: advisory.engine === 'adaptive' ? 'var(--success)' : 'var(--havells-red)' }}>{advisory.engine.toUpperCase()}</strong>
          </p>
        </div>
        <div style={{ background: '#F4F4F5', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
          {(advisory.confidence * 100).toFixed(0)}% Confidence
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Cycle</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>{advisory.cycle_type}</div>
        </div>
        <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Water Temp</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>{advisory.water_temp}°C</div>
        </div>
        <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Spin Speed</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>{advisory.spin_rpm} RPM</div>
        </div>
        <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Duration</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>{advisory.duration_min} min</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}><strong>Detergent:</strong> <span>{advisory.detergent}</span></div>
        <div style={{ display: 'flex', gap: '0.5rem' }}><strong>Drying:</strong> <span>{advisory.drying}</span></div>
        <div style={{ display: 'flex', gap: '0.5rem' }}><strong>Ironing:</strong> <span>{advisory.ironing}</span></div>
      </div>

      {advisory.alerts.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><AlertTriangle size={16} /> Care Alerts</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400E', fontSize: '0.875rem' }}>
            {advisory.alerts.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {advisory.reasons.length > 0 && (
        <details style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--havells-red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Info size={16} /> Why this recommendation?</summary>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>
            {advisory.reasons.map((r, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{r}</li>)}
          </ul>
        </details>
      )}

      <button className="primary" onClick={onAccept} disabled={accepting} style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
        {accepting ? 'Logging…' : <><CheckCircle size={18} /> Accept & Log Wash</>}
      </button>
    </div>
  );
}