/**
 * Sistema de notificaciones Toast
 * Muestra mensajes flotantes para feedback del usuario
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number; // ms
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export class Toast {
  private static container: HTMLElement;

  /**
   * Inicializa el contenedor de toasts
   */
  static initialize(): void {
    if (Toast.container) return;

    Toast.container = document.createElement('div');
    Toast.container.className = 'toast-container';
    document.body.appendChild(Toast.container);
  }

  /**
   * Muestra un toast
   */
  static show(
    message: string,
    type: ToastType = 'info',
    options: ToastOptions = {}
  ): void {
    Toast.initialize();

    const duration = options.duration ?? 3000;
    const position = options.position ?? 'top-right';

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-${position}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    // Iconos según tipo
    const icons: Record<ToastType, string> = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Cerrar notificación">×</button>
    `;

    Toast.container.appendChild(toast);

    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn?.addEventListener('click', () => {
      toast.remove();
    });

    // Auto-close
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }

  static success(msg: string, options?: ToastOptions): void {
    Toast.show(msg, 'success', options);
  }

  static error(msg: string, options?: ToastOptions): void {
    Toast.show(msg, 'error', { ...options, duration: 5000 });
  }

  static info(msg: string, options?: ToastOptions): void {
    Toast.show(msg, 'info', options);
  }

  static warning(msg: string, options?: ToastOptions): void {
    Toast.show(msg, 'warning', { ...options, duration: 4000 });
  }
}
