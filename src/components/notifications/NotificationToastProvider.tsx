'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useNotificationToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useNotificationToast must be used within a NotificationToastProvider');
  }
  return ctx;
};

export const NotificationToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toastInput: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const duration = toastInput.duration || 5000;
    const newToast: ToastItem = { ...toastInput, id };

    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 toasts

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Floating Toast Portal Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-top-5 fade-in ${
              toast.type === 'SUCCESS'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-700/50'
                : toast.type === 'WARNING'
                ? 'bg-amber-950 text-amber-100 border-amber-700/50'
                : toast.type === 'ERROR'
                ? 'bg-rose-950 text-rose-100 border-rose-700/50'
                : 'bg-slate-900 text-slate-100 border-slate-700/50'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'SUCCESS' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : toast.type === 'WARNING' ? (
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              ) : toast.type === 'ERROR' ? (
                <XCircle className="h-5 w-5 text-rose-400" />
              ) : (
                <Info className="h-5 w-5 text-sky-400" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              <h4 className="text-xs font-black tracking-tight">{toast.title}</h4>
              <p className="text-[11px] opacity-90 line-clamp-2 leading-relaxed">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
