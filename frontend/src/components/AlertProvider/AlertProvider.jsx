import React, { useState, useEffect } from "react";
import Alert from "../Alert";
import alertService from "../../services/alertService";

const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const unsubscribe = alertService.subscribe(setAlert);
    return unsubscribe;
  }, []);

  return (
    <>
      {children}
      {alert && (
        <Alert
          isOpen={alert.isOpen}
          onClose={alert.onClose}
          title={alert.title}
          message={alert.message}
          type={alert.type}
          confirmText={alert.confirmText}
          cancelText={alert.cancelText}
          showCancel={alert.showCancel}
          onConfirm={alert.onConfirm}
          onCancel={alert.onCancel}
        />
      )}
    </>
  );
};

export default AlertProvider;

