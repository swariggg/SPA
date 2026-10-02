import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { VideoCard } from '../components/VideoCard';

export const HomePage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await apiFetch('/videos/');
        setVideos(data);
      } catch (err) {
        setError('No se pudieron cargar los videos.');
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (loading) return <div className="loading">Cargando videos...</div>;

  return (
    <div className="page-container">
      <h1>Videos Destacados</h1>
      {error && <p className="error-badge">{error}</p>}
      {videos.length === 0 ? (
        <p style={{ marginTop: '1rem' }}>No hay videos publicados aún. ¡Sé el primero en subir uno!</p>
      ) : (
        <div className="video-grid">
          {videos.map((vid) => (
            <VideoCard key={vid.id} video={vid} />
          ))}
        </div>
      )}
    </div>
  );
};