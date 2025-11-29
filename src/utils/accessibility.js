import { useEffect } from 'react';

/**
 * Hook personalizado para gestionar características de accesibilidad
 * según el estándar WCAG 2.1 AA/AAA
 */
export const useAccessibility = () => {
  useEffect(() => {
    // Detectar preferencias de usuario
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    // Aplicar clases según preferencias
    if (prefersReducedMotion) {
      document.body.classList.add('reduce-motion');
    }
    if (prefersDarkMode) {
      document.body.classList.add('dark-mode');
    }
    if (prefersHighContrast) {
      document.body.classList.add('high-contrast');
    }

    // Limpiar al desmontar
    return () => {
      document.body.classList.remove('reduce-motion', 'dark-mode', 'high-contrast');
    };
  }, []);
};

/**
 * Anuncia mensajes a lectores de pantalla usando ARIA live regions
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remover después de 1 segundo
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Captura el foco en un elemento o contenedor
 * Útil para modales y diálogos
 */
export const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  
  // Retornar función para remover listener
  return () => element.removeEventListener('keydown', handleTabKey);
};

/**
 * Restaura el foco al elemento que lo tenía antes
 */
export const useFocusReturn = () => {
  const previousFocus = document.activeElement;
  
  return () => {
    if (previousFocus && previousFocus.focus) {
      previousFocus.focus();
    }
  };
};

/**
 * Genera un ID único para asociar labels con inputs
 */
let idCounter = 0;
export const useUniqueId = (prefix = 'id') => {
  const id = `${prefix}-${++idCounter}`;
  return id;
};

/**
 * Valida el contraste de color según WCAG
 * Retorna true si cumple con AA (4.5:1)
 */
export const validateColorContrast = (foreground, background) => {
  const getLuminance = (rgb) => {
    const [r, g, b] = rgb.map(val => {
      const v = val / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return {
    ratio: contrast,
    AA: contrast >= 4.5,
    AAA: contrast >= 7,
    AALarge: contrast >= 3,
    AAALarge: contrast >= 4.5
  };
};

/**
 * Maneja la navegación por teclado
 */
export const handleKeyboardNavigation = (onEscape, onEnter) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && onEscape) {
      onEscape(e);
    }
    if (e.key === 'Enter' && onEnter) {
      onEnter(e);
    }
  };
  
  return handleKeyDown;
};

/**
 * Hook para navegación por teclado
 */
export const useKeyboardNavigation = (onEscape, onEnter) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape(e);
      }
      if (e.key === 'Enter' && onEnter) {
        onEnter(e);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onEnter]);
};

/**
 * Detecta si el usuario está usando teclado para navegación
 */
export const useKeyboardUser = () => {
  useEffect(() => {
    const handleFirstTab = (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-user');
        window.removeEventListener('keydown', handleFirstTab);
        window.addEventListener('mousedown', handleMouseDownOnce);
      }
    };
    
    const handleMouseDownOnce = () => {
      document.body.classList.remove('keyboard-user');
      window.removeEventListener('mousedown', handleMouseDownOnce);
      window.addEventListener('keydown', handleFirstTab);
    };
    
    window.addEventListener('keydown', handleFirstTab);
    return () => {
      window.removeEventListener('keydown', handleFirstTab);
      window.removeEventListener('mousedown', handleMouseDownOnce);
    };
  }, []);
};

/**
 * Maneja skip links para navegación rápida
 */
export const createSkipLink = (targetId, text) => {
  return {
    href: `#${targetId}`,
    text: text,
    className: 'skip-link',
    onClick: (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };
};

/**
 * Formatea mensajes de error para accesibilidad
 */
export const formatErrorMessage = (fieldName, errorType) => {
  const messages = {
    required: `El campo ${fieldName} es obligatorio`,
    email: `El ${fieldName} debe ser una dirección de correo válida`,
    minLength: `El ${fieldName} debe tener al menos el número mínimo de caracteres`,
    maxLength: `El ${fieldName} excede el número máximo de caracteres`,
    pattern: `El formato del ${fieldName} no es válido`,
    min: `El valor de ${fieldName} es menor al mínimo permitido`,
    max: `El valor de ${fieldName} es mayor al máximo permitido`
  };
  
  return messages[errorType] || `Error en el campo ${fieldName}`;
};

/**
 * Gestiona el título de la página para navegación
 */
export const usePageTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} - Sistema de Pedidos`;
    
    // Anunciar cambio de página
    announceToScreenReader(`Navegaste a ${title}`, 'polite');
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

/**
 * Verifica si un elemento es visible en el viewport
 */
export const useIntersectionObserver = (elementRef, callback, options = {}) => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry);
        }
      });
    }, {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || '0px'
    });
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [elementRef, callback, options]);
};

export default {
  useAccessibility,
  announceToScreenReader,
  trapFocus,
  useFocusReturn,
  useUniqueId,
  validateColorContrast,
  useKeyboardNavigation,
  useKeyboardUser,
  createSkipLink,
  formatErrorMessage,
  usePageTitle,
  useIntersectionObserver
};
