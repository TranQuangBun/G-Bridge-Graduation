import React from "react";
import { AppRouter } from "./routers";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary, ToastProvider, AlertProvider } from "./components";
import "./App.css";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AlertProvider>
            <div className="App">
              <AppRouter />
            </div>
          </AlertProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
