import { useState, useEffect, useCallback } from "react";
import { api } from "../../../lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FiSliders, FiAlertTriangle, FiFileText, FiRefreshCw, FiKey, FiPlus, FiTrash2, FiCheck, FiCpu } from "react-icons/fi";

const C = {
  surface: "#FFFFFF", surface2: "#F8F6F0", border: "#E5DEC9",
  accent: "#B98A4B", cyan: "#0284c7", green: "#16a34a", red: "#dc2626",
  amber: "#d97706", text: "#181715", muted: "#746E65", gold: "#B98A4B",
  purple: "#6366f1",
};

const TIER_STYLE = {
  high:      { bg: "rgba(185,138,75,0.15)", color: "#B98A4B", label: "Pro / Deep" },
  standard:  { bg: "rgba(2,132,199,0.15)",  color: "#0284c7", label: "Flash / Fast" },
  legacy:    { bg: "rgba(116,110,101,0.15)", color: "#746E65", label: "Fallback" },
};

function ModelRow({ m, i, dragging, onDragStart, onDragOver, onDragEnd, onToggle, onDelete, showTier }) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(i)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(i); }}
      onDragEnd={onDragEnd}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
        borderRadius: 12, cursor: "grab",
        background: dragging === i ? "rgba(185,138,75,0.12)" : C.surface,
        border: `1px solid ${dragging === i ? C.accent : C.border}`,
        opacity: m.enabled ? 1 : 0.45, transition: "all 0.15s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
    >
      <span style={{ color: C.muted, fontSize: 11, minWidth: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>#{i + 1}</span>
      <span style={{ color: C.muted, fontSize: 14, cursor: "grab" }}>⠿</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.label}</div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.id}</div>
      </div>
      {showTier && m.tier && (() => {
        const ts = TIER_STYLE[m.tier] || TIER_STYLE.standard;
        return (
          <span style={{ padding: "3px 8px", borderRadius: 12, background: ts.bg, color: ts.color, fontSize: 9, fontWeight: 700, flexShrink: 0, textTransform: "uppercase", letterSpacing: 0.6 }}>
            {ts.label}
          </span>
        );
      })()}
      <button
        type="button"
        onClick={() => onToggle(m.id || m.label)}
        style={{
          padding: "4px 11px", borderRadius: 20, fontSize: 10, fontWeight: 800, cursor: "pointer", border: "none", flexShrink: 0,
          background: m.enabled ? "rgba(22,163,74,0.14)" : "rgba(220,38,38,0.14)",
          color: m.enabled ? C.green : C.red,
          transition: "all 0.15s",
        }}
      >
        {m.enabled ? "ACTIVE" : "OFF"}
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(m.id)}
          title="Remove Model"
          style={{
            background: "transparent", border: "none", color: C.muted, cursor: "pointer", padding: "4px 6px",
            borderRadius: 6, display: "flex", alignItems: "center", fontSize: 13,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.red)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
        >
          <FiTrash2 />
        </button>
      )}
    </div>
  );
}

export default function AIManager() {
  const [status, setStatus] = useState(null);
  const [aiStats, setAiStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [filterProvider, setFilterProvider] = useState("");
  const [filterSuccess, setFilterSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [testMsg, setTestMsg] = useState("What services does HAVI offer?");
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  // Providers active toggles
  const [providersActive, setProvidersActiveState] = useState({ primary: true, gemini: true, static: true });

  // Primary models queue
  const [primaryModels, setPrimaryModelsState] = useState([]);
  const [draggingPrimary, setDraggingPrimary] = useState(null);

  // Gemini queue
  const [geminiQueue, setGeminiQueue] = useState([]);
  const [draggingGem, setDraggingGem] = useState(null);

  // API Key management (strictly no base link exposed)
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [keySavedMsg, setKeySavedMsg] = useState(false);

  // Add Model dialog
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModelId, setNewModelId] = useState("");
  const [newModelLabel, setNewModelLabel] = useState("");
  const [newModelTier, setNewModelTier] = useState("standard");

  const [savingConfig, setSavingConfig] = useState(false);
  const [activeTab, setActiveTab] = useState("primary"); // "primary" | "gemini"

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a, l] = await Promise.all([
        api.techAiStatus(),
        api.techAiStats(168),
        api.techAiLogs({ page: logPage, limit: 20, provider: filterProvider, success: filterSuccess }),
      ]);
      setStatus(s);
      setAiStats(a);
      setLogs(l.logs || []);
      setLogTotal(l.total || 0);

      const pList = s.primaryModels || s.modelQueue || [];
      setPrimaryModelsState(pList);
      if (s.geminiQueue?.length) setGeminiQueue(s.geminiQueue);
      if (s.providersActive) setProvidersActiveState(s.providersActive);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [logPage, filterProvider, filterSuccess]);

  useEffect(() => { load(); }, [load]);

  // Reorder primary models
  const movePrimary = (from, to) => {
    const q = [...primaryModels];
    const [item] = q.splice(from, 1);
    q.splice(to, 0, item);
    setPrimaryModelsState(q.map((m, i) => ({ ...m, priority: i + 1 })));
    setDraggingPrimary(to);
  };

  // Reorder gemini models
  const moveGem = (from, to) => {
    const q = [...geminiQueue];
    const [item] = q.splice(from, 1);
    q.splice(to, 0, item);
    setGeminiQueue(q.map((m, i) => ({ ...m, priority: i + 1 })));
    setDraggingGem(to);
  };

  const togglePrimary = (id) =>
    setPrimaryModelsState((q) => q.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));

  const toggleGem = (label) =>
    setGeminiQueue((q) => q.map((m) => (m.id === label || m.label === label ? { ...m, enabled: !m.enabled } : m)));

  const handleDeletePrimary = (id) => {
    if (!window.confirm(`Remove model ${id}?`)) return;
    setPrimaryModelsState((q) => q.filter((m) => m.id !== id));
  };

  const handleAddModel = (e) => {
    e.preventDefault();
    if (!newModelId.trim()) return;
    const model = {
      id: newModelId.trim(),
      label: newModelLabel.trim() || newModelId.trim(),
      tier: newModelTier,
      priority: primaryModels.length + 1,
      enabled: true,
    };
    setPrimaryModelsState([...primaryModels, model]);
    setNewModelId("");
    setNewModelLabel("");
    setShowAddModal(false);
  };

  const toggleProvider = async (name) => {
    const updated = { ...providersActive, [name]: !providersActive[name] };
    setProvidersActiveState(updated);
    try {
      await api.techAiUpdateConfig({ primaryModels, geminiQueue, providersActive: updated });
      load();
    } catch (err) {
      alert("Failed to toggle provider: " + err.message);
    }
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      const payload = { primaryModels, geminiQueue, providersActive };
      if (apiKeyInput.trim()) {
        payload.apiKey = apiKeyInput.trim();
      }
      await api.techAiUpdateConfig(payload);
      setIsEditingKey(false);
      setApiKeyInput("");
      setKeySavedMsg(true);
      setTimeout(() => setKeySavedMsg(false), 3000);
      load();
    } catch (err) {
      alert("Failed to save AI configuration: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(await api.techAiTest(testMsg));
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const inputStyle = {
    padding: "8px 12px", borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`,
    color: C.text, fontSize: 13, outline: "none",
  };

  const providerColor = { primary: C.accent, gemini: C.cyan, static: C.muted };

  const barData = aiStats?.byProvider
    ? Object.entries(aiStats.byProvider).map(([k, v]) => ({ name: k, success: v.success || 0, fail: v.fail || 0 }))
    : [];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: C.text, maxWidth: 1400, margin: "0 auto" }}>
      {/* Top Banner / Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #B98A4B, #966B33)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20 }}>
            <FiCpu />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>AI Core Orchestrator</h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: C.muted }}>
              {primaryModels.filter(m => m.enabled).length} Active Primary Models · {geminiQueue.filter(m => m.enabled).length} Gemini Fallbacks · Offline Static Protection
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={load} style={{ ...inputStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            <FiRefreshCw /> Refresh Status
          </button>
        </div>
      </div>

      {/* Provider Health Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 22 }}>
        {(status?.providers || []).map((p) => {
          const isPrimary = p.provider === "primary";
          const online = p.status === "online" || p.status === "always-online";
          const isActive = providersActive[p.provider] !== false;
          const dot = !isActive ? C.red : online ? C.green : p.status === "offline" ? C.red : C.amber;
          const displayStatus = !isActive ? "disabled" : p.status;

          return (
            <div key={p.provider} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{p.label || p.provider}</div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: `${dot}15`, color: dot, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, boxShadow: `0 0 6px ${dot}` }} />
                    {displayStatus}
                  </span>
                </div>
                {isActive && p.latencyMs != null && (
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                    Latency: <span style={{ color: C.accent, fontWeight: 700 }}>{p.latencyMs}ms</span>
                  </div>
                )}
                {isActive && p.models != null && (
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    Models: <strong style={{ color: C.text }}>{p.models} / {p.totalModels ?? p.models}</strong> online
                  </div>
                )}
                {isActive && p.activeModel && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                    Primary Model: <span style={{ color: C.text, fontWeight: 600 }}>{p.activeModel}</span>
                  </div>
                )}
                {!isActive && (
                  <div style={{ fontSize: 11, color: C.red, fontWeight: 600, marginTop: 4 }}>Manually paused by Admin</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleProvider(p.provider)}
                style={{
                  width: "100%", padding: "7px 0", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer", border: "none",
                  background: isActive ? "rgba(220,38,38,0.12)" : "rgba(22,163,74,0.12)",
                  color: isActive ? C.red : C.green,
                  transition: "all 0.15s ease",
                }}
              >
                {isActive ? "PAUSE PROVIDER" : "ENABLE PROVIDER"}
              </button>
            </div>
          );
        })}
      </div>

      {/* API Key Management Card (Strictly without Base URL) */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 22px", marginBottom: 22, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 15 }}>
              <FiKey style={{ color: C.accent }} /> Primary AI Authentication
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
              Secure server-side API Key. Base endpoint routing is protected and hidden.
            </div>
          </div>
          {keySavedMsg && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.green, fontSize: 12, fontWeight: 700 }}>
              <FiCheck /> Settings Saved Successfully
            </span>
          )}
        </div>

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {!isEditingKey ? (
            <>
              <div style={{ padding: "8px 14px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: "monospace", fontSize: 13, color: C.text, minWidth: 260 }}>
                {status?.maskedApiKey || "No API Key configured"}
              </div>
              <button
                type="button"
                onClick={() => setIsEditingKey(true)}
                style={{ ...inputStyle, background: C.surface2, cursor: "pointer", fontWeight: 700, fontSize: 12 }}
              >
                Change API Key
              </button>
            </>
          ) : (
            <>
              <input
                type="password"
                placeholder="Enter new API Key (e.g. sk-86da...)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: 280, fontFamily: "monospace" }}
              />
              <button
                type="button"
                onClick={saveConfig}
                disabled={savingConfig || !apiKeyInput.trim()}
                style={{ ...inputStyle, background: C.accent, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}
              >
                {savingConfig ? "Saving..." : "Save Key"}
              </button>
              <button
                type="button"
                onClick={() => { setIsEditingKey(false); setApiKeyInput(""); }}
                style={{ ...inputStyle, background: "transparent", cursor: "pointer", fontSize: 12 }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Row */}
      {aiStats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 22 }}>
          {[
            { l: "Total Inferences (7d)", v: aiStats.totalCalls, c: C.accent },
            { l: "Success Rate", v: `${aiStats.successRate}%`, c: C.green },
            { l: "Tokens Processed", v: (aiStats.totalTokens || 0).toLocaleString(), c: C.purple },
            { l: "Lifetime Invocations", v: aiStats.totalLogsAllTime, c: C.muted },
          ].map((s) => (
            <div key={s.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700, marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Model Queues + Test Console Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, marginBottom: 24 }}>

        {/* Model Queue Column */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 6 }}>
              {[
                ["primary", "⚡ Primary AI (DeepSeek)"],
                ["gemini", "🛡️ Gemini Fallback"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding: "7px 14px", borderRadius: 8,
                    border: `1px solid ${activeTab === key ? C.accent : C.border}`,
                    background: activeTab === key ? "rgba(185,138,75,0.12)" : "transparent",
                    color: activeTab === key ? C.accent : C.muted,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              {activeTab === "primary" && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  style={{ ...inputStyle, background: C.surface2, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700 }}
                >
                  <FiPlus /> Add Model
                </button>
              )}
              <button
                type="button"
                onClick={saveConfig}
                disabled={savingConfig}
                style={{ padding: "7px 16px", borderRadius: 8, background: C.accent, border: "none", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 700 }}
              >
                {savingConfig ? "Saving…" : "Save Order"}
              </button>
            </div>
          </div>

          <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
            Drag handle (⠿) to change fallback execution order. Toggle switch to enable or disable models.
          </div>

          {/* Model rows list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 440, overflowY: "auto", paddingRight: 4 }}>
            {activeTab === "primary"
              ? primaryModels.map((m, i) => (
                  <ModelRow
                    key={m.id}
                    m={m}
                    i={i}
                    dragging={draggingPrimary}
                    onDragStart={setDraggingPrimary}
                    onDragOver={(to) => movePrimary(draggingPrimary, to)}
                    onDragEnd={() => setDraggingPrimary(null)}
                    onToggle={togglePrimary}
                    onDelete={handleDeletePrimary}
                    showTier={true}
                  />
                ))
              : geminiQueue.map((m, i) => (
                  <ModelRow
                    key={m.id}
                    m={m}
                    i={i}
                    dragging={draggingGem}
                    onDragStart={setDraggingGem}
                    onDragOver={(to) => moveGem(draggingGem, to)}
                    onDragEnd={() => setDraggingGem(null)}
                    onToggle={toggleGem}
                    showTier={true}
                  />
                ))}
          </div>

          {/* Add Model Modal */}
          {showAddModal && (
            <div style={{ marginTop: 16, padding: 14, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Register New Primary Model</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 3 }}>Model ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. deepseek-v4.1"
                    value={newModelId}
                    onChange={(e) => setNewModelId(e.target.value)}
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 3 }}>Display Label</label>
                  <input
                    type="text"
                    placeholder="e.g. DeepSeek v4.1"
                    value={newModelLabel}
                    onChange={(e) => setNewModelLabel(e.target.value)}
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: C.muted }}>Tier:</span>
                  <select
                    value={newModelTier}
                    onChange={(e) => setNewModelTier(e.target.value)}
                    style={{ ...inputStyle, padding: "5px 10px", fontSize: 12 }}
                  >
                    <option value="standard">Standard / Fast</option>
                    <option value="high">High Reasoning</option>
                    <option value="legacy">Legacy</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{ ...inputStyle, background: "transparent", cursor: "pointer", fontSize: 11 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddModel}
                    disabled={!newModelId.trim()}
                    style={{ ...inputStyle, background: C.accent, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11 }}
                  >
                    Add to Queue
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Test Console & Visualizer */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Test Console */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, flex: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <FiSliders style={{ color: C.accent }} /> Live Inference Inspector
            </div>
            <textarea
              value={testMsg}
              onChange={(e) => setTestMsg(e.target.value)}
              rows={2}
              style={{ ...inputStyle, width: "100%", resize: "vertical", boxSizing: "border-box", marginBottom: 10, fontFamily: "inherit" }}
              placeholder="Enter message to test AI responses..."
            />
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 10, background: C.accent, border: "none",
                color: "#fff", fontWeight: 800, fontSize: 13, cursor: testing ? "not-allowed" : "pointer",
                opacity: testing ? 0.7 : 1, marginBottom: 12, transition: "all 0.15s ease",
              }}
            >
              {testing ? "Testing Pipeline…" : "Execute Diagnostic Prompt"}
            </button>
            {testResult && (
              <div style={{ background: C.surface2, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
                {testResult.error ? (
                  <div style={{ color: C.red, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <FiAlertTriangle /> {testResult.error}
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ background: `${providerColor[testResult.provider] || C.accent}20`, color: providerColor[testResult.provider] || C.accent, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: "capitalize" }}>
                        {testResult.provider}
                      </span>
                      <span style={{ background: "rgba(0,0,0,0.06)", color: C.text, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontFamily: "monospace" }}>
                        {testResult.model}
                      </span>
                      {testResult.latencyMs && (
                        <span style={{ color: C.amber, fontSize: 11, fontWeight: 700 }}>
                          {testResult.latencyMs}ms
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {testResult.reply}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Provider Performance Chart */}
          {barData.length > 0 && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
                <FiFileText /> Provider Volume & Reliability (7 Days)
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={barData} barCategoryGap="25%">
                  <XAxis dataKey="name" stroke={C.muted} tick={{ fontSize: 11 }} />
                  <YAxis stroke={C.muted} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 11 }} />
                  <Bar dataKey="success" fill={C.green} radius={[4, 4, 0, 0]} name="Successful" />
                  <Bar dataKey="fail" fill={C.red} radius={[4, 4, 0, 0]} name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* AI Logs Audit Trail */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <FiFileText style={{ color: C.accent }} /> Chatbot Execution Logs ({logTotal})
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)} style={inputStyle}>
              <option value="">All Providers</option>
              <option value="primary">Primary AI</option>
              <option value="gemini">Gemini</option>
              <option value="static">Static</option>
            </select>
            <select value={filterSuccess} onChange={(e) => setFilterSuccess(e.target.value)} style={inputStyle}>
              <option value="">All Statuses</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
            <button
              type="button"
              onClick={() => { setLogPage(1); load(); }}
              style={{ ...inputStyle, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              title="Refresh Logs"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Provider", "Model", "Prompt Snippet", "Tokens", "Latency", "Status", "Timestamp"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ color: providerColor[log.provider] || C.muted, fontWeight: 800, textTransform: "capitalize" }}>
                      {log.provider}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: C.muted, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{log.model}</td>
                  <td style={{ padding: "10px 12px", color: C.text, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.prompt}</td>
                  <td style={{ padding: "10px 12px", color: C.purple, fontWeight: 600 }}>{log.tokens ?? "—"}</td>
                  <td style={{ padding: "10px 12px", color: C.cyan, fontWeight: 600 }}>{log.latencyMs ? `${log.latencyMs}ms` : "—"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ color: log.success ? C.green : C.red, fontWeight: 800 }}>{log.success ? "✓ OK" : "✗ FAIL"}</span>
                    {!log.success && <span style={{ color: C.red, fontSize: 10, marginLeft: 6 }}>{log.errorMsg?.slice(0, 30)}</span>}
                  </td>
                  <td style={{ padding: "10px 12px", color: C.muted }}>{new Date(log.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 36, color: C.muted }}>
                    No logs recorded yet. Real conversations and test runs will populate this table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {logTotal > 20 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16 }}>
            <button type="button" onClick={() => setLogPage((p) => Math.max(1, p - 1))} disabled={logPage === 1} style={{ ...inputStyle, cursor: "pointer", fontWeight: 700 }}>← Prev</button>
            <span style={{ padding: "8px 12px", color: C.muted, fontSize: 12, fontWeight: 600 }}>Page {logPage} / {Math.ceil(logTotal / 20)}</span>
            <button type="button" onClick={() => setLogPage((p) => p + 1)} disabled={logPage >= Math.ceil(logTotal / 20)} style={{ ...inputStyle, cursor: "pointer", fontWeight: 700 }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
