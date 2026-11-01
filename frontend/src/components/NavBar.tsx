import { NavLink } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/advisory', label: 'Pre-Wash Advisory' },
  { to: '/wardrobe', label: 'Wardrobe' },
  { to: '/feedback', label: 'Feedback' },
  { to: '/profile', label: 'Profile & Learning' },
];

export default function NavBar() {
  const { users, currentUser, setCurrentUserId } = useUserContext();

  return (
    <header className="navbar">
      <div className="brand">
        <span className="brand-mark">FC</span>
        <div>
          <strong>Fabric Care AI</strong>
          <div className="brand-sub">Fabric Care Intelligence &amp; Garment Life Management</div>
        </div>
      </div>

      <nav className="nav-links">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="user-picker">
        <label htmlFor="user-select">Household member</label>
        <select
          id="user-select"
          value={currentUser?.id ?? ''}
          onChange={(e) => setCurrentUserId(Number(e.target.value))}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}