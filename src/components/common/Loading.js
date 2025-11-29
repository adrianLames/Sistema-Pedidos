import React from 'react';

const Loading = ({ message = "Cargando..." }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default Loading;