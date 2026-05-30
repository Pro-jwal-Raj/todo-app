import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

let toastId = 0;
let listeners = [];

export function showToast(message, type = "info", duration = 3000, action = null) {
  const id = ++toastId;
  const toast = { id, message, type, duration, action };
  listeners.forEach((fn) => fn(toast));
  return id;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (toast) => {
      setToasts((prev) => [...prev, toast]);
      if (toast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, toast.duration);
      }
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <span>{toast.message}</span>
            <div className="toast-actions">
              {toast.action && (
                <button
                  className="toast-action-btn"
                  onClick={() => {
                    toast.action.onClick();
                    dismiss(toast.id);
                  }}
                >
                  {toast.action.label}
                </button>
              )}
              <button className="toast-dismiss" onClick={() => dismiss(toast.id)}>
                <FiX />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
