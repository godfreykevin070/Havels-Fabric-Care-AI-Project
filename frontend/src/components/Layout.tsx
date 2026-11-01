import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Shirt,
  MessageSquare,
  Brain,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { useUserContext } from '../context/UserContext';

export default function Layout() {
  const { users, currentUser, setCurrentUserId } = useUserContext();

  return (
    <div className="app-container">
      {/* PERSISTENT SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="havels-logo.png" alt="Havels-Logo" style={{ width: 40, height: 40 }} />
          <h2
            style={{
              color: 'var(--havells-red)',
              fontWeight: 800,
              letterSpacing: '-1px',
              fontSize: '1.25rem',
            }}
          >
            HAVELLS
          </h2>
        </div>

        <nav className="nav-links">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink
            to="/advisory"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Sparkles size={20} /> Pre-Wash Advisory
          </NavLink>
          <NavLink
            to="/wardrobe"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Shirt size={20} /> Digital Wardrobe
          </NavLink>
          <NavLink
            to="/feedback"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <MessageSquare size={20} /> Post-Wash Feedback
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Brain size={20} /> Profile & Learning
          </NavLink>
        </nav>

        <div
          style={{
            marginTop: 'auto',
            padding: '1rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {currentUser && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0.625rem',
                background: '#F9FAFB',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                marginBottom: '0.25rem',
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'var(--havells-red)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {currentUser.name ? (
                  currentUser.name.charAt(0).toUpperCase()
                ) : (
                  <UserIcon size={14} />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentUser.name}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentUser.email}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* DYNAMIC PAGE CONTENT */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}