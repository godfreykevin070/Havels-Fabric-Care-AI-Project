import { Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import { UserProvider, useUserContext } from './context/UserContext';
import AdvisoryPage from './pages/AdvisoryPage';
import DashboardPage from './pages/DashboardPage';
import FeedbackPage from './pages/FeedbackPage';
import ProfilePage from './pages/ProfilePage';
import WardrobePage from './pages/WardrobePage';

function Shell() {
  const { users, loading, refreshUsers } = useUserContext();

  if (loading) return <div className="app-loading">Loading Fabric Care AI…</div>;

  if (users.length === 0) {
    return (
      <div className="app-loading">
        <p>No household members found.</p>
        <button
          className="primary"
          onClick={async () => {
            const { createUser } = await import('./api/client');
            await createUser({ name: 'Demo Household', email: 'demo@fabriccare.ai' });
            await refreshUsers();
          }}
        >
          Create demo user
        </button>
      </div>
    );
  }

  return (
    <>
      <NavBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/advisory" element={<AdvisoryPage />} />
          <Route path="/wardrobe" element={<WardrobePage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <Shell />
    </UserProvider>
  );
}