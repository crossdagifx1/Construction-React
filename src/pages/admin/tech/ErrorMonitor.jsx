import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../../lib/api";

const C = {
  bg: "#060610", surface: "#0f0f1e", surface2: "#16162b",
  border: "rgba(123,123,200,0.12)", accent: "#7c3aed",
  cyan: "#06b6d4", green: "#10b981", red: "#ef4444",
  amber: "#f59e0b", text: "#e2e2f0", muted: "#7b7b9a",
};

const SEVERITY_STYLES = {
  FATAL: { bg: "rgba(239,68,68,0.2)", color: "#ef4444", border: "rgba(239,68,68,0.4)" },
  ERROR: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.2)" },
  WARN:  { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "rgba(245,158,11,0.2)" },
  INFO:  { bg: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "rgba(6,182,212,0.2)" },
  DEBUG: { bg: "rgba(123,123,154,0.1)", color: "#7b7b9a", border: "rgba(123,123,154,0.2)" },
};

const SeverityBadge = ({ severity }) => {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.INFO;
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 6, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 10, fontWeight: 700, letterSpacing: 0.8 }}>
      {severity}
    </span>
  );
};

export default function ErrorMonitor() {
  const [errors, setErrors] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterResolved, setFilterResolved] = useState("false");
  const [filterRoute, setFilterRoute] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const intervalRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (filterSeverity) params.severity = filterSeverity;
      if (filterResolved) params.resolved = filterResolved;
      if (filterRoute) params.route = filterRoute;
      const data = await api.techErrors(params);
      setErrors(data.errors || []);
      setTotal(data.total || 0);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterSeverity, filterResolved, filterRoute]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 15s
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(load, 15000);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, load]);

  const handleResolve = async (id) => {
    try {
      await api.techErrorResolve(id);
      load();
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      alert("Failed: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this error log?")) return;
    try {
      await api.techErrorDelete(id);
      load();
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      alert("Failed: " + err.message);
    }
  };

  const handleClearResolved = async () => {
    if (!confirm("Delete ALL resolved errors?")) return;
    try {
      const r = await api.techErrorsClearResolved();
      alert(`Deleted ${r.deleted} resolved errors.`);
      load();
    } catch (err) {
      alert("Failed: " + err.message);
    }
  };

  const inputStyle = {
    padding: "7px 12px", borderRadius: 8,
    background: C.surface2, border: `1px solid ${C.border}`,
    color: C.text, fontSize: 12, outline: "none",
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: C.text }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #ef4444, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚨</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Error Monitor</h1>
              <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
                {total} logs · Last refresh: {lastRefresh.toLocaleTimeString()}
                <span style={{ marginLeft: 8, width: 8, height: 8, borderRadius: "50%", background: autoRefresh ? C.green : C.muted, boxShadow: autoRefresh ? `0 0 6px ${C.green}` : "none", display: "inline-block", verticalAlign: "middle" }} />
                {autoRefresh ? " Live" : " Paused"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setAutoRefresh((v) => !v)} style={{ ...inputStyle, cursor: "pointer", color: autoRefresh ? C.green : C.muted }}>
              {autoRefresh ? "⏸ Pause" : "▶ Resume"} Auto-Refresh
            </button>
            <button onClick={load} style={{ ...inputStyle, cursor: "pointer" }}>↻ Refresh</button>
            <button onClick={handleClearResolved} style={{ ...inputStyle, cursor: "pointer", color: C.red, borderColor: "rgba(239,68,68,0.3)" }}>🗑 Clear Resolved</button>
          </div>
        </div>
      </div>

      {/* Severity quick filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["", "FATAL", "ERROR", "WARN", "INFO", "DEBUG"].map((s) => {
          const style = SEVERITY_STYLES[s] || { bg: "rgba(124,58,237,0.1)", color: C.accent, border: "rgba(124,58,237,0.3)" };
          return (
            <button key={s} onClick={() => setFilterSeverity(s)} style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${filterSeverity === s ? style.color : C.border}`, background: filterSeverity === s ? style.bg : "transparent", color: filterSeverity === s ? style.color : C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "uppercase", letterSpacing: 0.8 }}>
              {s || "All"}
            </button>
          );
        })}
        <select value={filterResolved} onChange={(e) => setFilterResolved(e.target.value)} style={{ ...inputStyle, marginLeft: "auto" }}>
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
          <option value="">All</option>
        </select>
        <input value={filterRoute} onChange={(e) => setFilterRoute(e.target.value)} placeholder="Filter by route…" style={{ ...inputStyle, width: 160 }} />
      </div>

      {/* Split view */}
      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 16 }}>
        {/* Error List */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
          {loading && <div style={{ padding: 20, color: C.muted, fontSize: 13 }}>Loading…</div>}
          {!loading && errors.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: C.green }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 700 }}>No errors found</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>System is running cleanly</div>
            </div>
          )}
          {errors.map((err) => (
            <div
              key={err.id}
              onClick={() => setSelected(selected?.id === err.id ? null : err)}
              style={{
                padding: "14px 16px",
                borderBottom: `1px solid ${C.border}`,
                cursor: "pointer",
                background: selected?.id === err.id ? "rgba(124,58,237,0.08)" : "transparent",
                transition: "background 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <SeverityBadge severity={err.severity} />
                    {err.route && <code style={{ fontSize: 11, color: C.cyan, background: "rgba(6,182,212,0.1)", padding: "1px 6px", borderRadius: 4 }}>{err.method} {err.route}</code>}
                    {err.resolved && <span style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>✓ resolved</span>}
                  </div>
                  <div style={{ fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{err.message}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{new Date(err.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {!err.resolved && (
                    <button onClick={(e) => { e.stopPropagation(); handleResolve(err.id); }} style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid rgba(16,185,129,0.3)`, background: "rgba(16,185,129,0.1)", color: C.green, fontSize: 11, cursor: "pointer" }}>✓</button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(err.id); }} style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid rgba(239,68,68,0.3)`, background: "rgba(239,68,68,0.1)", color: C.red, fontSize: 11, cursor: "pointer" }}>✕</button>
                </div>
              </div>
            </div>
          ))}
          {/* Pagination */}
          {total > 25 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 14 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ ...inputStyle, cursor: "pointer" }}>← Prev</button>
              <span style={{ padding: "7px 12px", color: C.muted, fontSize: 12 }}>Page {page} of {Math.ceil(total / 25)}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 25)} style={{ ...inputStyle, cursor: "pointer" }}>Next →</button>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, overflow: "auto", maxHeight: "70vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <SeverityBadge severity={selected.severity} />
                <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700, color: C.text }}>{selected.message}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{new Date(selected.createdAt).toLocaleString()}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.muted, fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            {selected.route && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Route</div>
                <code style={{ fontSize: 12, color: C.cyan }}>{selected.method} {selected.route}</code>
              </div>
            )}
            {selected.stack && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Stack Trace</div>
                <pre style={{ fontSize: 11, color: C.red, background: "rgba(239,68,68,0.06)", padding: 12, borderRadius: 8, overflow: "auto", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{selected.stack}</pre>
              </div>
            )}
            {selected.meta && (
              <div>
                <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Metadata</div>
                <pre style={{ fontSize: 11, color: C.text, background: C.surface2, padding: 12, borderRadius: 8, overflow: "auto", lineHeight: 1.6 }}>{JSON.stringify(selected.meta, null, 2)}</pre>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {!selected.resolved && (
                <button onClick={() => handleResolve(selected.id)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `1px solid ${C.green}`, background: "rgba(16,185,129,0.12)", color: C.green, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>✓ Mark Resolved</button>
              )}
              <button onClick={() => handleDelete(selected.id)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `1px solid ${C.red}`, background: "rgba(239,68,68,0.12)", color: C.red, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>🗑 Delete</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
