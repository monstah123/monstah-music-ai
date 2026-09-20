'use client';
import { useState, useEffect, useCallback } from 'react';

let toastIdCounter = 0;

// Global toast emitter — call these from anywhere
let _addToast = null;

export const toast = {
  success: (message, duration = 3000) => _addToast?.({ type: 'success', message, duration }),
  error:   (message, duration = 4000) => _addToast?.({ type: 'error',   message, duration }),
  info:    (message, duration = 3000) => _addToast?.({ type: 'info',    message, duration }),
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type, message, duration }) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // Register the global handler
  useEffect(() => {
    _addToast = addToast;
    return () => { _addToast = null; };
  }, [addToast]);

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{icons[t.type]}</span>
          <span className="toast-msg">{t.message}</span>
          <button
            className="toast-close"
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          >
            ✕
          </button>
        </div>
      ))}

      <style jsx>{`
        .toast-container {
          position: fixed;
          bottom: calc(var(--player-height, 90px) + 20px);
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }

        .toast {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 14px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          pointer-events: all;
          animation: toastIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          max-width: 340px;
        }

        .toast-success {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.4);
          color: #6ee7b7;
        }

        .toast-error {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.4);
          color: #fca5a5;
        }

        .toast-info {
          background: rgba(124, 58, 237, 0.15);
          border-color: rgba(124, 58, 237, 0.4);
          color: #c4b5fd;
        }

        .toast-icon {
          font-size: 15px;
          flex-shrink: 0;
        }

        .toast-msg {
          flex: 1;
          line-height: 1.4;
        }

        .toast-close {
          font-size: 11px;
          color: inherit;
          opacity: 0.6;
          flex-shrink: 0;
          transition: opacity 0.15s ease;
        }

        .toast-close:hover {
          opacity: 1;
        }

        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateX(40px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @media (max-width: 768px) {
          .toast-container {
            bottom: calc(var(--mobile-nav-height, 64px) + var(--player-height, 90px) + 12px);
            right: 12px;
            left: 12px;
          }
          .toast {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
