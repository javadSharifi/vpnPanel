import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
