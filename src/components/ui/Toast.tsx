import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

type ToastTone = "info" | "success" | "warning";

interface ToastItem {
  id: number;
  message: string;
  detail?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  notify: (message: string, options?: { detail?: string; tone?: ToastTone }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback<ToastContextValue["notify"]>(
    (message, options) => {
      const id = nextId.current;
      nextId.current += 1;
      const toast: ToastItem = {
        id,
        message,
        detail: options?.detail,
        tone: options?.tone ?? "info",
      };
      setToasts((current) => [...current.slice(-3), toast]);
      window.setTimeout(() => remove(id), 5000);
    },
    [remove],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div className={`toast toast--${toast.tone}`} key={toast.id}>
            <span className="toast__icon" aria-hidden="true">
              {toast.tone === "success" ? (
                <CheckCircle2 size={17} />
              ) : toast.tone === "warning" ? (
                <AlertTriangle size={17} />
              ) : (
                <Info size={17} />
              )}
            </span>
            <div className="toast__copy">
              <strong>{toast.message}</strong>
              {toast.detail ? <span>{toast.detail}</span> : null}
            </div>
            <button type="button" className="toast__close" onClick={() => remove(toast.id)} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
