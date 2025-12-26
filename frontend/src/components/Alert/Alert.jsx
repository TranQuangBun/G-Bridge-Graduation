import React from "react";
import "./Alert.css";

const Alert = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="alert-overlay" onClick={handleBackdropClick}>
      <div className={`alert-modal alert-modal--${type}`}>
        <div className="alert-header">
          <h3 className="alert-title">{title}</h3>
          <button 
            className="alert-close" 
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="alert-body">
          <p className="alert-message">{message}</p>
        </div>
        <div className="alert-footer">
          {showCancel && (
            <button 
              className="alert-button alert-button--cancel"
              onClick={handleCancel}
            >
              {cancelText}
            </button>
          )}
          <button 
            className="alert-button alert-button--confirm"
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alert;

