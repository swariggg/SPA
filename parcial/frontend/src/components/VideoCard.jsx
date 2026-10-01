import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <header>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#10b981">
          <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/>
        </svg>
        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>
          Stream<span style={{ color: '#10b981' }}>Green</span>
        </span>
      </Link>

      <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#0f172a', textDecoration: 'none' }}>Inicio</Link>
        {user ? (
          <>
            <Link to="/profile" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>
              {user.name}
            </Link>
            <button onClick={() => { logoutUser(); navigate('/auth'); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              Salir
            </button>
          </>
        ) : (
          <Link to="/auth">
            <button style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Ingresar</button>
          </Link>
        )}
      </nav>
    </header>
  );
}