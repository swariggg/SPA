import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const res = await apiFetch('/login', {
          method: 'POST',
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        loginUser(res.user);
        navigate('/');
      } else {
        const newUser = await apiFetch('/users/', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        loginUser(newUser);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
        {error && <div className="error-badge">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Nombre de Usuario</label>
              <input 
                type="text" 
                name="username" 
                value={formData.username} 
                onChange={handleChange} 
                required 
              />
            </div>
          )}
          <div className="form-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary full-width">
            {isLogin ? 'Entrar' : 'Registrarse'}
          </button>
        </form>

        <p className="toggle-auth">
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <span onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
          </span>
        </p>
      </div>
    </div>
  );
};