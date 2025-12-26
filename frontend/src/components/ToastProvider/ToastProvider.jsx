import React, { useState, useEffect } from "react";
import { ToastContainer } from "../Toast";
import toastService from "../../services/toastService";

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toastService.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return (
    <>
      {children}
      <ToastContainer 
        toasts={toasts} 
        removeToast={(id) => toastService.removeToast(id)} 
      />
    </>
  );
};

export default ToastProvider;

