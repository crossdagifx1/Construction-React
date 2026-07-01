import { useState, useEffect, useCallback } from "react";
import { api } from "../../../lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const C = {
  bg: "#060610",
  surface: "#0f0f1e",
  surface2: "#16162b",
  border: "rgba(123,123,200,0.12)",
  accent: "#7c3aed",
  accentGlow: "rgba(124,58,237,0.25)",
  cyan: "#06b6d4",
  green: "#10b981",
  red: "#ef4444",
  amber: "#f59e0b",
  text: "#e2e2f0",
  muted: "#7b7b9a",
  gold: "#d4af37",
};

const badge = (status) => {
  const map = {
    online: { bg: "rgba(16,185,129,0.12)", color: C.green, dot: C.green },
    offline: { bg: "rgba(239,68,68,0.12)", color: C.red, dot: C.red },
    error: { bg: "rgba(245,158,11,0.12)", color: C.amber, dot: C.amber },
    "not-configured": { bg: "rgba(123,123,154,0.12)", color: C.muted, dot: C.muted },
    "always-online": { bg: "rgba(16,185,129,0.08)", color: C.green, dot: C.green },
    degraded: { bg: "rgba(245,158,11,0.12)", color: C.amber, dot: C.amber },
    healthy: { bg: "rgba(16,185,129,0.12)", color: C.green, dot: C.green },
  };
  const s = map[status] || map["not-configured"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, boxShadow: `0 0 6px ${s.dot}` }} />
      {status}
    </span>
  );
};

const Card = ({ title, value, sub, color = C.accent, icon }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ color: C.muted, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{title}</div>
        <div style={{ color: color, fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 28, opacity: 0.6 }}>{icon}</div>
    </div>
  </div>
);

export default function TechDashboard() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [aiStats, setAiStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, s, a] = await Promise.all([api.techHealth(), api.techSystemStats(), api.techAiStats(24)]);
      setHealth(h);
      setStats(s);
      setAiStats(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const providerData = aiStats?.byProvider
    ? Object.entries(aiStats.byProvider).map(([k, v]) => ({
        name: k, calls: v.calls || 0, success: v.success || 0, fail: v.fail || 0,
      }))
    : [];

  const serviceRows = health
    ? Object.entries(health.services).map(([k, v]) => ({ name: k, ...v }))
    : [];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: C.text, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Technical Dashboard</h1>
            <p style={{ margin: 0, fontSize: 13, color: C.muted }}>System overview · Last refreshed: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          {health && badge(health.overallStatus)}
          <button onClick={load} style={{ padding: "4px 14px", borderRadius: 8, background: "rgba(124,58,237,0.12)", border: `1px solid ${C.accentGlow}`, color: C.accent, fontSize: 12, cursor: "pointer" }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>Loading system data…</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <Card title="AI Calls (24h)" value={aiStats?.totalCalls ?? 0} sub={`${aiStats?.successRate ?? 0}% success rate`} color={C.cyan} icon="🤖" />
            <Card title="Total Tokens" value={(aiStats?.totalTokens ?? 0).toLocaleString()} sub="consumed (24h)" color={C.gold} icon="🪙" />
            <Card title="Error Logs" value={stats?.system?.errorLogs ?? 0} sub="all time" color={C.red} icon="🚨" />
            <Card title="Chat Sessions" value={stats?.engagement?.chatSessions ?? 0} sub={`${stats?.engagement?.chatMessages ?? 0} messages`} color={C.accent} icon="💬" />
            <Card title="Bookings" value={stats?.engagement?.bookings ?? 0} sub="total bookings" color={C.green} icon="📅" />
            <Card title="Report Jobs" value={stats?.system?.reportJobs ?? 0} sub="generated" color={C.muted} icon="📊" />
          </div>

          {/* Two-column: Provider Status + AI Chart */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16, marginBottom: 24 }}>
            {/* Service Health */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: C.text }}>🏥 Service Health</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {serviceRows.map((row) => (
                  <div key={row.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: C.surface2, borderRadius: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, textTransform: "capitalize" }}>{row.name}</div>
                      {row.latencyMs && <div style={{ fontSize: 11, color: C.muted }}>{row.latencyMs}ms</div>}
                    </div>
                    {badge(row.status)}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Usage Chart */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: C.text }}>🤖 AI Calls by Provider (24h)</div>
              {providerData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={providerData} barCategoryGap="30%">
                    <XAxis dataKey="name" stroke={C.muted} tick={{ fontSize: 11 }} />
                    <YAxis stroke={C.muted} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
                    <Bar dataKey="success" fill={C.green} radius={[4, 4, 0, 0]} name="Success" />
                    <Bar dataKey="fail" fill={C.red} radius={[4, 4, 0, 0]} name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>
                  No AI calls yet in the last 24h
                </div>
              )}
            </div>
          </div>

          {/* Env Audit */}
          {health?.env && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: C.text }}>⚙️ Environment Variables</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
                {Object.entries(health.env).map(([key, val]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", background: C.surface2, borderRadius: 8 }}>
                    <code style={{ fontSize: 11, color: C.muted }}>{key}</code>
                    <span style={{ fontSize: 12 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
