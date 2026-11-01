import { useEffect, useState } from 'react';
import {
  getProfile,
  rebuildProfile,
  trainModel,
} from '../api/client';
import StatCard from '../components/StatCard';
import { useUserContext } from '../context/UserContext';
import type { TrainResult, UserProfile } from '../types';

export default function ProfilePage() {
  const { currentUser } = useUserContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trainResult, setTrainResult] = useState<TrainResult | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!currentUser) return;
    getProfile(currentUser.id).then(setProfile);
  };

  useEffect(load, [currentUser]);

  const rebuild = async () => {
    if (!currentUser) return;
    setBusy(true);
    try {
      setProfile(await rebuildProfile(currentUser.id));
    } finally {
      setBusy(false);
    }
  };

  const train = async () => {
    if (!currentUser) return;
    setBusy(true);
    try {
      setTrainResult(await trainModel(currentUser.id));
    } finally {
      setBusy(false);
    }
  };

  if (!currentUser) return <p>Loading…</p>;
  if (!profile) return <p>Loading profile…</p>;

  const metrics = profile.metrics ?? {};

  return (
    <div className="page">
      <h1>Behaviour Profile &amp; Adaptive Learning</h1>

      <section className="stat-row">
        <StatCard label="Care group" value={profile.care_group} hint={profile.model_version} />
        <StatCard label="Preferred temperature" value={`${profile.preferred_temp}°C`} />
        <StatCard label="Preferred spin" value={`${profile.preferred_spin} RPM`} />
        <StatCard label="Preferred duration" value={`${profile.preferred_duration} min`} />
        <StatCard label="Gentle index" value={profile.gentle_index.toFixed(2)} />
        <StatCard
          label="Avg defect score"
          value={profile.avg_defect_score.toFixed(2)}
          tone={profile.avg_defect_score <= 0.5 ? 'good' : 'warn'}
        />
      </section>

      <div className="grid-2">
        <div className="card">
          <h2>Behaviour metrics</h2>
          <table>
            <tbody>
              {Object.entries(metrics).map(([key, value]) => (
                <tr key={key}>
                  <td>{key.replace(/_/g, ' ')}</td>
                  <td>
                    <strong>{typeof value === 'number' ? value.toFixed(2) : String(value)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small">
            Profile last updated {new Date(profile.updated_at).toLocaleString()} ·{' '}
            {profile.total_washes} washes · {profile.total_feedbacks} feedback records
          </p>
          <button className="primary" onClick={rebuild} disabled={busy}>
            {busy ? 'Working…' : 'Rebuild profile'}
          </button>
        </div>

        <div className="card">
          <h2>Adaptive recommendation model</h2>
          <p className="muted">
            A Ridge regression is trained on your own wash history to predict fabric damage
            (fading, shrinkage, roughness, pilling, colour loss) and cleaning shortfall for
            candidate settings. The optimiser then picks the settings that minimise predicted
            damage while staying close to the rule-engine baseline.
          </p>

          <button className="primary" onClick={train} disabled={busy}>
            {busy ? 'Training…' : 'Retrain adaptive model'}
          </button>

          {trainResult && (
            <div className={`train-result ${trainResult.trained ? 'ok' : 'warn'}`}>
              {trainResult.trained ? (
                <>
                  ✔ Model trained on <strong>{trainResult.n_samples}</strong> feedback records
                  at {trainResult.trained_at && new Date(trainResult.trained_at).toLocaleString()}.
                </>
              ) : (
                <>
                  ⚠ Not trained: {trainResult.reason}. Collect more post-wash feedback (minimum
                  12 records) to activate adaptive optimisation.
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}