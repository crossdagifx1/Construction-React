import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiCalendar, FiMail, FiMessageSquare, FiBell, FiTrash2, FiCheckSquare } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "");
const TOKEN = () => localStorage.getItem("havi_admin_token");

// Design tokens
const T = {
  paper:  "#F6F3ED",
  sand:   "#EFE9DF",
  line:   "#E2DCD0",
  ink:    "#121110",
  stone:  "#6F6A62",
  accent: "#B98A4B",
  deep:   "#8C6635",
};

function fmtTime(d) {
  const date = new Date(d);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TYPE_ICONS = { 
  booking: <FiCalendar size={18} />, 
  message: <FiMail size={18} />, 
  chat: <FiMessageSquare size={18} /> 
};

const TYPE_COLORS = { 
  booking: "#B98A4B", 
  message: "#7c3aed", 
  chat: "#0284c7" 
};

function NotifCard({ notif, onRead, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex", gap: 14, padding: "16px 18px",
        background: notif.read ? "#ffffff" : "#fdfbf7",
        border: `1px solid ${notif.read ? T.line : T.accent}`,
        borderRadius: 14, marginBottom: 8, alignItems: "flex-start",
        boxShadow: "0 2px 10px rgba(18,17,16,0.02)"
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: `${TYPE_COLORS[notif.type] || "#B98A4B"}18`,
        border: `1px solid ${TYPE_COLORS[notif.type] || "#B98A4B"}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: TYPE_COLORS[notif.type] || "#B98A4B"
      }}>
        {TYPE_ICONS[notif.type] || <FiBell size={18} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ color: T.ink, fontSize: 14, fontWeight: notif.read ? 500 : 700, flex: 1 }}>
            {notif.title}
            {!notif.read && (
              <span style={{
                display: "inline-block", width: 7, height: 7, borderRadius: "50%",
                background: "#3b82f6", marginLeft: 8, verticalAlign: "middle",
              }} />
            )}
          </div>
          <span style={{ color: T.stone, fontSize: 11, whiteSpace: "nowrap", flexShrink: 0 }}>
            {fmtTime(notif.createdAt)}
          </span>
        </div>
        <p style={{ color: T.stone, fontSize: 13, margin: "4px 0 10px", lineHeight: 1.55 }}>
          {notif.body}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {!notif.read && (
            <button
              onClick={() => onRead(notif.id)}
              style={{
                padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: "#dbeafe", border: "1px solid #bfdbfe", color: "#1e40af",
              }}
            >
              Mark read
            </button>
          )}
          {notif.type === "booking" && notif.refId && (
            <Link
              to="/admin/bookings"
              style={{
                padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: `${T.accent}12`, border: `1px solid ${T.line}`,
                color: T.accent, textDecoration: "none", display: "inline-flex", alignItems: "center"
              }}
            >
              View booking
            </Link>
          )}
          <button
            onClick={() => onDelete(notif.id)}
            style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: "#fee2e2", border: "1px solid #fecaca", color: "#dc2626",
              display: "inline-flex", alignItems: "center", gap: 4
            }}
          >
            <FiTrash2 size={12} /> Delete
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ color: T.ink, fontSize: 24, fontWeight: 800, margin: 0, fontFamily: "Fraunces, Georgia, serif" }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginLeft: 10, background: "#ef4444", color: "#fff",
                borderRadius: 12, padding: "2px 8px", fontSize: 13, fontWeight: 700,
              }}>{unreadCount}</span>
            )}
          </h1>
          <p style={{ color: T.stone, fontSize: 14, margin: "4px 0 0" }}>
            {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: T.accent, border: "none", color: "#fff",
              display: "inline-flex", alignItems: "center", gap: 6
            }}
          >
            <FiCheckSquare /> Mark all read
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
              border: filter === f ? `2px solid ${T.accent}` : `2px solid ${T.line}`,
              background: filter === f ? `${T.accent}12` : "#fff",
              color: filter === f ? T.accent : T.stone,
              textTransform: "capitalize",
              transition: "all 0.15s"
            }}
          >
            {f === "unread" ? `Unread (${unreadCount})` : "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: T.stone }}>Loading...</div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ color: T.stone, fontSize: 40, marginBottom: 12 }}><FiBell /></div>
          <p style={{ color: T.stone, fontSize: 15 }}>
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
