import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { FiCalendar, FiClock, FiCheckCircle, FiMail, FiArrowRight } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "");

function useToken() {
  return localStorage.getItem("havi_admin_token");
}

function apiFetch(path, token) {
  return fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
}

function KpiCard({ icon, label, value, sub, color, loading, colors }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: colors.cardBg || "#ffffff",
        border: `1px solid ${colors.cardBorder || "rgba(0,0,0,0.08)"}`,
        borderRadius: 16, padding: "20px 22px",
        display: "flex", alignItems: "flex-start", gap: 14,
        boxShadow: "0 2px 10px rgba(18,17,16,0.02)"
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, flexShrink: 0,
        color: color
      }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: colors.textMuted || "rgba(0,0,0,0.4)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
        {loading ? (
          <div style={{ height: 28, width: 60, background: "rgba(0,0,0,0.06)", borderRadius: 6 }} />
        ) : (
          <div style={{ color: colors.text || "#121110", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value}</div>
        )}
        {sub && <div style={{ color: colors.textMuted || "rgba(0,0,0,0.3)", fontSize: 11, marginTop: 4 }}>{sub}</div>}
      </div>
    </motion.div>
  );
}

const STATUS_COLORS = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildMonthlyData(monthly) {
  const now = new Date();
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = MONTHS_SHORT[d.getMonth()];
    const count = monthly.filter(m => {
      const md = new Date(m.createdAt);
      return md.getMonth() === d.getMonth() && md.getFullYear() === d.getFullYear();
    }).length;
    result.push({ month: label, bookings: count });
  }
  return result;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 15px rgba(0,0,0,0.06)" }}>
      <p style={{ color: "#c8a96e", margin: 0, fontWeight: 700, fontSize: 13 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: "#121110", margin: "4px 0 0", fontSize: 13 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { colors } = useOutletContext();
  const token = useToken();
  const [stats, setStats] = useState(null);
  const [messages, setMessages] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, msgsRes, bookingsRes] = await Promise.all([
          apiFetch("/api/bookings/stats/summary", token),
          apiFetch("/api/contact?limit=5", token),
          apiFetch("/api/bookings?limit=5", token),
        ]);
        setStats(statsRes);
        setMessages(msgsRes.messages || msgsRes || []);
        setRecentBookings(bookingsRes.bookings || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const monthlyData = stats?.monthly ? buildMonthlyData(stats.monthly) : [];

  const pieData = stats ? [
    { name: "Pending", value: stats.pending, color: STATUS_COLORS.pending },
    { name: "Confirmed", value: stats.confirmed, color: STATUS_COLORS.confirmed },
    { name: "Completed", value: stats.completed, color: STATUS_COLORS.completed },
    { name: "Cancelled", value: stats.cancelled, color: STATUS_COLORS.cancelled },
  ].filter(d => d.value > 0) : [];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: colors.text || "#121110", fontSize: 26, fontWeight: 800, margin: 0, fontFamily: "Fraunces, Georgia, serif" }}>Dashboard</h1>
        <p style={{ color: colors.textMuted || "rgba(0,0,0,0.4)", fontSize: 14, marginTop: 4 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
        <KpiCard icon={<FiCalendar size={18} />} label="Total Bookings" value={stats?.total ?? "—"} sub="All time" color="#c8a96e" loading={loading} colors={colors} />
        <KpiCard icon={<FiClock size={18} />} label="Pending" value={stats?.pending ?? "—"} sub="Awaiting review" color="#f59e0b" loading={loading} colors={colors} />
        <KpiCard icon={<FiCheckCircle size={18} />} label="Confirmed" value={stats?.confirmed ?? "—"} sub="This week" color="#3b82f6" loading={loading} colors={colors} />
        <KpiCard icon={<FiMail size={18} />} label="Messages" value={messages.length} sub="Recent" color="#a78bfa" loading={loading} colors={colors} />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 28, flexWrap: "wrap" }}>
        {/* Monthly Trend */}
        <div style={{ background: colors.cardBg || "#ffffff", border: `1px solid ${colors.cardBorder || "rgba(0,0,0,0.08)"}`, borderRadius: 16, padding: "22px 24px", boxShadow: "0 2px 10px rgba(18,17,16,0.02)" }}>
          <h3 style={{ color: colors.text || "#121110", fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>Booking Trend (6 months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: colors.textMuted || "rgba(0,0,0,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: colors.textMuted || "rgba(0,0,0,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip colors={colors} />} cursor={{ fill: "rgba(200,169,110,0.04)" }} />
              <Bar dataKey="bookings" fill="url(#goldGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c8a96e" />
                  <stop offset="100%" stopColor="#b98a4b" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Donut */}
        <div style={{ background: colors.cardBg || "#ffffff", border: `1px solid ${colors.cardBorder || "rgba(0,0,0,0.08)"}`, borderRadius: 16, padding: "22px 24px", boxShadow: "0 2px 10px rgba(18,17,16,0.02)" }}>
          <h3 style={{ color: colors.text || "#121110", fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Status Breakdown</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip colors={colors} />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", marginTop: 8 }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block" }} />
                    <span style={{ color: colors.textMuted || "rgba(0,0,0,0.4)" }}>{d.name}: </span>
                    <strong style={{ color: colors.text || "#121110" }}>{d.value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 140, color: colors.textMuted || "rgba(0,0,0,0.2)", fontSize: 13 }}>
              No bookings yet
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, flexWrap: "wrap" }}>
        {/* Recent Bookings */}
        <div style={{ background: colors.cardBg || "#ffffff", border: `1px solid ${colors.cardBorder || "rgba(0,0,0,0.08)"}`, borderRadius: 16, padding: "22px 24px", boxShadow: "0 2px 10px rgba(18,17,16,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: colors.text || "#121110", fontSize: 15, fontWeight: 700, margin: 0 }}>Recent Bookings</h3>
            <Link to="/admin/bookings" style={{ color: "#c8a96e", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>View all <FiArrowRight /></Link>
          </div>
          {loading ? (
            <div style={{ color: colors.textMuted || "rgba(0,0,0,0.3)", fontSize: 13, textAlign: "center", padding: 20 }}>Loading...</div>
          ) : recentBookings.length === 0 ? (
            <div style={{ color: colors.textMuted || "rgba(0,0,0,0.2)", fontSize: 13, textAlign: "center", padding: 20 }}>No bookings yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentBookings.map(b => (
                <div key={b.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                  background: colors.bg || "#f4f1ec", borderRadius: 10,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: STATUS_COLORS[b.status] || "#c8a96e", flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: colors.text || "#121110", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</div>
                    <div style={{ color: colors.textMuted || "rgba(0,0,0,0.4)", fontSize: 11 }}>{b.service} · {b.timeSlot}</div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                    background: `${STATUS_COLORS[b.status] || "#c8a96e"}20`,
                    color: STATUS_COLORS[b.status] || "#c8a96e",
                    textTransform: "capitalize",
                  }}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Messages */}
        <div style={{ background: colors.cardBg || "#ffffff", border: `1px solid ${colors.cardBorder || "rgba(0,0,0,0.08)"}`, borderRadius: 16, padding: "22px 24px", boxShadow: "0 2px 10px rgba(18,17,16,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: colors.text || "#121110", fontSize: 15, fontWeight: 700, margin: 0 }}>Recent Messages</h3>
            <Link to="/admin/messages" style={{ color: "#c8a96e", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>View all <FiArrowRight /></Link>
          </div>
          {loading ? (
            <div style={{ color: colors.textMuted || "rgba(0,0,0,0.3)", fontSize: 13, textAlign: "center", padding: 20 }}>Loading...</div>
          ) : messages.length === 0 ? (
            <div style={{ color: colors.textMuted || "rgba(0,0,0,0.2)", fontSize: 13, textAlign: "center", padding: 20 }}>No messages yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.slice(0, 5).map(m => (
                <div key={m.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
                  background: colors.bg || "#f4f1ec", borderRadius: 10,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "linear-gradient(135deg, #c8a96e, #a07840)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>{m.name?.[0]?.toUpperCase() || "?"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: colors.text || "#121110", fontSize: 13, fontWeight: 600 }}>{m.name}</span>
                      {!m.read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />}
                    </div>
                    <div style={{ color: colors.textMuted || "rgba(0,0,0,0.4)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
