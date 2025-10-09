import React, { useState, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

let toastCount = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, body, delay = 5000 }) => {
    const id = toastCount++;
    const newToast = { id, title, body, show: true };
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after delay
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, show: false } : t))
      );
    }, delay);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
