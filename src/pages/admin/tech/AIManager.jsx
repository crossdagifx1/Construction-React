import { useState, useEffect, useCallback } from "react";
import { api } from "../../../lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const C = {
  surface: "#0f0f1e", surface2: "#16162b", border: "rgba(123,123,200,0.12)",
  accent: "#7c3aed", cyan: "#06b6d4", green: "#10b981", red: "#ef4444",
  amber: "#f59e0b", text: "#e2e2f0", muted: "#7b7b9a", gold: "#d4af37",
  purple: "#a78bfa",
};

const TIER_STYLE = {
  unlimited: { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Unlimited" },
  high:      { bg: "rgba(6,182,212,0.15)",  color: "#06b6d4", label: "High Quota" },
  standard:  { bg: "rgba(124,58,237,0.15)", color: "#a78bfa", label: "Standard"   },
  legacy:    { bg: "rgba(123,123,154,0.1)", color: "#7b7b9a", label: "Legacy"     },
};

function ModelRow({ m, i, dragging, onDragStart, onDragOver, onDragEnd, onToggle, showTier }) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(i)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(i); }}
      onDragEnd={onDragEnd}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
        borderRadius: 10, cursor: "grab",
        background: dragging === i ? "rgba(124,58,237,0.12)" : C.surface2,
        border: `1px solid ${dragging === i ? C.accent : C.border}`,
        opacity: m.enabled ? 1 : 0.42, transition: "all 0.12s",
      }}
    >
      <span style={{ color: C.muted, fontSize: 11, minWidth: 18, fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
      <span style={{ color: C.muted, fontSize: 13 }}>⠿</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.label}</div>
        <div style={{ fontSize: 10, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.id}</div>
      </div>
      {showTier && m.tier && (() => {
        const ts = TIER_STYLE[m.tier] || TIER_STYLE.standard;
        return (
          <span style={{ padding: "2px 7px", borderRadius: 10, background: ts.bg, color: ts.color, fontSize: 9, fontWeight: 700, flexShrink: 0, textTransform: "uppercase", letterSpacing: 0.8 }}>
            {ts.label}
          </span>
        );
      })()}
      <button
        onClick={() => onToggle(m.id || m.label)}
        style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "none", flexShrink: 0, background: m.enabled ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: m.enabled ? C.green : C.red }}
      >
        {m.enabled ? "ON" : "OFF"}
      </button>
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

  // Providers active toggles state
  const [providersActive, setProvidersActiveState] = useState({ openrouter: true, gemini: true, static: true });

  // OR queue state
  const [modelQueue, setModelQueue] = useState([]);
  const [draggingOR, setDraggingOR] = useState(null);

  // Gemini queue state
  const [geminiQueue, setGeminiQueue] = useState([]);
  const [draggingGem, setDraggingGem] = useState(null);

  const [savingConfig, setSavingConfig] = useState(false);
  const [activeTab, setActiveTab] = useState("openrouter"); // "openrouter" | "gemini"

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
      if (s.modelQueue?.length)  setModelQueue(s.modelQueue);
      if (s.geminiQueue?.length) setGeminiQueue(s.geminiQueue);
      if (s.providersActive)     setProvidersActiveState(s.providersActive);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [logPage, filterProvider, filterSuccess]);

  useEffect(() => { load(); }, [load]);

  const moveOR = (from, to) => {
    const q = [...modelQueue];
    const [item] = q.splice(from, 1);
    q.splice(to, 0, item);
    setModelQueue(q.map((m, i) => ({ ...m, priority: i + 1 })));
    setDraggingOR(to);
  };
  const moveGem = (from, to) => {
    const q = [...geminiQueue];
    const [item] = q.splice(from, 1);
    q.splice(to, 0, item);
    setGeminiQueue(q.map((m, i) => ({ ...m, priority: i + 1 })));
    setDraggingGem(to);
  };

  const toggleOR  = (id) => setModelQueue((q) => q.map((m) => m.id === id ? { ...m, enabled: !m.enabled } : m));
  const toggleGem = (label) => setGeminiQueue((q) => q.map((m) => (m.id === label || m.label === label) ? { ...m, enabled: !m.enabled } : m));

  const toggleProvider = async (name) => {
    const updated = { ...providersActive, [name]: !providersActive[name] };
    setProvidersActiveState(updated);
    try {
      await api.techAiUpdateConfig({ modelQueue, geminiQueue, providersActive: updated });
      load();
    } catch (err) {
      alert("Failed to toggle provider: " + err.message);
    }
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await api.techAiUpdateConfig({ modelQueue, geminiQueue, providersActive });
      load();
    } catch (err) {
      alert("Failed: " + err.message);
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

  const input = { padding: "8px 12px", borderRadius: 8, background: C.surface2, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, outline: "none" };

  const providerColor = { openrouter: C.accent, gemini: C.cyan, static: C.muted };

  const barData = aiStats?.byProvider
    ? Object.entries(aiStats.byProvider).map(([k, v]) => ({ name: k, success: v.success || 0, fail: v.fail || 0 }))
    : [];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: C.text }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #7c3aed, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🤖</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>AI Manager</h1>
            <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
              {(status?.modelQueue?.filter(m => m.enabled).length ?? 0)} OpenRouter · {(status?.geminiQueue?.filter(m => m.enabled).length ?? 0)} Gemini · Static fallback
            </p>
          </div>
        </div>
        <button onClick={load} style={{ ...input, cursor: "pointer" }}>↻ Refresh</button>
      </div>

      {/* Provider Status Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 22 }}>
        {(status?.providers || []).map((p) => {
          const online = p.status === "online" || p.status === "always-online";
          const isActive = providersActive[p.provider] !== false;
          const dot = !isActive ? C.red : online ? C.green : p.status === "offline" ? C.red : C.amber;
          const displayStatus = !isActive ? "stopped" : p.status;
          return (
            <div key={p.provider} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, textTransform: "capitalize" }}>{p.provider}</div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: `${dot}18`, color: dot, fontSize: 10, fontWeight: 700, textTransform: "capitalize" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, boxShadow: `0 0 6px ${dot}` }} />
                    {displayStatus}
                  </span>
                </div>
                {isActive && p.latencyMs != null && <div style={{ fontSize: 11, color: C.muted }}>Latency: <span style={{ color: C.cyan, fontWeight: 600 }}>{p.latencyMs}ms</span></div>}
                {isActive && p.models != null && <div style={{ fontSize: 11, color: C.muted }}>{p.models} / {p.totalModels ?? p.models} models active</div>}
                {isActive && p.activeModel && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Primary: {p.activeModel}</div>}
                {!isActive && <div style={{ fontSize: 11, color: C.red, fontWeight: 500 }}>Provider is manually disabled</div>}
              </div>
              <button
                onClick={() => toggleProvider(p.provider)}
                style={{
                  width: "100%", padding: "6px 0", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
                  background: isActive ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                  color: isActive ? C.red : C.green,
                  transition: "all 0.12s", marginTop: 4
                }}
              >
                {isActive ? "🛑 STOP" : "▶ START"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Stats Row */}
      {aiStats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 22 }}>
          {[
            { l: "Total Calls (7d)", v: aiStats.totalCalls, c: C.cyan },
            { l: "Success Rate", v: `${aiStats.successRate}%`, c: C.green },
            { l: "Tokens Used", v: (aiStats.totalTokens || 0).toLocaleString(), c: C.gold },
            { l: "All-Time Logs", v: aiStats.totalLogsAllTime, c: C.muted },
          ].map((s) => (
            <div key={s.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Model Queues + Test Console */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, marginBottom: 22 }}>

        {/* Model Priority Queue (tabbed: OR | Gemini) */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[["openrouter", "🔷 OpenRouter"], ["gemini", "🔶 Gemini"]].map(([key, label]) => (
                <button key={key} onClick={() => setActiveTab(key)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${activeTab === key ? (key === "openrouter" ? C.accent : C.cyan) : C.border}`, background: activeTab === key ? (key === "openrouter" ? "rgba(124,58,237,0.15)" : "rgba(6,182,212,0.15)") : "transparent", color: activeTab === key ? (key === "openrouter" ? C.accent : C.cyan) : C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={saveConfig} disabled={savingConfig} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(16,185,129,0.12)", border: `1px solid ${C.green}`, color: C.green, fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
              {savingConfig ? "Saving…" : "💾 Save"}
            </button>
          </div>

          <div style={{ fontSize: 10, color: C.muted, marginBottom: 10 }}>Drag to reorder · Toggle to enable/disable</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
            {activeTab === "openrouter"
              ? modelQueue.map((m, i) => (
                  <ModelRow key={m.id} m={m} i={i} dragging={draggingOR}
                    onDragStart={setDraggingOR} onDragOver={(to) => moveOR(draggingOR, to)}
                    onDragEnd={() => setDraggingOR(null)} onToggle={toggleOR} showTier={false} />
                ))
              : geminiQueue.map((m, i) => (
                  <ModelRow key={m.id} m={m} i={i} dragging={draggingGem}
                    onDragStart={setDraggingGem} onDragOver={(to) => moveGem(draggingGem, to)}
                    onDragEnd={() => setDraggingGem(null)} onToggle={toggleGem} showTier={true} />
                ))
            }
          </div>

          {/* Legend for Gemini tier */}
          {activeTab === "gemini" && (
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {Object.entries(TIER_STYLE).map(([key, ts]) => (
                <span key={key} style={{ padding: "2px 8px", borderRadius: 10, background: ts.bg, color: ts.color, fontSize: 9, fontWeight: 700 }}>{ts.label}</span>
              ))}
            </div>
          )}
        </div>

        {/* Test Console + Chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Test Console */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>🧪 AI Test Console</div>
            <textarea value={testMsg} onChange={(e) => setTestMsg(e.target.value)} rows={2}
              style={{ ...input, width: "100%", resize: "vertical", boxSizing: "border-box", marginBottom: 8, fontFamily: "inherit" }} />
            <button onClick={handleTest} disabled={testing}
              style={{ width: "100%", padding: "10px 0", borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #06b6d4)", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: testing ? "not-allowed" : "pointer", opacity: testing ? 0.7 : 1, marginBottom: 10 }}>
              {testing ? "Testing…" : "⚡ Send Test"}
            </button>
            {testResult && (
              <div style={{ background: C.surface2, borderRadius: 10, padding: 12 }}>
                {testResult.error ? (
                  <div style={{ color: C.red, fontSize: 12 }}>❌ {testResult.error}</div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ background: `${providerColor[testResult.provider]}18`, color: providerColor[testResult.provider], padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{testResult.provider}</span>
                      <span style={{ background: "rgba(123,123,154,0.1)", color: C.muted, padding: "2px 8px", borderRadius: 20, fontSize: 10 }}>{testResult.model}</span>
                      {testResult.latencyMs && <span style={{ color: C.amber, fontSize: 11 }}>{testResult.latencyMs}ms</span>}
                    </div>
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{testResult.reply}</div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Provider Chart */}
          {barData.length > 0 && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: C.muted }}>📊 Calls by Provider (7d)</div>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={barData} barCategoryGap="30%">
                  <XAxis dataKey="name" stroke={C.muted} tick={{ fontSize: 10 }} />
                  <YAxis stroke={C.muted} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 11 }} />
                  <Bar dataKey="success" fill={C.green} radius={[4, 4, 0, 0]} name="Success" />
                  <Bar dataKey="fail" fill={C.red} radius={[4, 4, 0, 0]} name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* AI Logs Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>📋 AI Call Logs ({logTotal})</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)} style={input}>
              <option value="">All Providers</option>
              <option value="openrouter">OpenRouter</option>
              <option value="gemini">Gemini</option>
              <option value="static">Static</option>
            </select>
            <select value={filterSuccess} onChange={(e) => setFilterSuccess(e.target.value)} style={input}>
              <option value="">All Results</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
            <button onClick={() => { setLogPage(1); load(); }} style={{ ...input, cursor: "pointer" }}>↻</button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Provider", "Model", "Prompt", "Tokens", "Latency", "Status", "Time"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 10px", borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid rgba(123,123,200,0.06)" }}>
                  <td style={{ padding: "8px 10px" }}><span style={{ color: providerColor[log.provider] || C.muted, fontWeight: 700 }}>{log.provider}</span></td>
                  <td style={{ padding: "8px 10px", color: C.muted, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.model}</td>
                  <td style={{ padding: "8px 10px", color: C.text, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.prompt}</td>
                  <td style={{ padding: "8px 10px", color: C.amber }}>{log.tokens ?? "—"}</td>
                  <td style={{ padding: "8px 10px", color: C.cyan }}>{log.latencyMs ? `${log.latencyMs}ms` : "—"}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ color: log.success ? C.green : C.red, fontWeight: 700 }}>{log.success ? "✓" : "✗"}</span>
                    {!log.success && <span style={{ color: C.red, fontSize: 10, marginLeft: 4 }}>{log.errorMsg?.slice(0, 30)}</span>}
                  </td>
                  <td style={{ padding: "8px 10px", color: C.muted }}>{new Date(log.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 30, color: C.muted }}>No logs yet — send a chat message to populate this table.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {logTotal > 20 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
            <button onClick={() => setLogPage((p) => Math.max(1, p - 1))} disabled={logPage === 1} style={{ ...input, cursor: "pointer" }}>← Prev</button>
            <span style={{ padding: "8px 12px", color: C.muted, fontSize: 12 }}>Page {logPage} / {Math.ceil(logTotal / 20)}</span>
            <button onClick={() => setLogPage((p) => p + 1)} disabled={logPage >= Math.ceil(logTotal / 20)} style={{ ...input, cursor: "pointer" }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
