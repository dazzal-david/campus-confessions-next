"use client";

import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from "react";

type ToastContextType = {
  toast: (msg: string) => void;
};

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  const toast = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setVisible(false), 2400);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className={`fixed bottom-20 left-1/2 -translate-x-1/2 gradient-bg text-white px-6 py-2.5 rounded-xl text-sm font-semibold z-[200] shadow-lg transition-all duration-250 ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-20 pointer-events-none"
        }`}
      >
        {message}
      </div>
    </ToastContext.Provider>
  );
}
