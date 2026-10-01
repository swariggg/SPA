import { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { AuthContext } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';

export default function PlayerPage() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [video, setVideo] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    api.getVideoById(id).then(setVideo);
    api.getComments(id).then(setComments);
    api.getVideos().then((vids) => setRecommended(vids.filter((v) => v.id !== Number(id))));
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      const created = await api.addComment(id, { content: newComment, user_id: user.id });
      setComments([...comments, created]);
      setNewComment('');
    } catch (err) {
      alert(err.message);
    }
  };

  if (!video) return <main><p>Cargando reproductor...</p></main>;

  return (
    <main className="player-layout">
      <section>
        <video src={video.video_url} controls autoPlay style={{ width: '100%', borderRadius: '8px', aspectRatio: '16/9' }} />
        <h1 style={{ marginTop: '1rem', fontSize: '1.5rem' }}>{video.title}</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {video.views} vistas • Publicado por {video.user_name}
        </p>
        <p style={{ padding: '1rem', background: '#f8fafc', borderRadius: '6px', marginBottom: '2rem' }}>
          {video.description}
        </p>

        <section>
          <h3>Comentarios ({comments.length})</h3>
          {user ? (
            <form onSubmit={handleCommentSubmit} style={{ marginTop: '1rem' }}>
              <textarea
                placeholder="Anade un comentario..."
                rows="3"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
              />
              <button type="submit" style={{ alignSelf: 'flex-start' }}>Comentar</button>
            </form>
          ) : (
            <p style={{ marginTop: '0.5rem', color: '#64748b' }}>Inicia sesion para comentar.</p>
          )}

          <section style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {comments.map((c) => (
              <article key={c.id} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <strong>{c.user_name}</strong>
                <p style={{ fontSize: '0.95rem' }}>{c.content}</p>
              </article>
            ))}
          </section>
        </section>
      </section>

      <aside>
        <h3 style={{ marginBottom: '1rem' }}>Siguientes videos</h3>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {recommended.map((vid) => (
            <VideoCard key={vid.id} video={vid} />
          ))}
        </section>
      </aside>
    </main>
  );
}