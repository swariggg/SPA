import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { AuthContext } from '../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const user = await api.login({ email: formData.email, password: formData.password });
        loginUser(user);
      } else {
        const user = await api.register(formData);
        loginUser(user);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main style={{ maxWidth: '400px', marginTop: '3rem' }}>
      <section style={{ border: '1px solid #e2e8f0', padding: '2rem', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          {isLogin ? 'Iniciar Sesion' : 'Crear Cuenta'}
        </h2>

        {error && <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Nombre completo"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          )}
          <input
            type="email"
            placeholder="Correo electronico"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Contrasena"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <button type="submit">{isLogin ? 'Entrar' : 'Registrarse'}</button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', color: '#10b981', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            {isLogin ? 'Registrate aqui' : 'Inicia sesion'}
          </button>
        </p>
      </section>
    </main>
  );
}