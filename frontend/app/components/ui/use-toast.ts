"use client";

import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: "default" | "success" | "error";
  duration?: number;
}

type ToastOptions = Omit<Toast, "id">;

let id = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const newToast: Toast = {
      id: String(id++),
      ...options,
      duration: options.duration || 5000,
    };

    setToasts((currentToasts) => [...currentToasts, newToast]);

    if (newToast.duration) {
      setTimeout(() => {
        setToasts((currentToasts) =>
          currentToasts.filter((t) => t.id !== newToast.id)
        );
      }, newToast.duration);
    }

    return newToast.id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((currentToasts) => currentToasts.filter((t) => t.id !== id));
  }, []);

  return { toast, toasts, dismissToast };
}

export const toast = () => {
  // This is a dummy function that will be replaced by the actual implementation
  // when the useToast hook is used in a component
  console.warn("Toast function called outside of a component");
};
