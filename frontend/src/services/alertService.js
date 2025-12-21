/**
 * Custom Alert Service
 * Replaces native alert() with custom Alert component
 */

class AlertService {
  constructor() {
    this.listeners = [];
    this.currentAlert = null;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.currentAlert));
  }

  show({ 
    title, 
    message, 
    type = "info",
    confirmText = "OK",
    cancelText = "Cancel",
    showCancel = false,
    onConfirm,
    onCancel
  }) {
    return new Promise((resolve) => {
      this.currentAlert = {
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        showCancel,
        onConfirm: () => {
          if (onConfirm) onConfirm();
          resolve(true);
          this.close();
        },
        onCancel: () => {
          if (onCancel) onCancel();
          resolve(false);
          this.close();
        },
        onClose: () => {
          resolve(false);
          this.close();
        }
      };
      this.notify();
    });
  }

  close() {
    this.currentAlert = null;
    this.notify();
  }

  // Convenience methods
  info(message, title = "Information") {
    return this.show({ title, message, type: "info" });
  }

  success(message, title = "Success") {
    return this.show({ title, message, type: "success" });
  }

  warning(message, title = "Warning") {
    return this.show({ title, message, type: "warning" });
  }

  error(message, title = "Error") {
    return this.show({ title, message, type: "error" });
  }

  confirm(message, title = "Confirm") {
    return this.show({ 
      title, 
      message, 
      type: "warning",
      showCancel: true,
      confirmText: "Confirm",
      cancelText: "Cancel"
    });
  }
}

// Create singleton instance
const alertService = new AlertService();

export default alertService;

