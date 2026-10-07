import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";
import { FiMail, FiPhone, FiCornerUpLeft, FiTrash2, FiEye, FiEyeOff, FiAlertTriangle, FiCheckSquare } from "react-icons/fi";

const fmt = (iso) => {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch { return iso; }
};

const FILTERS = ["All", "Unread", "Read"];

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

function MessageCard({ m, onToggleRead, onDelete, isActive, onClick }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      style={{
        background: isActive ? `${T.accent}0d` : m.read ? "#ffffff" : "#fdfbf7",
        border: `1px solid ${isActive ? T.accent : m.read ? T.line : T.accent}`,
        borderRadius: 14, padding: "16px 18px", cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: "0 2px 10px rgba(18,17,16,0.02)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        {/* Left */}
        <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #c8a96e, #7a5a30)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 15,
          }}>
            {m.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ color: T.ink, fontWeight: m.read ? 500 : 700, fontSize: 14 }}>{m.name}</span>
              {!m.read && (
                <span style={{
                  background: "#3b82f6", borderRadius: 6, padding: "1px 7px",
                  fontSize: 10, color: "#fff", fontWeight: 700, letterSpacing: 0.5,
                }}>NEW</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
              <a href={`mailto:${m.email}`} onClick={e => e.stopPropagation()} style={{ color: T.accent, fontSize: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <FiMail size={12} /> {m.email}
              </a>
              {m.phone && (
                <a href={`tel:${m.phone}`} onClick={e => e.stopPropagation()} style={{ color: T.accent, fontSize: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <FiPhone size={12} /> {m.phone}
                </a>
              )}
            </div>
            <p style={{
              color: expanded ? T.ink : T.stone,
              fontSize: 13, margin: 0, lineHeight: 1.6,
              overflow: expanded ? "visible" : "hidden",
              textOverflow: expanded ? "unset" : "ellipsis",
              whiteSpace: expanded ? "pre-wrap" : "nowrap",
            }}>
              {m.message}
            </p>
            {m.message?.length > 100 && (
              <button
                onClick={e => { e.stopPropagation(); setExpanded(x => !x); }}
                style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 12, padding: "4px 0 0", fontFamily: "inherit", fontWeight: 600 }}
              >
                {expanded ? "Show less ↑" : "Read more ↓"}
              </button>
            )}
            <div style={{ color: T.stone, fontSize: 11, marginTop: 6, opacity: 0.6 }}>{fmt(m.createdAt)}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {/* Reply via email */}
          <a
            href={`mailto:${m.email}?subject=Re: Your enquiry to HAVI'S DESIGN&body=Hi ${m.name},%0A%0AThank you for reaching out to HAVI'S DESIGN!%0A%0A`}
            target="_blank"
            rel="noreferrer"
            title="Reply by email"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 34, height: 34, borderRadius: 8, fontSize: 14,
              background: `${T.accent}12`, border: `1px solid ${T.line}`,
              color: T.accent, textDecoration: "none",
            }}
          >
            <FiCornerUpLeft />
          </a>

          {/* Toggle read */}
          <button
            onClick={() => onToggleRead(m)}
            title={m.read ? "Mark unread" : "Mark read"}
            style={{
              width: 34, height: 34, borderRadius: 8, fontSize: 14,
              background: m.read ? "#fff" : "#dbeafe",
              border: `1px solid ${m.read ? T.line : "#bfdbfe"}`,
              color: m.read ? T.stone : "#1e40af",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            {m.read ? <FiEyeOff /> : <FiEye />}
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(m.id)}
            title="Delete"
            style={{
              width: 34, height: 34, borderRadius: 8, fontSize: 14,
              background: "#fee2e2", border: "1px solid #fecaca",
              color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [activeId, setActiveId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.listMessages();
      setMessages(Array.isArray(data) ? data : data.messages || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleRead = async (m) => {
    try {
      await api.markMessage(m.id, !m.read);
      setMessages(prev => prev.map(x => x.id === m.id ? { ...x, read: !m.read } : x));
    } catch (err) {
      console.error("Failed to mark message read status:", err);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this message permanently?")) return;
    try {
      await api.deleteMessage(id);
      setMessages(prev => prev.filter(x => x.id !== id));
      if (activeId === id) setActiveId(null);
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const filtered = messages.filter(m => {
    if (filter === "Unread") return !m.read;
    if (filter === "Read") return m.read;
    return true;
  });

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ color: T.ink, fontSize: 24, fontWeight: 800, margin: 0, fontFamily: "Fraunces, Georgia, serif" }}>
            Messages
            {unreadCount > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginLeft: 10, background: "#3b82f6", color: "#fff",
                borderRadius: 12, padding: "2px 8px", fontSize: 13, fontWeight: 700,
              }}>{unreadCount}</span>
            )}
          </h1>
          <p style={{ color: T.stone, fontSize: 14, margin: "4px 0 0" }}>
            Contact form enquiries from your website
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={async () => {
              await Promise.all(messages.filter(m => !m.read).map(m => api.markMessage(m.id, true)));
              setMessages(prev => prev.map(m => ({ ...m, read: true })));
            }}
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
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: filter === f ? `2px solid ${T.accent}` : `2px solid ${T.line}`,
              background: filter === f ? `${T.accent}12` : "#fff",
              color: filter === f ? T.accent : T.stone,
              transition: "all 0.15s"
            }}
          >
            {f}{f === "Unread" ? ` (${unreadCount})` : ""}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", color: "#dc2626", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <FiAlertTriangle /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: T.stone }}>Loading messages...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ color: T.stone, fontSize: 40, marginBottom: 10 }}><FiMail /></div>
          <p style={{ color: T.stone, fontSize: 15 }}>
            {filter !== "All" ? `No ${filter.toLowerCase()} messages` : "No messages yet"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <AnimatePresence>
            {filtered.map(m => (
              <MessageCard
                key={m.id}
                m={m}
                isActive={activeId === m.id}
                onClick={() => {
                  setActiveId(m.id === activeId ? null : m.id);
                  if (!m.read) toggleRead(m);
                }}
                onToggleRead={toggleRead}
                onDelete={remove}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Messages;
