import { useEffect, useState } from 'react';
import { api } from '../api/client';
import VideoCard from '../components/VideoCard';

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVideos()
      .then(setVideos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main><p>Cargando catalogo...</p></main>;

  return (
    <main>
      <h2 style={{ marginBottom: '1.5rem' }}>Videos Recomendados</h2>
      {videos.length === 0 ? (
        <p>No hay videos publicados aun.</p>
      ) : (
        <section className="video-grid">
          {videos.map((vid) => (
            <VideoCard key={vid.id} video={vid} />
          ))}
        </section>
      )}
    </main>
  );
}