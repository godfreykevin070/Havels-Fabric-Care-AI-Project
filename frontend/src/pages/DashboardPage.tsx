import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getDashboard } from '../api/client';
import HealthBar from '../components/HealthBar';
import StatCard from '../components/StatCard';
import { useUserContext } from '../context/UserContext';
import type { Dashboard } from '../types';

const HEALTH_COLORS = ['#d9534f', '#e08e3c', '#e5c95c', '#7fb069', '#2f9e59'];

export default function DashboardPage() {
  const { currentUser } = useUserContext();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    getDashboard(currentUser.id)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [currentUser]);

  if (!currentUser) return <p>Loading household members…</p>;
  if (error) return <p className="error">Failed to load dashboard: {error}</p>;
  if (!data) return <p>Loading dashboard…</p>;

  const healthByFabric = data.wardrobe.by_fabric.map((f) => ({
    fabric: f.fabric,
    health: f.avg_health,
    washes: f.total_washes,
  }));

  const careGroupData = data.profile
    ? [
        { name: 'Gentle', value: Math.round((1 - data.profile.gentle_index) * 100) },
        { name: 'Care intensity', value: Math.round(data.profile.gentle_index * 100) },
      ]
    : [];

  return (
    <div className="page">
      <h1>Dashboard — {data.user.name}</h1>

      {data.alerts.length > 0 && (
        <div className="alert-banner">
          {data.alerts.map((a, i) => (
            <div key={i}>⚠ {a}</div>
          ))}
        </div>
      )}

      <section className="stat-row">
        <StatCard label="Garments tracked" value={data.wardrobe.total_garments} />
        <StatCard
          label="Average fabric health"
          value={data.wardrobe.average_health.toFixed(1)}
          tone={data.wardrobe.average_health >= 70 ? 'good' : 'warn'}
        />
        <StatCard label="Total washes logged" value={data.usage.total_washes} />
        <StatCard label="Total wears logged" value={data.usage.total_wears} />
        <StatCard
          label="Care group"
          value={data.profile?.care_group ?? '—'}
          hint={data.profile?.model_version}
        />
        <StatCard
          label="Avg cleaning satisfaction"
          value={data.usage.avg_satisfaction.toFixed(2)}
          tone={data.usage.avg_satisfaction >= 4 ? 'good' : 'warn'}
        />
      </section>

      <section className="grid-2">
        <div className="card">
          <h2>Fabric health by material</h2>
          {healthByFabric.length === 0 ? (
            <p className="muted">No garments registered yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={healthByFabric}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fabric" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="health" name="Avg health" fill="#4b7bec" radius={[4, 4, 0, 0]} />
                <Bar dataKey="washes" name="Washes" fill="#a5b1c2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2>Health distribution</h2>
          {data.wardrobe.health_distribution.every((b) => b.count === 0) ? (
            <p className="muted">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.wardrobe.health_distribution}
                  dataKey="count"
                  nameKey="bucket"
                  innerRadius={50}
                  outerRadius={95}
                  label={(entry: { bucket: string; count: number }) =>
                    entry.count ? `${entry.bucket}: ${entry.count}` : ''
                  }
                >
                  {data.wardrobe.health_distribution.map((_, i) => (
                    <Cell key={i} fill={HEALTH_COLORS[i % HEALTH_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2>Wash temperature trend</h2>
          {data.usage.temp_trend.length === 0 ? (
            <p className="muted">No wash cycles logged yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.usage.temp_trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" domain={[0, 70]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 1400]} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="water_temp"
                  name="Temp °C"
                  stroke="#eb5757"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="spin_rpm"
                  name="Spin RPM"
                  stroke="#2d9cdb"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2>Wardrobe health snapshot</h2>
          <ul className="health-list">
            {data.wardrobe.items.slice(0, 8).map((g) => (
              <li key={g.id}>
                <div className="health-item-head">
                  <strong>{g.name}</strong>
                  <span className="muted">{g.fabric_type}</span>
                </div>
                <HealthBar score={g.health_score} />
                <div className="muted small">
                  {g.wear_count} wears · {g.wash_count} washes · {g.age_days} days old
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid-2">
        <div className="card">
          <h2>Recent recommendations</h2>
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Engine</th>
                <th>Temp</th>
                <th>Spin</th>
                <th>Accepted</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_recommendations.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>{r.engine}</td>
                  <td>{(r.settings as any).water_temp ?? '—'}</td>
                  <td>{(r.settings as any).spin_rpm ?? '—'}</td>
                  <td>{r.accepted ? '✔' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Recent wash cycles</h2>
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>°C</th>
                <th>RPM</th>
                <th>min</th>
                <th>Engine</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_wash_cycles.map((c) => (
                <tr key={c.id}>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>{c.water_temp}</td>
                  <td>{c.spin_rpm}</td>
                  <td>{c.duration_min}</td>
                  <td>{c.engine_used}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}