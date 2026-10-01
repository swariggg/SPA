import { useEffect, useState, useContext } from 'react';
import { api } from '../api/client';
import { AuthContext } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useContext(AuthContext);
  const [myVideos, setMyVideos] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [editingVideo, setEditingVideo] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '' });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);

  const loadMyVideos = () => {
    api.getVideos().then((vids) => setMyVideos(vids.filter((v) => v.user_id === user.id)));
  };

  useEffect(() => {
    if (user) loadMyVideos();
  }, [user]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoFile || !thumbFile) return alert('Debes adjuntar el video y la miniatura.');

    setPublishing(true);
    const body = new FormData();
    body.append('title', formData.title);
    body.append('description', formData.description);
    body.append('user_id', user.id);
    body.append('video_file', videoFile);
    body.append('thumbnail_file', thumbFile);

    try {
      await api.createVideo(body);
      setFormData({ title: '', description: '' });
      setVideoFile(null);
      setThumbFile(null);
      loadMyVideos();
    } catch (err) {
      alert(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleStartEdit = (vid) => {
    setEditingVideo(vid.id);
    setEditFormData({ title: vid.title, description: vid.description });
  };

  const handleSaveEdit = async (id) => {
    try {
      await api.updateVideo(id, editFormData);
      setEditingVideo(null);
      loadMyVideos();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Deseas eliminar este video?')) {
      await api.deleteVideo(id);
      loadMyVideos();
    }
  };

  if (!user) return <main><p>Acceso denegado. Inicia sesion.</p></main>;

  return (
    <main>
      <header style={{ height: 'auto', border: 'none', padding: 0, marginBottom: '2rem' }}>
        <h2>Perfil de {user.name}</h2>
        <p style={{ color: '#64748b' }}>Videos publicados: {myVideos.length}</p>
      </header>

      <section style={{ border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '8px', marginBottom: '3rem' }}>
        <h3>Subir nuevo video</h3>
        <form onSubmit={handleUpload} style={{ marginTop: '1rem' }}>
          <input
            type="text"
            placeholder="Titulo del video"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <textarea
            placeholder="Descripcion"
            rows="3"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <label>Video (.mp4):
            <input type="file" accept="video/mp4" required onChange={(e) => setVideoFile(e.target.files[0])} />
          </label>
          <label>Miniatura (.jpg, .png):
            <input type="file" accept="image/*" required onChange={(e) => setThumbFile(e.target.files[0])} />
          </label>
          <button type="submit" disabled={publishing}>
            {publishing ? 'Subiendo a S3...' : 'Publicar Video'}
          </button>
        </form>
      </section>

      <section>
        <h3>Mis Videos</h3>
        <section style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {myVideos.map((vid) => (
            <article key={vid.id} style={{ border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '6px' }}>
              {editingVideo === vid.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  />
                  <textarea
                    rows="2"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleSaveEdit(vid.id)}>Guardar</button>
                    <button onClick={() => setEditingVideo(null)} style={{ background: '#64748b' }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4>{vid.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{vid.views} reproducciones</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleStartEdit(vid)}>Editar</button>
                    <button onClick={() => handleDelete(vid.id)} className="btn-danger">Eliminar</button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}