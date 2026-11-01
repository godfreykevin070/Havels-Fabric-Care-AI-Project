import { useEffect, useMemo, useState } from 'react';
import {
  createWashCycle,
  getAdvisory,
  getEnums,
  listGarments,
} from '../api/client';
import RecommendationPanel from '../components/RecommendationPanel';
import { useUserContext } from '../context/UserContext';
import type { Advisory, Garment, MetaEnums } from '../types';

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
    if (!currentUser) return;
    listGarments(currentUser.id).then(setGarments);
  }, [currentUser]);

  useEffect(() => {
    getEnums().then(setEnums);
  }, []);

  const selectedGarments = useMemo(
    () => garments.filter((g) => selected.includes(g.id)),
    [garments, selected],
  );

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const request = async () => {
    if (!currentUser) return;
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
      setMessage('Wash logged. Garment counters and health scores updated.');
    } catch (e: any) {
      setMessage(e?.response?.data?.detail ?? e.message);
    } finally {
      setAccepting(false);
    }
  };

  if (!currentUser) return <p>Loading…</p>;

  return (
    <div className="page">
      <h1>Pre-Wash Advisory</h1>
      <p className="muted">
        Select the garments you are about to wash. The rule engine produces a safe baseline;
        the adaptive engine refines it using your past feedback.
      </p>

      <div className="grid-2">
        <div className="card">
          <h2>1. Select garments</h2>
          {garments.length === 0 && <p className="muted">No garments yet — add some in Wardrobe.</p>}
          <ul className="select-list">
            {garments.map((g) => (
              <li key={g.id} className={selected.includes(g.id) ? 'selected' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.includes(g.id)}
                    onChange={() => toggle(g.id)}
                  />
                  <span>
                    <strong>{g.name}</strong>
                    <span className="muted"> · {g.fabric_type} · {g.color_group}</span>
                    <span className="muted small">
                      {' '}
                      · health {g.health_score.toFixed(0)} · washed {g.wash_count}×
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <h2>2. Load context</h2>
          <div className="field-row">
            <label>
              Soiling level
              <select value={soiling} onChange={(e) => setSoiling(e.target.value)}>
                {(enums?.soiling_levels ?? ['light', 'normal', 'heavy', 'stain']).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Load size
              <select value={loadSize} onChange={(e) => setLoadSize(e.target.value)}>
                {(enums?.load_sizes ?? ['small', 'medium', 'large']).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={useAdaptive}
              onChange={(e) => setUseAdaptive(e.target.checked)}
            />
            Use adaptive learning (requires enough past feedback)
          </label>

          <button className="primary" onClick={request} disabled={busy}>
            {busy ? 'Analysing…' : 'Get recommendation'}
          </button>

          {selectedGarments.length > 1 && (
            <p className="muted small">
              Mixed load: recommendation is anchored on the most delicate fabric (
              {selectedGarments
                .map((g) => g.fabric_type)
                .sort()
                .join(', ')}
              ).
            </p>
          )}
        </div>

        <div>
          {message && <div className="alert-banner">{message}</div>}
          {advisory ? (
            <RecommendationPanel advisory={advisory} onAccept={accept} accepting={accepting} />
          ) : (
            <div className="card empty-state">
              <h2>No recommendation yet</h2>
              <p className="muted">
                Pick at least one garment and press “Get recommendation”.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}