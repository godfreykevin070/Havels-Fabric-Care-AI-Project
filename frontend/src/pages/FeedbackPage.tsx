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
    if (!currentUser) return;
    listWashCycles(currentUser.id).then((data) => {
      setCycles(data);
      setCycleId(data[0]?.id ?? null);
      setGarmentId(data[0]?.garment_ids?.[0] ?? null);
    });
    listGarments(currentUser.id).then(setGarments);
  }, [currentUser]);

  const selectedCycle = cycles.find((c) => c.id === cycleId) ?? null;

  const onSubmit = async (values: FeedbackValues) => {
    if (!currentUser || !cycleId) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await submitFeedback({
        user_id: currentUser.id,
        wash_cycle_id: cycleId,
        garment_id: garmentId,
        ...values,
      });
      setMessage(
        'Feedback stored. The garment health score was recomputed — retrain the adaptive model from the Profile tab.',
      );
    } catch (e: any) {
      setMessage(e?.response?.data?.detail ?? e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) return <p>Loading…</p>;

  return (
    <div className="page">
      <h1>Post-Wash Feedback</h1>
      <p className="muted">
        Feedback closes the loop: it updates garment health, the behaviour profile and the
        adaptive recommendation model (Milestone 2 — LEARN).
      </p>

      {message && <div className="alert-banner">{message}</div>}

      <div className="grid-2">
        <div className="card">
          <h2>Select the wash you are rating</h2>

          {cycles.length === 0 ? (
            <p className="muted">
              No wash cycles logged yet. Log one from the Pre-Wash Advisory tab first.
            </p>
          ) : (
            <>
              <label className="text-row">
                <span>Wash cycle</span>
                <select
                  value={cycleId ?? ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setCycleId(id);
                    const c = cycles.find((x) => x.id === id);
                    setGarmentId(c?.garment_ids?.[0] ?? null);
                  }}
                >
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.id} · {new Date(c.created_at).toLocaleString()} · {c.water_temp}°C /{' '}
                      {c.spin_rpm} RPM
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-row">
                <span>Garment</span>
                <select
                  value={garmentId ?? ''}
                  onChange={(e) =>
                    setGarmentId(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">— load-level feedback —</option>
                  {(selectedCycle?.garment_ids ?? []).map((id) => {
                    const g = garments.find((x) => x.id === id);
                    return (
                      <option key={id} value={id}>
                        {g ? `${g.name} (${g.fabric_type})` : `Garment #${id}`}
                      </option>
                    );
                  })}
                </select>
              </label>
            </>
          )}
        </div>

        <FeedbackForm onSubmit={onSubmit} submitting={submitting} />
      </div>
    </div>
  );
}