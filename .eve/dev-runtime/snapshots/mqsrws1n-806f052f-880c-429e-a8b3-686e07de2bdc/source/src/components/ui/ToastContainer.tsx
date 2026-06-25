'use client';

import { useAppStore } from '@/store/app-store';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: 'text-success border-success/20',
  error: 'text-danger border-danger/20',
  info: 'text-accent border-accent/20',
  warning: 'text-warning border-warning/20',
};

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`toast flex items-start gap-3 min-w-[320px] border ${colorMap[toast.type]}`}
          >
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
            <p className="flex-1 text-text-primary text-sm">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-tertiary hover:text-text-secondary transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
