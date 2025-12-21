import React from "react";
import { ROUTES } from "../../constants";
import { LanguageContext } from "../../translet/LanguageContext";
import "./ErrorBoundary.css";

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = ROUTES.HOME;
  };

  render() {
    if (this.state.hasError) {
      const { t } = this.props;
      // You can render any custom fallback UI
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-boundary-illustration">
              <h1 className="error-boundary-code">Oops!</h1>
              <div className="error-boundary-icon">💥</div>
            </div>
            <h2 className="error-boundary-title">{t("errors.boundary.title")}</h2>
            <p className="error-boundary-description">
              {t("errors.boundary.description")}
            </p>
            <div className="error-boundary-actions">
              <button
                onClick={this.handleReset}
                className="error-boundary-button error-boundary-button-primary"
              >
                {t("errors.boundary.home")}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="error-boundary-button error-boundary-button-secondary"
              >
                {t("errors.boundary.reload")}
              </button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="error-boundary-details">
                <summary>{t("errors.boundary.details")}</summary>
                <div className="error-boundary-stack">
                  <h3>{t("errors.boundary.error")}</h3>
                  <pre>{this.state.error.toString()}</pre>
                  {this.state.errorInfo && (
                    <>
                      <h3>{t("errors.boundary.componentStack")}</h3>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to inject translation context
const ErrorBoundary = ({ children }) => {
  return (
    <LanguageContext.Consumer>
      {({ t }) => <ErrorBoundaryClass t={t}>{children}</ErrorBoundaryClass>}
    </LanguageContext.Consumer>
  );
};

export default ErrorBoundary;

