import type { Advisory } from '../types';

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
    <div className="card recommendation">
      <div className="rec-header">
        <h2>Recommended Wash Program</h2>
        <span className={`pill engine-${advisory.engine}`}>
          {advisory.engine === 'adaptive' ? 'Adaptive (learned)' : 'Rule engine'}
        </span>
        <span className="pill confidence">Confidence {(advisory.confidence * 100).toFixed(0)}%</span>
      </div>

      <div className="rec-grid">
        <div className="rec-item">
          <span>Cycle</span>
          <strong>{advisory.cycle_type}</strong>
        </div>
        <div className="rec-item">
          <span>Water temperature</span>
          <strong>{advisory.water_temp}°C</strong>
        </div>
        <div className="rec-item">
          <span>Spin speed</span>
          <strong>{advisory.spin_rpm} RPM</strong>
        </div>
        <div className="rec-item">
          <span>Duration</span>
          <strong>{advisory.duration_min} min</strong>
        </div>
        <div className="rec-item wide">
          <span>Detergent</span>
          <strong>{advisory.detergent}</strong>
        </div>
        <div className="rec-item wide">
          <span>Drying</span>
          <strong>{advisory.drying}</strong>
        </div>
        <div className="rec-item wide">
          <span>Ironing</span>
          <strong>{advisory.ironing}</strong>
        </div>
      </div>

      {advisory.alerts.length > 0 && (
        <div className="alerts">
          <h3>Care alerts</h3>
          <ul>
            {advisory.alerts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {advisory.reasons.length > 0 && (
        <details className="reasons">
          <summary>Why this recommendation ({advisory.reasons.length} rules applied)</summary>
          <ol>
            {advisory.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </details>
      )}

      {advisory.per_garment.length > 1 && (
        <div className="per-garment">
          <h3>Per-garment guidance</h3>
          <table>
            <thead>
              <tr>
                <th>Garment</th>
                <th>Fabric</th>
                <th>°C</th>
                <th>RPM</th>
                <th>min</th>
              </tr>
            </thead>
            <tbody>
              {advisory.per_garment.map((g) => (
                <tr key={g.garment_id}>
                  <td>{g.name}</td>
                  <td>{g.fabric_type}</td>
                  <td>{g.water_temp}</td>
                  <td>{g.spin_rpm}</td>
                  <td>{g.duration_min}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button className="primary" onClick={onAccept} disabled={accepting}>
        {accepting ? 'Logging…' : 'Accept & log this wash'}
      </button>
    </div>
  );
}