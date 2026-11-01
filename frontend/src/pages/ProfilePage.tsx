import { useEffect, useState } from 'react';
import { getProfile, rebuildProfile, trainModel } from '../api/client';
import { useUserContext } from '../context/UserContext';
import type { TrainResult, UserProfile } from '../types';
import { Brain, RefreshCw, Zap, TrendingUp } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser } = useUserContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trainResult, setTrainResult] = useState<TrainResult | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => { if (currentUser) getProfile(currentUser.id).then(setProfile); };
  useEffect(load, [currentUser]);

  const rebuild = async () => {
    if (!currentUser) return;
    setBusy(true);
    try { setProfile(await rebuildProfile(currentUser.id)); } finally { setBusy(false); }
  };

  const train = async () => {
    if (!currentUser) return;
    setBusy(true);
    try { setTrainResult(await trainModel(currentUser.id)); } finally { setBusy(false); }
  };

  if (!currentUser || !profile) return <p>Loading…</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Profile & Learning</h1>
        <p>Review your household's washing behavior and the AI's learning status.</p>
      </div>

      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-title">Care Group</div>
          <div className="stat-value" style={{ color: 'var(--havells-red)' }}>{profile.care_group}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-title">Gentle Index</div>
          <div className="stat-value">{profile.gentle_index.toFixed(2)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-title">Preferred Temp</div>
          <div className="stat-value">{profile.preferred_temp}°C</div>
        </div>
        <div className="card stat-card">
          <div className="stat-title">Total Washes</div>
          <div className="stat-value">{profile.total_washes}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={20} /> Behavior Metrics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#F9FAFB', borderRadius: '8px' }}>
              <span>Preferred Spin</span><strong>{profile.preferred_spin} RPM</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#F9FAFB', borderRadius: '8px' }}>
              <span>Avg Defect Score</span><strong>{profile.avg_defect_score.toFixed(2)} / 3</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#F9FAFB', borderRadius: '8px' }}>
              <span>Feedback Records</span><strong>{profile.total_feedbacks}</strong>
            </div>
          </div>
          <button className="secondary" onClick={rebuild} disabled={busy} style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={16} /> Rebuild Profile
          </button>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Brain size={20} /> Adaptive ML Model</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            A Ridge Regression model predicts fabric damage based on your feedback. Retrain it once you have at least 12 feedback records.
          </p>
          
          <button className="primary" onClick={train} disabled={busy} style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={16} /> {busy ? 'Training…' : 'Retrain Model'}
          </button>

          {trainResult && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', background: trainResult.trained ? '#F0FDF4' : '#FFFBEB', color: trainResult.trained ? 'var(--success)' : '#92400E', border: `1px solid ${trainResult.trained ? '#BBF7D0' : '#FDE68A'}`, fontSize: '0.875rem' }}>
              {trainResult.trained 
                ? `✔ Model trained successfully on ${trainResult.n_samples} records.`
                : `⚠ Cannot train: ${trainResult.reason}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}