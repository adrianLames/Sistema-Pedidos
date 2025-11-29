import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import './AccessibilitySettings.css';

const AccessibilitySettings = () => {
  const { fontSize, darkMode, toggleDarkMode, changeFontSize } = useAccessibility();

  return (
    <div className="accessibility-settings">
      <div className="setting-group">
        <label className="setting-label">
          <span className="setting-icon">🔤</span>
          Tamaño de Fuente
        </label>
        <div className="font-size-options">
          <button
            className={`font-size-btn ${fontSize === 'small' ? 'active' : ''}`}
            onClick={() => changeFontSize('small')}
            aria-label="Fuente pequeña"
          >
            A
          </button>
          <button
            className={`font-size-btn ${fontSize === 'medium' ? 'active' : ''}`}
            onClick={() => changeFontSize('medium')}
            aria-label="Fuente mediana"
          >
            A
          </button>
          <button
            className={`font-size-btn ${fontSize === 'large' ? 'active' : ''}`}
            onClick={() => changeFontSize('large')}
            aria-label="Fuente grande"
          >
            A
          </button>
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          <span className="setting-icon">🌓</span>
          Modo Oscuro
        </label>
        <button
          className={`theme-toggle ${darkMode ? 'active' : ''}`}
          onClick={toggleDarkMode}
          aria-label={darkMode ? 'Desactivar modo oscuro' : 'Activar modo oscuro'}
        >
          <span className="toggle-slider"></span>
          <span className="toggle-text">{darkMode ? 'Activado' : 'Desactivado'}</span>
        </button>
      </div>
    </div>
  );
};

export default AccessibilitySettings;
