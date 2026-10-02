import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { VideoCard } from '../components/VideoCard';

export const ProfilePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [userVideos, setUserVideos] = useState([]);
  const [newVideo, setNewVideo] = useState({ title: '', description: '', video_url: '' });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user && user.id === parseInt(id);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const uData = await apiFetch(`/users/${id}`);
        setProfileUser(uData);
        const vData = await apiFetch(`/videos/?user_id=${id}`);
        setUserVideos(vData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleCreateVideo = async (e) => {
    e.preventDefault();
    try {
      const created = await apiFetch('/videos/', {
        method: 'POST',
        body: JSON.stringify({ ...newVideo, user_id: user.id }),
      });
      setUserVideos([...userVideos, created]);
      setNewVideo({ title: '', description: '', video_url: '' });
      setShowModal(false);
    } catch (err) {
      alert('Error al publicar el video');
    }
  };

  if (loading) return <div className="loading">Cargando perfil...</div>;

  return (
    <div className="page-container">
      <div className="profile-header">
        <div className="avatar">{profileUser?.username?.[0]?.toUpperCase() || 'U'}</div>
        <div>
          <h1>{profileUser?.username}</h1>
          <p>{profileUser?.email}</p>
        </div>
        {isOwnProfile && (
          <button onClick={() => setShowModal(true)} className="btn-primary upload-btn">
            + Subir Nuevo Video
          </button>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Subir Nuevo Video</h2>
            <form onSubmit={handleCreateVideo}>
              <div className="form-group">
                <label>Título del Video</label>
                <input
                  type="text"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>URL del Video (Enlace de S3 o MP4)</label>
                <input
                  type="url"
                  value={newVideo.video_url}
                  onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={newVideo.description}
                  onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Publicar</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h2>Videos Publicados</h2>
      {userVideos.length === 0 ? (
        <p style={{ marginTop: '1rem' }}>Este usuario aún no ha publicado videos.</p>
      ) : (
        <div className="video-grid">
          {userVideos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
};