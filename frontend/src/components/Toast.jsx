import { useState, useEffect, useCallback, useMemo, createContext, useContext } from "react";
import { colors } from "../styles/theme";

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: "\u2713",
  error: "\u2717",
  warning: "\u26A0",
  info: "\u2139",
};

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const bg = toast.type === "success" ? colors.successSoft
    : toast.type === "error" ? colors.dangerSoft
    : toast.type === "warning" ? colors.warningSoft
    : colors.accentSoft;

  const fg = toast.type === "success" ? colors.success
    : toast.type === "error" ? colors.danger
    : toast.type === "warning" ? colors.warning
    : colors.accent;

  return (
    <div style={{
      background: colors.surface, border: `1px solid ${fg}`, borderLeft: `4px solid ${fg}`,
      borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)", minWidth: 300, maxWidth: 420,
      transform: visible ? "translateX(0)" : "translateX(120%)",
      opacity: visible ? 1 : 0, transition: "all 0.3s ease",
    }}>
      <span style={{ fontSize: 16, color: fg, flexShrink: 0 }}>{ICONS[toast.type] || ICONS.info}</span>
      <div style={{ flex: 1 }}>
        {toast.title && <div style={{ fontWeight: 600, fontSize: 13, color: colors.text, marginBottom: 2 }}>{toast.title}</div>}
        <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.4 }}>{toast.message}</div>
      </div>
      <button onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 14, padding: 4 }}>
        \u2715
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, title, duration) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, type, message, title, duration }]);
  }, []);

  const toast = useMemo(() => ({
    success: (msg, title) => addToast("success", msg, title),
    error: (msg, title) => addToast("error", msg, title || "Erreur"),
    warning: (msg, title) => addToast("warning", msg, title),
    info: (msg, title) => addToast("info", msg, title),
  }), [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map((t) => <ToastItem key={t.id} toast={t} onRemove={removeToast} />)}
      </div>
    </ToastContext.Provider>
  );
}
