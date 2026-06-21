import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";

const fmt = (iso) => {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch { return iso; }
};

const FILTERS = ["All", "Unread", "Read"];

function MessageCard({ m, onToggleRead, onDelete, isActive, onClick }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      style={{
        background: isActive ? "rgba(200,169,110,0.08)" : m.read ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${isActive ? "rgba(200,169,110,0.3)" : m.read ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 14, padding: "16px 18px", cursor: "pointer",
        transition: "all 0.15s",
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
              <span style={{ color: "#f5f0ea", fontWeight: m.read ? 500 : 700, fontSize: 14 }}>{m.name}</span>
              {!m.read && (
                <span style={{
                  background: "#3b82f6", borderRadius: 6, padding: "1px 7px",
                  fontSize: 10, color: "#fff", fontWeight: 700, letterSpacing: 0.5,
                }}>NEW</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
              <a href={`mailto:${m.email}`} onClick={e => e.stopPropagation()} style={{ color: "#c8a96e", fontSize: 12, textDecoration: "none" }}>
                ✉️ {m.email}
              </a>
              {m.phone && (
                <a href={`tel:${m.phone}`} onClick={e => e.stopPropagation()} style={{ color: "#c8a96e", fontSize: 12, textDecoration: "none" }}>
                  📞 {m.phone}
                </a>
              )}
            </div>
            <p style={{
              color: expanded ? "#e8e2da" : "rgba(245,240,234,0.5)",
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
                style={{ background: "none", border: "none", color: "#c8a96e", cursor: "pointer", fontSize: 12, padding: "4px 0 0", fontFamily: "inherit" }}
              >
                {expanded ? "Show less ↑" : "Read more ↓"}
              </button>
            )}
            <div style={{ color: "rgba(245,240,234,0.25)", fontSize: 11, marginTop: 6 }}>{fmt(m.createdAt)}</div>
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
              width: 34, height: 34, borderRadius: 8, fontSize: 15,
              background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.25)",
              textDecoration: "none",
            }}
          >
            ↩️
          </a>

          {/* Toggle read */}
          <button
            onClick={() => onToggleRead(m)}
            title={m.read ? "Mark unread" : "Mark read"}
            style={{
              width: 34, height: 34, borderRadius: 8, fontSize: 15,
              background: m.read ? "rgba(255,255,255,0.05)" : "rgba(59,130,246,0.1)",
              border: `1px solid ${m.read ? "rgba(255,255,255,0.1)" : "rgba(59,130,246,0.3)"}`,
              cursor: "pointer",
            }}
          >
            {m.read ? "📩" : "✓"}
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(m.id)}
            title="Delete"
            style={{
              width: 34, height: 34, borderRadius: 8, fontSize: 15,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              cursor: "pointer",
            }}
          >
            🗑
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
    } catch {}
  };

  const remove = async (id) => {
    if (!confirm("Delete this message permanently?")) return;
    try {
      await api.deleteMessage(id);
      setMessages(prev => prev.filter(x => x.id !== id));
      if (activeId === id) setActiveId(null);
    } catch {}
  };

  const filtered = messages.filter(m => {
    if (filter === "Unread") return !m.read;
    if (filter === "Read") return m.read;
    return true;
  });

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "#f5f0ea", fontSize: 24, fontWeight: 800, margin: 0 }}>
            Messages
            {unreadCount > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginLeft: 10, background: "#3b82f6", color: "#fff",
                borderRadius: 12, padding: "2px 8px", fontSize: 13, fontWeight: 700,
              }}>{unreadCount}</span>
            )}
          </h1>
          <p style={{ color: "rgba(245,240,234,0.4)", fontSize: 14, margin: "4px 0 0" }}>
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
              background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa",
            }}
          >
            ✓ Mark all read
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
              border: filter === f ? "2px solid #c8a96e" : "2px solid rgba(255,255,255,0.08)",
              background: filter === f ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.04)",
              color: filter === f ? "#c8a96e" : "rgba(245,240,234,0.5)",
            }}
          >
            {f}{f === "Unread" ? ` (${unreadCount})` : ""}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 16px", color: "#f87171", fontSize: 13, marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(245,240,234,0.3)" }}>Loading messages...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✉️</div>
          <p style={{ color: "rgba(245,240,234,0.3)", fontSize: 15 }}>
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
