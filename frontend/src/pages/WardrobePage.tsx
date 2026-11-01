import { useEffect, useState } from 'react';
import { createGarment, deleteGarment, getFabrics, listGarments, logWear } from '../api/client';
import HealthBar from '../components/HealthBar';
import { useUserContext } from '../context/UserContext';
import type { FabricInfo, Garment } from '../types';
import { Plus, Trash2, Shirt } from 'lucide-react';

export default function WardrobePage() {
  const { currentUser } = useUserContext();
  const [garments, setGarments] = useState<Garment[]>([]);
  const [fabrics, setFabrics] = useState<FabricInfo[]>([]);
  const [form, setForm] = useState({ name: '', fabric_type: 'cotton', color_group: 'light', purchase_date: '' });
  const [busy, setBusy] = useState(false);

  const refresh = () => { if (currentUser) listGarments(currentUser.id).then(setGarments); };

  useEffect(refresh, [currentUser]);
  useEffect(() => { getFabrics().then(f => { setFabrics(f); setForm(prev => ({ ...prev, fabric_type: f[0]?.key || 'cotton' })); }); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setBusy(true);
    try {
      await createGarment({ user_id: currentUser.id, name: form.name, fabric_type: form.fabric_type, color_group: form.color_group, purchase_date: form.purchase_date || null });
      setForm({ ...form, name: '', purchase_date: '' });
      refresh();
    } finally { setBusy(false); }
  };

  if (!currentUser) return <p>Loading…</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Digital Wardrobe</h1>
        <p>Manage your garments and track their lifecycle health.</p>
      </div>

      <div className="grid-2">
        <form className="card" onSubmit={submit}>
          <h3 style={{ marginBottom: '1rem' }}>Register New Garment</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label>Garment Name</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Navy Slim Jeans" />
            </div>
            <div>
              <label>Fabric Type</label>
              <select value={form.fabric_type} onChange={e => setForm({ ...form, fabric_type: e.target.value })}>
                {fabrics.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label>Color Group</label>
              <select value={form.color_group} onChange={e => setForm({ ...form, color_group: e.target.value })}>
                {['white', 'light', 'bright', 'dark'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Purchase Date (Optional)</label>
              <input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
            </div>
            <button className="primary" type="submit" disabled={busy} style={{ marginTop: '0.5rem' }}>
              {busy ? 'Saving…' : <><Plus size={18} /> Add Garment</>}
            </button>
          </div>
        </form>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Fabric Care Reference</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {fabrics.map(f => (
              <div key={f.key} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }}>
                <strong>{f.label}</strong>
                <span style={{ color: 'var(--text-muted)' }}> — {f.temp_range[0]}–{f.temp_range[1]}°C, max {f.max_spin_rpm} RPM</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Your Garments ({garments.length})</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {garments.map(g => (
            <div key={g.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', background: '#F9FAFB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Shirt size={16} color="var(--havells-red)" />
                    <strong style={{ fontSize: '1rem' }}>{g.name}</strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{g.fabric_type} • {g.color_group}</span>
                </div>
                <button className="danger" onClick={async () => { await deleteGarment(g.id); refresh(); }} style={{ padding: '0.4rem' }}><Trash2 size={16} /></button>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Fabric Health</span>
                  <strong>{g.health_score.toFixed(0)}%</strong>
                </div>
                <HealthBar score={g.health_score} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                <span>{g.wear_count} Wears</span>
                <span>{g.wash_count} Washes</span>
              </div>

              <button className="secondary" onClick={async () => { await logWear(g.id); refresh(); }} style={{ width: '100%', fontSize: '0.875rem' }}>
                + Log a Wear
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}