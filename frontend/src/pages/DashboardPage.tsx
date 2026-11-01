import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  ArrowRight,
  Heart,
  Star,
  Droplets,
  Shirt,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import { getDashboard } from '../api/client';
import type { Dashboard } from '../types';

const HEALTH_COLORS = ['#DC2626', '#F59E0B', '#16A34A'];

interface EmptyStateProps {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  message: string;
  height?: number | string;
}

function EmptyState({ icon: Icon, message, height = 250 }: EmptyStateProps) {
  return (
    <div
      style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'var(--text-muted)',
        gap: '0.75rem',
        padding: '1.5rem',
      }}
    >
      <Icon size={32} style={{ opacity: 0.25 }} />
      <p style={{ fontSize: '0.875rem', maxWidth: '280px', margin: 0, lineHeight: 1.4 }}>
        {message}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser } = useUserContext();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      getDashboard(currentUser.id)
        .then(setData)
        .finally(() => setLoading(false));
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div
        style={{
          padding: '3rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          color: 'var(--text-muted)',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '3px solid #FECACA',
            borderTopColor: 'var(--havells-red)',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading dashboard...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '2rem', color: 'var(--error)' }}>
        Failed to load dashboard data.
      </div>
    );
  }

  const pieData = data.wardrobe.health_distribution.map((b) => ({
    name: b.bucket,
    value: b.count,
  }));
  const hasHealthDistributionData =
    pieData.length > 0 && pieData.some((entry) => entry.value > 0);

  const firstName = data.user?.name ? data.user.name.trim().split(' ')[0] : '';

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back{firstName ? `, ${firstName}` : ''}! 👋</h1>
        <p>Let's keep your clothes looking newer for longer.</p>
      </div>

      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <h1>
            Smart Fabric Care
            <br />
            for a Longer Life
          </h1>
          <p>AI-powered recommendations for the perfect wash, every time.</p>
          <button className="primary" onClick={() => navigate('/advisory')}>
            Get Recommendation <ArrowRight size={18} />
          </button>
        </div>

        {/* Havells-styled Washing Machine & Fabric Care Graphic */}
        <div
          style={{
            width: '260px',
            height: '170px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 100%)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 8px 20px -6px rgba(227, 24, 55, 0.12)',
            flexShrink: 0,
          }}
        >
          <svg width="180" height="135" viewBox="0 0 180 135" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="drumGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF1F2" />
                <stop offset="100%" stopColor="#FFE4E6" />
              </linearGradient>
              <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F4F4F5" />
              </linearGradient>
            </defs>
            <rect x="40" y="10" width="100" height="115" rx="12" fill="url(#chassisGrad)" stroke="#E4E4E7" strokeWidth="2" />
            <rect x="40" y="10" width="100" height="26" rx="12" fill="#FAFAFA" />
            <line x1="40" y1="36" x2="140" y2="36" stroke="#E4E4E7" strokeWidth="1.5" />
            <circle cx="62" cy="23" r="5" fill="#FFFFFF" stroke="var(--havells-red)" strokeWidth="1.8" />
            <circle cx="62" cy="23" r="2" fill="var(--havells-red)" />
            <circle cx="78" cy="23" r="1.5" fill="#22C55E" />
            <circle cx="84" cy="23" r="1.5" fill="#3B82F6" />
            <rect x="94" y="18" width="22" height="10" rx="3" fill="#18181B" />
            <rect x="98" y="22" width="14" height="2" rx="1" fill="#E31837" />
            <circle cx="90" cy="76" r="34" fill="#FFFFFF" stroke="#E4E4E7" strokeWidth="2" />
            <circle cx="90" cy="76" r="28" fill="url(#drumGlow)" stroke="var(--havells-red)" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="90" cy="76" r="20" fill="#FFFFFF" fillOpacity="0.9" />
            <path d="M79 78C83 73 87 73 90 76C93 79 97 79 101 74" stroke="var(--havells-red)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M83 84C86 81 89 81 92 83C95 85 97 85 99 82" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
            <circle cx="114" cy="56" r="3" fill="var(--havells-red)" opacity="0.35" />
            <circle cx="66" cy="67" r="2" fill="#3B82F6" opacity="0.45" />
            <circle cx="65" cy="94" r="3" fill="var(--havells-red)" opacity="0.25" />
          </svg>
        </div>
      </div>

      {/* Stat Cards - Clean stats without fabricated trends */}
      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shirt size={16} /> Avg Fabric Health
          </div>
          <div className="stat-value">{data.wardrobe.average_health}%</div>
        </div>
        <div className="card stat-card">
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Droplets size={16} /> Total Washes
          </div>
          <div className="stat-value">{data.usage.total_washes}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={16} /> Your Satisfaction
          </div>
          <div className="stat-value">
            {data.usage.avg_satisfaction.toFixed(1)}
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/5</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Heart size={16} /> Care Group
          </div>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>
            {data.profile?.care_group || 'Balanced Care'}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Based on your habits</div>
        </div>
      </div>

      {/* Middle Charts */}
      <div className="dashboard-grid">
        {/* 1. Fabric Health by Material */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Fabric Health by Material</h3>
          <div style={{ height: 250 }}>
            {data.wardrobe.by_fabric.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                message="No garment data yet. Add items to your wardrobe to see health analytics."
                height="100%"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.wardrobe.by_fabric}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="fabric" tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#71717A' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5' }} />
                  <Bar dataKey="avg_health" fill="var(--havells-red)" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 3. Wash Temp & Spin Trends */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Wash Temp & Spin Trends</h3>
          <div style={{ height: 250 }}>
            {data.usage.temp_trend.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                message="No wash cycles logged yet. Complete a wash to see trends."
                height="100%"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.usage.temp_trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" domain={[0, 90]} axisLine={false} tickLine={false} tick={{ fill: '#71717A' }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 1200]} axisLine={false} tickLine={false} tick={{ fill: '#71717A' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5' }} />
                  <Line yAxisId="left" type="monotone" dataKey="water_temp" stroke="var(--havells-red)" strokeWidth={3} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="spin_rpm" stroke="#A1A1AA" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Tables & Quick Actions */}
      <div className="bottom-grid">
        {/* 4. Recent Activity */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Recent Activity</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_wash_cycles.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem 1rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Clock size={28} style={{ opacity: 0.25 }} />
                      <span style={{ fontSize: '0.875rem' }}>No recent activity.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.recent_wash_cycles.slice(0, 3).map((c) => (
                  <tr key={c.id}>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>Wash Completed</td>
                    <td>
                      {c.water_temp}°C • {c.spin_rpm} RPM
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Your Top Garments */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Your Top Garments</h3>
          {data.wardrobe.items.length === 0 ? (
            <EmptyState
              icon={Shirt}
              message="Your wardrobe is empty. Add garments to get started."
              height={180}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.wardrobe.items.slice(0, 3).map((g) => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      background: '#F4F4F5',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Shirt size={20} color="#71717A" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      <span>{g.name}</span>
                      <span>{g.health_score.toFixed(0)}%</span>
                    </div>
                    <div className="health-bar">
                      <div
                        className={`health-fill ${g.health_score > 70 ? 'good' : 'warn'}`}
                        style={{ width: `${g.health_score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}