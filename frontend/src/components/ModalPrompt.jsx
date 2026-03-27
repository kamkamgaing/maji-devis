import { useState, useEffect, useRef } from "react";
import { s, colors } from "../styles/theme";
import { iaApi } from "../services/api";
import Spinner from "./Spinner";

export default function ModalPrompt({ catalogueId, onFermer }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onFermer(); };
    document.addEventListener("keydown", handler);
    closeRef.current?.focus();
    return () => document.removeEventListener("keydown", handler);
  }, [onFermer]);

  useEffect(() => {
    iaApi.getPrompt(catalogueId).then(setData).catch(() => {
      setData({ prompt: "Erreur lors du chargement du prompt.", model: "N/A", provider: "N/A" });
    }).finally(() => setLoading(false));
  }, [catalogueId]);

  const testerPrompt = async () => {
    setTestLoading(true);
    try {
      const res = await iaApi.checkAnomalie(catalogueId, 0);
      setTestResult(res);
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onFermer} role="dialog" aria-modal="true">
      <div style={{ ...s.modal, width: 700 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Intégration IA — Prompt réel</div>
          <button ref={closeRef} onClick={onFermer}
            style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: 20, textAlign: "center" }}><Spinner size={22} label="Chargement..." /></div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 11, background: colors.accentSoft, color: colors.accent, padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>
                {data.provider}
              </span>
              <span style={{ fontSize: 11, background: colors.successSoft, color: colors.success, padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>
                {data.model}
              </span>
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: colors.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Prompt envoyé au LLM
            </div>
            <pre style={{
              background: colors.bg, padding: 14, borderRadius: 8, fontSize: 11, lineHeight: 1.6,
              whiteSpace: "pre-wrap", border: `1px solid ${colors.border}`, marginBottom: 16,
              color: colors.textSecondary, maxHeight: 250, overflow: "auto",
            }}>
              {data.prompt}
            </pre>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.success, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Réponse du LLM
              </div>
              <button style={{ ...s.btn("primary"), fontSize: 11, padding: "4px 12px" }}
                onClick={testerPrompt} disabled={testLoading}>
                {testLoading ? <Spinner size={12} color="#fff" /> : "Tester en direct"}
              </button>
            </div>

            {testResult ? (
              <pre style={{
                background: colors.bg, padding: 14, borderRadius: 8, fontSize: 11, lineHeight: 1.6,
                whiteSpace: "pre-wrap", border: `1px solid ${testResult.error ? colors.danger : colors.success}`,
                color: testResult.error ? colors.danger : colors.success,
              }}>
                {testResult.error
                  ? `Erreur: ${testResult.error}`
                  : JSON.stringify({
                      anomalie: testResult.status,
                      confiance: testResult.confiance,
                      message: testResult.message,
                      prix_recommande: testResult.prix_recommande,
                      fournisseur_recommande: testResult.fournisseur_recommande,
                      source: testResult.source,
                      model: testResult.model,
                      response_time_ms: testResult.response_time_ms,
                    }, null, 2)}
              </pre>
            ) : (
              <div style={{
                background: colors.bg, padding: 20, borderRadius: 8, border: `1px dashed ${colors.border}`,
                textAlign: "center", color: colors.textMuted, fontSize: 12,
              }}>
                Cliquez sur « Tester en direct » pour envoyer le prompt au LLM et voir la réponse brute
              </div>
            )}

            <div style={{ marginTop: 16, padding: 14, borderRadius: 8, background: colors.accentSoft, fontSize: 12, color: colors.text }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Comment fonctionne l'intégration IA :</div>
              <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, color: colors.textSecondary }}>
                <li>Le backend construit un prompt avec l'historique des prix et les prix fournisseurs actuels</li>
                <li>Le prompt est envoyé au modèle <strong>Mistral-7B-Instruct</strong> via l'API HuggingFace</li>
                <li>Le LLM analyse le prix et renvoie un JSON structuré (anomalie, confiance, justification)</li>
                <li>Le backend parse la réponse et l'affiche au deviseur avec le niveau de confiance</li>
              </ol>
            </div>
          </>
        )}
        <button style={{ ...s.btn("primary"), marginTop: 16 }} onClick={onFermer}>Fermer</button>
      </div>
    </div>
  );
}
