/**
 * Custom Toast Service
 * Replaces react-toastify with custom implementation
 */

class ToastService {
  constructor() {
    this.listeners = [];
    this.toasts = [];
    this.toastId = 0;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  addToast(message, type = "success", duration = 5000) {
    const id = this.toastId++;
    const toast = { id, message, type, duration };
    
    this.toasts.push(toast);
    this.notify();

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }

    return id;
  }

  removeToast(id) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  success(message, duration = 5000) {
    return this.addToast(message, "success", duration);
  }

  error(message, duration = 5000) {
    return this.addToast(message, "error", duration);
  }

  warning(message, duration = 5000) {
    return this.addToast(message, "warning", duration);
  }

  info(message, duration = 5000) {
    return this.addToast(message, "info", duration);
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

// Create singleton instance
const toastService = new ToastService();

export default toastService;

