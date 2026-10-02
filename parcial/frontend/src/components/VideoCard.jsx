import React from 'react';
import { Link } from 'react-router-dom';

export const VideoCard = ({ video }) => {
  const defaultThumbnail = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop";

  return (
    <div className="video-card">
      <Link to={`/video/${video.id}`}>
        <div className="thumbnail-container">
          <img 
            src={video.thumbnail_url || defaultThumbnail} 
            alt={video.title} 
            onError={(e) => { e.target.src = defaultThumbnail; }}
          />
        </div>
      </Link>
      <div className="video-info">
        <h3 className="video-title">
          <Link to={`/video/${video.id}`}>{video.title}</Link>
        </h3>
        <p className="video-author">
          Subido por: <Link to={`/profile/${video.user_id}`}>{video.owner?.username || `Usuario #${video.user_id}`}</Link>
        </p>
      </div>
    </div>
  );
};