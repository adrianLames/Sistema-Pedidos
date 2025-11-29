import React from 'react';
import './AccessibleComponents.css';

/**
 * Botón accesible con soporte completo WCAG
 */
export const AccessibleButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  type = 'button',
  className = '',
  icon,
  loading = false,
  ...props 
}) => {
  return (
    <button
      type={type}
      className={`accessible-btn accessible-btn-${variant} ${className} ${loading ? 'loading' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      {...props}
    >
      {icon && <span className="btn-icon" aria-hidden="true">{icon}</span>}
      <span className="btn-text">{children}</span>
      {loading && (
        <span className="btn-spinner" role="status" aria-label="Cargando">
          <span className="sr-only">Cargando...</span>
        </span>
      )}
    </button>
  );
};

// PropTypes removidos - no están instalados en este proyecto

/**
 * Input accesible con label y mensajes de error
 */
export const AccessibleInput = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder,
  helpText,
  autoComplete,
  className = '',
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helpId = helpText ? `${inputId}-help` : undefined;

  return (
    <div className={`accessible-input-group ${className}`}>
      <label htmlFor={inputId} className="accessible-label">
        {label}
        {required && <span className="required-indicator" aria-label="requerido"> *</span>}
      </label>
      
      {helpText && (
        <p id={helpId} className="help-text">
          {helpText}
        </p>
      )}
      
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
        aria-required={required}
        className={`accessible-input ${error ? 'has-error' : ''}`}
        {...props}
      />
      
      {error && (
        <p id={errorId} className="error-message" role="alert">
          <span aria-hidden="true">⚠️</span> {error}
        </p>
      )}
    </div>
  );
};

// PropTypes removidos - no están instalados en este proyecto

/**
 * Modal accesible con trap de foco
 */
export const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  children,
  closeOnEscape = true,
  closeOnOverlay = true,
  className = ''
}) => {
  const modalRef = React.useRef(null);
  const previousFocus = React.useRef(null);

  React.useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement;
      
      // Trap focus
      const focusableElements = modalRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = 'unset';
        if (previousFocus.current && previousFocus.current.focus) {
          previousFocus.current.focus();
        }
      };
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="accessible-modal-overlay"
      onClick={closeOnOverlay ? onClose : undefined}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`accessible-modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Alert/Notification accesible
 */
export const AccessibleAlert = ({
  type = 'info',
  message,
  onClose,
  autoClose = false,
  duration = 5000,
  role = 'status'
}) => {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const icons = {
    success: '✓',
    error: '⚠️',
    warning: '⚡',
    info: 'ℹ️'
  };

  return (
    <div
      className={`accessible-alert accessible-alert-${type}`}
      role={type === 'error' ? 'alert' : role}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <span className="alert-icon" aria-hidden="true">{icons[type]}</span>
      <span className="alert-message">{message}</span>
      {onClose && (
        <button
          className="alert-close"
          onClick={onClose}
          aria-label="Cerrar alerta"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      )}
    </div>
  );
};

/**
 * SkipLink para navegación rápida
 */
export const SkipLink = ({ targetId, children = 'Saltar al contenido principal' }) => {
  const handleClick = (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a href={`#${targetId}`} className="skip-link" onClick={handleClick}>
      {children}
    </a>
  );
};

/**
 * Loading spinner accesible
 */
export const AccessibleSpinner = ({ 
  size = 'medium', 
  label = 'Cargando...',
  className = ''
}) => {
  return (
    <div 
      className={`accessible-spinner spinner-${size} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="spinner-circle" aria-hidden="true"></div>
      <span className="sr-only">{label}</span>
    </div>
  );
};

/**
 * Breadcrumb accesible
 */
export const AccessibleBreadcrumb = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="accessible-breadcrumb">
        {items.map((item, index) => (
          <li 
            key={index}
            className="breadcrumb-item"
            aria-current={index === items.length - 1 ? 'page' : undefined}
          >
            {index === items.length - 1 ? (
              <span>{item.label}</span>
            ) : (
              <a href={item.href}>{item.label}</a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default {
  AccessibleButton,
  AccessibleInput,
  AccessibleModal,
  AccessibleAlert,
  SkipLink,
  AccessibleSpinner,
  AccessibleBreadcrumb
};
