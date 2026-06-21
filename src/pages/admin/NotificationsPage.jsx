import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN = () => localStorage.getItem("havi_admin_token");

function fmtTime(d) {
  const date = new Date(d);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TYPE_ICONS = { booking: "📅", message: "✉️", chat: "💬" };
const TYPE_COLORS = { booking: "#c8a96e", message: "#a78bfa", chat: "#38bdf8" };

function NotifCard({ notif, onRead, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex", gap: 14, padding: "16px 18px",
        background: notif.read ? "rgba(255,255,255,0.02)" : "rgba(200,169,110,0.05)",
        border: `1px solid ${notif.read ? "rgba(255,255,255,0.06)" : "rgba(200,169,110,0.15)"}`,
        borderRadius: 14, marginBottom: 8, alignItems: "flex-start",
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: `${TYPE_COLORS[notif.type] || "#c8a96e"}18`,
        border: `1px solid ${TYPE_COLORS[notif.type] || "#c8a96e"}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
      }}>
        {TYPE_ICONS[notif.type] || "🔔"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ color: "#f5f0ea", fontSize: 14, fontWeight: notif.read ? 500 : 700, flex: 1 }}>
            {notif.title}
            {!notif.read && (
              <span style={{
                display: "inline-block", width: 7, height: 7, borderRadius: "50%",
                background: "#3b82f6", marginLeft: 8, verticalAlign: "middle",
              }} />
            )}
          </div>
          <span style={{ color: "rgba(245,240,234,0.3)", fontSize: 11, whiteSpace: "nowrap", flexShrink: 0 }}>
            {fmtTime(notif.createdAt)}
          </span>
        </div>
        <p style={{ color: "rgba(245,240,234,0.5)", fontSize: 13, margin: "4px 0 10px", lineHeight: 1.55 }}>
          {notif.body}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {!notif.read && (
            <button
              onClick={() => onRead(notif.id)}
              style={{
                padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa",
              }}
            >
              Mark read
            </button>
          )}
          {notif.type === "booking" && notif.refId && (
            <Link
              to="/admin/bookings"
              style={{
                padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.25)",
                color: "#c8a96e", textDecoration: "none",
              }}
            >
              View booking →
            </Link>
          )}
          <button
            onClick={() => onDelete(notif.id)}
            style={{
              padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter === "unread" ? "?unread=true" : "";
      const res = await fetch(`${API}/api/admin/notifications${params}`, {
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    await fetch(`${API}/api/admin/notifications/${id}/read`, {
      method: "PATCH", headers: { Authorization: `Bearer ${TOKEN()}` },
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch(`${API}/api/admin/notifications/read-all`, {
      method: "PATCH", headers: { Authorization: `Bearer ${TOKEN()}` },
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotif = async (id) => {
    await fetch(`${API}/api/admin/notifications/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${TOKEN()}` },
    });
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "#f5f0ea", fontSize: 24, fontWeight: 800, margin: 0 }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginLeft: 10, background: "#ef4444", color: "#fff",
                borderRadius: 12, padding: "2px 8px", fontSize: 13, fontWeight: 700,
              }}>{unreadCount}</span>
            )}
          </h1>
          <p style={{ color: "rgba(245,240,234,0.4)", fontSize: 14, margin: "4px 0 0" }}>
            {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa",
            }}
          >
            ✓ Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["all", "unread"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: filter === f ? "2px solid #c8a96e" : "2px solid rgba(255,255,255,0.08)",
              background: filter === f ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.04)",
              color: filter === f ? "#c8a96e" : "rgba(245,240,234,0.5)",
              textTransform: "capitalize",
            }}
          >
            {f === "unread" ? `Unread (${unreadCount})` : "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(245,240,234,0.3)" }}>Loading...</div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
          <p style={{ color: "rgba(245,240,234,0.3)", fontSize: 15 }}>
            {filter === "unread" ? "No unread notifications!" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div>
          {notifications.map(n => (
            <NotifCard key={n.id} notif={n} onRead={markRead} onDelete={deleteNotif} />
          ))}
        </div>
      )}
    </div>
  );
}
