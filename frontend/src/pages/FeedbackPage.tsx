import { useEffect, useState } from 'react';
import { listGarments, listWashCycles, submitFeedback } from '../api/client';
import FeedbackForm from '../components/FeedbackForm';
import type { FeedbackValues } from '../components/FeedbackForm';
import { useUserContext } from '../context/UserContext';
import type { Garment, WashCycle } from '../types';

export default function FeedbackPage() {
  const { currentUser } = useUserContext();
  const [cycles, setCycles] = useState<WashCycle[]>([]);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [cycleId, setCycleId] = useState<number | null>(null);
  const [garmentId, setGarmentId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      listWashCycles(currentUser.id).then(data => { setCycles(data); if(data.length > 0) setCycleId(data[0].id); });
      listGarments(currentUser.id).then(setGarments);
    }
  }, [currentUser]);

  const selectedCycle = cycles.find(c => c.id === cycleId) ?? null;

  useEffect(() => {
    if (selectedCycle && selectedCycle.garment_ids.length > 0) {
      setGarmentId(selectedCycle.garment_ids[0]);
    } else {
      setGarmentId(null);
    }
  }, [cycleId, selectedCycle]);

  const onSubmit = async (values: FeedbackValues) => {
    if (!currentUser || !cycleId) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await submitFeedback({ user_id: currentUser.id, wash_cycle_id: cycleId, garment_id: garmentId, ...values });
      setMessage('Feedback submitted successfully. Garment health updated.');
    } catch (e: any) {
      setMessage(e?.response?.data?.detail ?? e.message);
    } finally { setSubmitting(false); }
  };

  if (!currentUser) return <p>Loading…</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Post-Wash Feedback</h1>
        <p>Rate your recent washes to improve the AI's personalized recommendations.</p>
      </div>

      {message && <div style={{ padding: '1rem', background: '#F0FDF4', color: 'var(--success)', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #BBF7D0' }}>{message}</div>}

      <div className="grid-2">
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1rem' }}>Select Wash Cycle</h3>
          {cycles.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No wash cycles logged yet. Use the Pre-Wash Advisory first.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>Recent Wash</label>
                <select value={cycleId ?? ''} onChange={e => setCycleId(Number(e.target.value))}>
                  {cycles.map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.id} · {new Date(c.created_at).toLocaleString()} · {c.water_temp}°C
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedCycle && selectedCycle.garment_ids.length > 0 && (
                <div>
                  <label>Select Specific Garment (Optional)</label>
                  <select value={garmentId ?? ''} onChange={e => setGarmentId(e.target.value ? Number(e.target.value) : null)}>
                    <option value="">— Whole Load Feedback —</option>
                    {selectedCycle.garment_ids.map(id => {
                      const g = garments.find(x => x.id === id);
                      return <option key={id} value={id}>{g ? g.name : `Garment #${id}`}</option>;
                    })}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        <FeedbackForm onSubmit={onSubmit} submitting={submitting} />
      </div>
    </div>
  );
}