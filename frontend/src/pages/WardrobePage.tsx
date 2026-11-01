import { useEffect, useState } from 'react';
import {
  createGarment,
  deleteGarment,
  getFabrics,
  listGarments,
  logWear,
} from '../api/client';
import HealthBar from '../components/HealthBar';
import { useUserContext } from '../context/UserContext';
import type { FabricInfo, Garment } from '../types';

export default function WardrobePage() {
  const { currentUser } = useUserContext();
  const [garments, setGarments] = useState<Garment[]>([]);
  const [fabrics, setFabrics] = useState<FabricInfo[]>([]);
  const [form, setForm] = useState({
    name: '',
    fabric_type: 'cotton',
    color_group: 'light',
    purchase_date: '',
  });
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    if (!currentUser) return;
    listGarments(currentUser.id).then(setGarments);
  };

  useEffect(refresh, [currentUser]);
  useEffect(() => {
    getFabrics().then((f) => {
      setFabrics(f);
      setForm((prev) => ({ ...prev, fabric_type: f[0]?.key ?? 'cotton' }));
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setBusy(true);
    try {
      await createGarment({
        user_id: currentUser.id,
        name: form.name,
        fabric_type: form.fabric_type,
        color_group: form.color_group,
        purchase_date: form.purchase_date || null,
      });
      setForm({ ...form, name: '', purchase_date: '' });
      refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!currentUser) return <p>Loading…</p>;

  return (
    <div className="page">
      <h1>Digital Wardrobe</h1>
      <p className="muted">
        Each garment tracks wear count, wash count, age and a fabric health score
        (Milestone 3 — TRACK).
      </p>

      <div className="grid-2">
        <form className="card" onSubmit={submit}>
          <h2>Register a garment</h2>

          <label className="text-row">
            <span>Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Navy Slim Jeans"
            />
          </label>

          <label className="text-row">
            <span>Fabric</span>
            <select
              value={form.fabric_type}
              onChange={(e) => setForm({ ...form, fabric_type: e.target.value })}
            >
              {fabrics.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label} (max {f.temp_range[1]}°C / {f.max_spin_rpm} RPM)
                </option>
              ))}
            </select>
          </label>

          <label className="text-row">
            <span>Colour group</span>
            <select
              value={form.color_group}
              onChange={(e) => setForm({ ...form, color_group: e.target.value })}
            >
              {['white', 'light', 'bright', 'dark'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="text-row">
            <span>Purchase date</span>
            <input
              type="date"
              value={form.purchase_date}
              onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
            />
          </label>

          <button className="primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Add garment'}
          </button>
        </form>

        <div className="card">
          <h2>Fabric care reference</h2>
          <ul className="fabric-ref">
            {fabrics.map((f) => (
              <li key={f.key}>
                <strong>{f.label}</strong>
                <span className="muted">
                  {' '}
                  · {f.temp_range[0]}–{f.temp_range[1]}°C · max {f.max_spin_rpm} RPM ·{' '}
                  {f.cycle_type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2>Garments ({garments.length})</h2>
        {garments.length === 0 ? (
          <p className="muted">No garments registered yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Fabric</th>
                <th>Colour</th>
                <th>Wears</th>
                <th>Washes</th>
                <th>Health</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {garments.map((g) => (
                <tr key={g.id}>
                  <td>{g.name}</td>
                  <td>{g.fabric_type}</td>
                  <td>{g.color_group}</td>
                  <td>{g.wear_count}</td>
                  <td>{g.wash_count}</td>
                  <td style={{ minWidth: 140 }}>
                    <HealthBar score={g.health_score} />
                  </td>
                  <td className="row-actions">
                    <button
                      onClick={async () => {
                        await logWear(g.id);
                        refresh();
                      }}
                    >
                      + Wear
                    </button>
                    <button
                      className="danger"
                      onClick={async () => {
                        await deleteGarment(g.id);
                        refresh();
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}