import { useState, useEffect, useCallback } from "react";
import { api } from "../../../lib/api";

const C = {
  bg: "#060610", surface: "#0f0f1e", surface2: "#16162b",
  border: "rgba(123,123,200,0.12)", accent: "#7c3aed",
  cyan: "#06b6d4", green: "#10b981", red: "#ef4444",
  amber: "#f59e0b", text: "#e2e2f0", muted: "#7b7b9a",
};

const StatusDot = ({ status }) => {
  const color = status === "online" || status === "always-online" ? C.green : status === "offline" ? C.red : C.amber;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: `${color}18`, color, fontSize: 11, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, animation: (status === "online" || status === "always-online") ? "pulse 2s infinite" : "none" }} />
      {status}
    </span>
  );
};

const EnvRow = ({ k, v }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: C.surface2, borderRadius: 8, marginBottom: 6 }}>
    <code style={{ fontSize: 11, color: C.muted }}>{k}</code>
    <span style={{ fontSize: 13 }}>{v}</span>
  </div>
);

const StatCard = ({ label, value, color = C.text }) => (
  <div style={{ background: C.surface2, borderRadius: 10, padding: "12px 14px" }}>
    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
  </div>
);

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, s, a] = await Promise.all([
        api.techHealth(),
        api.techSystemStats(),
        api.techAdmins(),
      ]);
      setHealth(h);
      setStats(s);
      setAdmins(a || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: C.text }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #10b981, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏥</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>System Health</h1>
              <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Infrastructure · Database · AI APIs · Environment</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {health && <StatusDot status={health.overallStatus} />}
            <button onClick={load} style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(124,58,237,0.1)", border: `1px solid rgba(124,58,237,0.3)`, color: C.accent, fontSize: 12, cursor: "pointer" }}>↻ Refresh</button>
          </div>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 60, color: C.muted }}>Running health checks…</div>}

      {!loading && (
        <>
          {/* Service Status Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
            {health && Object.entries(health.services).map(([name, svc]) => (
              <div key={name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, textTransform: "capitalize" }}>{name}</div>
                  <StatusDot status={svc.status} />
                </div>
                {svc.latencyMs != null && (
                  <div style={{ fontSize: 12, color: C.muted }}>
                    Latency: <span style={{ color: svc.latencyMs < 200 ? C.green : svc.latencyMs < 500 ? C.amber : C.red, fontWeight: 600 }}>{svc.latencyMs}ms</span>
                  </div>
                )}
                {svc.error && <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{svc.error}</div>}
                {svc.configured != null && (
                  <div style={{ fontSize: 11, color: svc.configured ? C.green : C.red, marginTop: 4 }}>
                    {svc.configured ? "✅ API Key configured" : "❌ Not configured"}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* AI Fallback Chain Visualization */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>⛓️ AI Fallback Chain</div>
            <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
              {[
                { label: "OpenRouter", sub: "Primary (7 free models)", icon: "🔷", color: C.accent },
                { label: "Gemini Direct", sub: "Fallback (gemini-1.5-flash)", icon: "🔶", color: C.cyan },
                { label: "Static Response", sub: "Final fallback (always works)", icon: "🟢", color: C.green },
              ].map((step, i, arr) => (
                <div key={step.label} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ background: C.surface2, borderRadius: 12, padding: "12px 16px", border: `1px solid ${step.color}40`, textAlign: "center", minWidth: 140 }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{step.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: step.color }}>{step.label}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{step.sub}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ padding: "0 10px", color: C.muted, fontSize: 20 }}>→</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* DB Stats */}
          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
              {Object.entries(stats).map(([group, data]) => (
                <div key={group} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.muted, textTransform: "capitalize", marginBottom: 12 }}>{group} Records</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {Object.entries(data).map(([k, v]) => (
                      <StatCard key={k} label={k} value={v} color={C.text} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Admin Accounts */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>👥 Admin Accounts ({admins.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {admins.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.surface2, borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.name || a.email}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{a.email} · {new Date(a.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: a.role === "TECHNICAL_ADMIN" ? "rgba(124,58,237,0.15)" : "rgba(123,123,154,0.15)",
                    color: a.role === "TECHNICAL_ADMIN" ? C.accent : C.muted,
                  }}>
                    {a.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Environment Audit */}
          {health?.env && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>⚙️ Environment Variables Audit</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 6 }}>
                {Object.entries(health.env).map(([k, v]) => (
                  <EnvRow key={k} k={k} v={v} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
