import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import AdvisoryPage from './pages/AdvisoryPage';
import WardrobePage from './pages/WardrobePage';
import FeedbackPage from './pages/FeedbackPage';
import ProfilePage from './pages/ProfilePage';
import { UserProvider, useUserContext } from './context/UserContext';
import { createUser } from './api/client';
import { Sparkles, UserPlus } from 'lucide-react';

function OnboardingScreen() {
  const { refreshUsers, setCurrentUserId } = useUserContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const user = await createUser({
        name: name.trim(),
        email: email.trim(),
      });
      await refreshUsers();
      setCurrentUserId(user.id);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          err?.message ??
          'Failed to create user. Please check backend connection.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '2rem',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#FEF2F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--havells-red)',
            }}
          >
            <Sparkles size={24} />
          </div>
          <div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--havells-red)',
                letterSpacing: '-0.5px',
              }}
            >
              HAVELLS
            </h2>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              FabricLife AI
            </span>
          </div>
        </div>

        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            marginBottom: '0.5rem',
          }}
        >
          Welcome to FabricLife
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            marginBottom: '1.75rem',
          }}
        >
          Set up your household profile to start tracking garment health, optimizing wash cycles, and receiving AI-powered fabric care advisories.
        </p>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              color: 'var(--error)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <div>
            <label htmlFor="user-name">Your Full Name</label>
            <input
              id="user-name"
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div>
            <label htmlFor="user-email">Email Address</label>
            <input
              id="user-email"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jane@example.com"
            />
          </div>

          <button
            type="submit"
            className="primary"
            disabled={submitting || !name.trim() || !email.trim()}
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: '0.5rem',
              padding: '0.85rem',
            }}
          >
            {submitting ? (
              'Creating Profile...'
            ) : (
              <>
                <UserPlus size={18} /> Get Started
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function AppContent() {
  const { users, currentUser, loading } = useUserContext();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          color: 'var(--text-muted)',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '3px solid #FECACA',
            borderTopColor: 'var(--havells-red)',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
          Loading FabricLife...
        </span>
      </div>
    );
  }

  if (users.length === 0 || !currentUser) {
    return <OnboardingScreen />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/advisory" element={<AdvisoryPage />} />
        <Route path="/wardrobe" element={<WardrobePage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}