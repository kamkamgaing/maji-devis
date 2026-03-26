import { useEffect, useRef } from "react";
import { s, colors } from "../styles/theme";

export default function ConfirmDialog({ title, message, confirmLabel = "Confirmer", cancelLabel = "Annuler", variant = "danger", onConfirm, onCancel }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    confirmRef.current?.focus();
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div style={s.overlay} onClick={onCancel}>
      <div style={{ ...s.modal, width: 400, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>
          {variant === "danger" ? "\u26A0\uFE0F" : "\u2753"}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 24, lineHeight: 1.5 }}>{message}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button style={s.btn("ghost")} onClick={onCancel}>{cancelLabel}</button>
          <button ref={confirmRef} style={s.btn(variant)} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
