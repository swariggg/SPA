import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const PlayerPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const videoData = await apiFetch(`/videos/${id}`);
        setVideo(videoData);
        const commentsData = await apiFetch(`/videos/${id}/comments/`);
        setComments(commentsData);
      } catch (err) {
        setError('Error al cargar la información del video.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      const addedComment = await apiFetch(`/videos/${id}/comments/?user_id=${user.id}`, {
        method: 'POST',
        body: JSON.stringify({ text: newComment }),
      });
      setComments([...comments, addedComment]);
      setNewComment('');
    } catch (err) {
      alert('Error al publicar el comentario');
    }
  };

  if (loading) return <div className="loading">Cargando reproductor...</div>;
  if (error || !video) return <div className="page-container"><p>{error || 'Video no encontrado'}</p></div>;

  return (
    <div className="page-container player-layout">
      <div className="video-section">
        <div className="player-wrapper">
          <video src={video.video_url} controls autoPlay className="video-player" />
        </div>
        <h1 className="video-title-large">{video.title}</h1>
        <div className="author-info">
          <span>Publicado por: </span>
          <Link to={`/profile/${video.user_id}`} className="author-name">
            {video.owner?.username || `Usuario #${video.user_id}`}
          </Link>
        </div>
        <p className="video-description">{video.description || 'Sin descripción.'}</p>
      </div>

      <div className="comments-section">
        <h2>Comentarios ({comments.length})</h2>
        {user ? (
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              placeholder="Escribe un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">Comentar</button>
          </form>
        ) : (
          <p className="login-prompt" style={{ margin: '1rem 0' }}>
            <Link to="/auth" style={{ color: '#e11d48', fontWeight: 'bold' }}>Inicia sesión</Link> para dejar un comentario.
          </p>
        )}

        <div className="comments-list">
          {comments.map((c) => (
            <div key={c.id} className="comment-item">
              <strong>{c.owner?.username || `Usuario #${c.user_id}`}</strong>
              <p>{c.text}</p>
              <small style={{ color: '#94a3b8' }}>{new Date(c.created_at).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};