import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { VideoCard } from '../components/VideoCard';

const API_URL = "http://18.118.162.39:8000";

export const ProfilePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [userVideos, setUserVideos] = useState([]);
  
  // Campos del formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user && user.id === parseInt(id);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const uRes = await fetch(`${API_URL}/users/${id}`);
        const uData = await uRes.json();
        setProfileUser(uData);

        const vRes = await fetch(`${API_URL}/videos/?user_id=${id}`);
        const vData = await vRes.json();
        setUserVideos(vData);
      } catch (err) {
        console.error("Error al cargar perfil:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleCreateVideo = async (e) => {
    e.preventDefault();

    if (!videoFile || !thumbnailFile) {
      alert("Debes seleccionar tanto un video (.mp4) como una miniatura (.jpg/.png).");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("user_id", user.id);
      formData.append("video_file", videoFile);
      formData.append("thumbnail_file", thumbnailFile);

      const res = await fetch(`${API_URL}/videos/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al subir el contenido.");
      }

      const createdVideo = await res.json();
      setUserVideos([...userVideos, createdVideo]);

      // Reset de campos
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setThumbnailFile(null);
      setShowModal(false);
      alert("¡Video e imagen subidos con éxito a AWS S3!");
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Archivo de Video (.mp4)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  required
                />
              </div>

              <div className="form-group">
                <label>Imagen de Portada / Miniatura</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files[0])}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary" disabled={uploading}>
                  {uploading ? "Subiendo a S3..." : "Publicar"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="btn-secondary"
                  disabled={uploading}
                >
                  Cancelar
                </button>
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