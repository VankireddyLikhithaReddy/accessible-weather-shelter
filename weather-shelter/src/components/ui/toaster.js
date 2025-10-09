import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export function Toaster({ toasts }) {
  const [visibleToasts, setVisibleToasts] = useState([]);

  useEffect(() => {
    if (toasts && toasts.length > 0) {
      setVisibleToasts(toasts);
      // Auto-hide each toast after 5 seconds
      toasts.forEach((toast) => {
        setTimeout(() => {
          setVisibleToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, 5000);
      });
    }
  }, [toasts]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="position-fixed top-0 end-0 p-3"
      style={{ zIndex: 1050 }}
    >
      {visibleToasts.map(({ id, title, description }) => (
        <div
          key={id}
          className="toast show"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {title && <div className="toast-header">{title}</div>}
          {description && <div className="toast-body">{description}</div>}
        </div>
      ))}
    </div>
  );
}
