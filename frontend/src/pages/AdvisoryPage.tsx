import { useEffect, useState } from 'react';
import { createWashCycle, getAdvisory, getEnums, listGarments } from '../api/client';
import RecommendationPanel from '../components/RecommendationPanel';
import { useUserContext } from '../context/UserContext';
import type { Advisory, Garment, MetaEnums } from '../types';
import { Shirt, CheckCircle2 } from 'lucide-react';

export default function AdvisoryPage() {
  const { currentUser } = useUserContext();
  const [garments, setGarments] = useState<Garment[]>([]);
  const [enums, setEnums] = useState<MetaEnums | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [soiling, setSoiling] = useState('normal');
  const [loadSize, setLoadSize] = useState('medium');
  const [useAdaptive, setUseAdaptive] = useState(true);
  const [advisory, setAdvisory] = useState<Advisory | null>(null);
  const [busy, setBusy] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) listGarments(currentUser.id).then(setGarments);
    getEnums().then(setEnums);
  }, [currentUser]);

  const toggle = (id: number) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const request = async () => {
    if (!currentUser || selected.length === 0) {
      setMessage("Please select at least one garment.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await getAdvisory({
        user_id: currentUser.id,
        garment_ids: selected,
        soiling_level: soiling,
        load_size: loadSize,
        use_adaptive: useAdaptive,
      });
      setAdvisory(result);
    } catch (e: any) {
      setMessage(e?.response?.data?.detail ?? e.message);
    } finally {
      setBusy(false);
    }
  };

  const accept = async () => {
    if (!currentUser || !advisory) return;
    setAccepting(true);
    try {
      await createWashCycle({
        user_id: currentUser.id,
        garment_ids: selected,
        cycle_type: advisory.cycle_type,
        water_temp: advisory.water_temp,
        spin_rpm: advisory.spin_rpm,
        duration_min: advisory.duration_min,
        engine_used: advisory.engine,
        recommendation_id: advisory.id,
        load_size: loadSize,
        soiling_level: soiling,
      });
      setMessage('Wash logged successfully. Counters updated.');
      setAdvisory(null);
      setSelected([]);
      if (currentUser) listGarments(currentUser.id).then(setGarments);
    } catch (e: any) {
      setMessage(e?.response?.data?.detail ?? e.message);
    } finally {
      setAccepting(false);
    }
  };

  if (!currentUser) return <p>Loading…</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Pre-Wash Advisory</h1>
        <p>Select garments to generate a safe, AI-optimized wash program.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>1. Select Garments</h3>
          {garments.length === 0 && <p className="muted">No garments found. Please add some in the Digital Wardrobe.</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {garments.map((g) => (
              <div 
                key={g.id} 
                onClick={() => toggle(g.id)}
                style={{
                  padding: '1rem', borderRadius: '8px', border: `2px solid ${selected.includes(g.id) ? 'var(--havells-red)' : 'var(--border)'}`,
                  cursor: 'pointer', background: selected.includes(g.id) ? '#FEF2F2' : 'white', position: 'relative'
                }}
              >
                {selected.includes(g.id) && <CheckCircle2 size={18} color="var(--havells-red)" style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Shirt size={16} color="var(--text-muted)" />
                  <strong style={{ fontSize: '0.875rem' }}>{g.name}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {g.fabric_type} • Health {g.health_score.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ marginBottom: '1rem' }}>2. Load Context</h3>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <label>Soiling Level</label>
              <select value={soiling} onChange={(e) => setSoiling(e.target.value)}>
                {(enums?.soiling_levels ?? ['light', 'normal', 'heavy', 'stain']).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Load Size</label>
              <select value={loadSize} onChange={(e) => setLoadSize(e.target.value)}>
                {(enums?.load_sizes ?? ['small', 'medium', 'large']).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={useAdaptive} onChange={(e) => setUseAdaptive(e.target.checked)} style={{ width: 'auto' }} />
            <span style={{ fontSize: '0.875rem' }}>Use adaptive AI learning (if available)</span>
          </label>

          <button className="primary" onClick={request} disabled={busy || selected.length === 0} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'Analysing…' : 'Get Recommendation'}
          </button>
        </div>

        <div>
          {message && <div style={{ padding: '1rem', background: message.includes('success') ? '#F0FDF4' : '#FEF2F2', color: message.includes('success') ? 'var(--success)' : 'var(--error)', borderRadius: '8px', marginBottom: '1rem', border: `1px solid ${message.includes('success') ? '#BBF7D0' : '#FECACA'}` }}>{message}</div>}
          {advisory ? (
            <RecommendationPanel advisory={advisory} onAccept={accept} accepting={accepting} />
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', color: 'var(--text-muted)' }}>
              <Shirt size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Select garments and click "Get Recommendation"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}