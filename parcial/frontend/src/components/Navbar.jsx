import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/auth');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        yutuuu
      </Link>
      <div className="navbar-links">
        <Link to="/">Inicio</Link>
        {user ? (
          <>
            <Link to={`/profile/${user.id}`}>Mi Perfil ({user.username})</Link>
            <button onClick={handleLogout} className="btn-secondary">Cerrar Sesión</button>
          </>
        ) : (
          <Link to="/auth" className="btn-primary">Iniciar Sesión</Link>
        )}
      </div>
    </nav>
  );
};