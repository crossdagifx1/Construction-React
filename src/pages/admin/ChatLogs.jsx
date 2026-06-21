import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN = () => localStorage.getItem("havi_admin_token");

function fmtTime(d) {
  const date = new Date(d);
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function SessionCard({ session, onClick, isActive }) {
  const lastMsg = session.messages?.[0];
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      style={{
        padding: "14px 16px", cursor: "pointer", borderRadius: 12,
        background: isActive ? "rgba(200,169,110,0.1)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${isActive ? "rgba(200,169,110,0.35)" : "rgba(255,255,255,0.07)"}`,
        marginBottom: 8, transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #c8a96e, #7a5a30)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0,
          }}>
            💬
          </div>
          <span style={{ color: "#e8e2da", fontSize: 13, fontWeight: 600 }}>
            Visitor #{session.id.slice(-6).toUpperCase()}
          </span>
        </div>
        <span style={{ color: "rgba(245,240,234,0.3)", fontSize: 11 }}>{session._count?.messages} msgs</span>
      </div>
      {lastMsg && (
        <p style={{
          color: "rgba(245,240,234,0.4)", fontSize: 12, margin: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {lastMsg.role === "assistant" ? "🤖" : "👤"} {lastMsg.content.slice(0, 70)}
        </p>
      )}
      <div style={{ color: "rgba(245,240,234,0.2)", fontSize: 11, marginTop: 4 }}>
        {fmtTime(session.updatedAt)}
      </div>
    </motion.div>
  );
}

function TranscriptView({ session }) {
  if (!session) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
      <div style={{ fontSize: 48 }}>💬</div>
      <p style={{ color: "rgba(245,240,234,0.3)", fontSize: 14 }}>Select a session to view the transcript</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#f5f0ea", fontWeight: 700 }}>Visitor #{session.id.slice(-6).toUpperCase()}</div>
          <div style={{ color: "rgba(245,240,234,0.4)", fontSize: 12 }}>Session ID: {session.sessionId}</div>
        </div>
        <div style={{ color: "rgba(245,240,234,0.3)", fontSize: 12 }}>{session.messages?.length} messages</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10, scrollbarWidth: "thin", scrollbarColor: "rgba(200,169,110,0.2) transparent" }}>
        {session.messages?.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: msg.role === "assistant" ? "linear-gradient(135deg, #c8a96e, #a07840)" : "rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, flexShrink: 0,
            }}>
              {msg.role === "assistant" ? "🤖" : "👤"}
            </div>
            <div style={{
              maxWidth: "75%",
              padding: "10px 14px",
              borderRadius: 16,
              fontSize: 13,
              lineHeight: 1.55,
              ...(msg.role === "user" ? {
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                color: "#fff",
                borderBottomRightRadius: 4,
              } : {
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e8e2da",
                borderBottomLeftRadius: 4,
              }),
            }}>
              {msg.content}
              <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: msg.role === "user" ? "right" : "left" }}>
                {fmtTime(msg.createdAt)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function ChatLogs() {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/chat/sessions`, {
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });
      const data = await res.json();
      setSessions(data.sessions || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadSession = async (session) => {
    setLoadingSession(true);
    try {
      const res = await fetch(`${API}/api/chat/sessions/${session.id}`, {
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });
      const data = await res.json();
      setActiveSession(data);
    } finally {
      setLoadingSession(false);
    }
  };

  const deleteSession = async (id) => {
    if (!confirm("Delete this chat session permanently?")) return;
    await fetch(`${API}/api/chat/sessions/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${TOKEN()}` },
    });
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSession?.id === id) setActiveSession(null);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#f5f0ea", fontSize: 24, fontWeight: 800, margin: 0 }}>Chat Logs</h1>
        <p style={{ color: "rgba(245,240,234,0.4)", fontSize: 14, margin: "4px 0 0" }}>{total} total sessions from your AI chatbot</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 16, height: "calc(100vh - 200px)" }}>
        {/* Sessions list */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(200,169,110,0.2) transparent" }}>
          {loading ? (
            <div style={{ color: "rgba(245,240,234,0.3)", textAlign: "center", padding: 20 }}>Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div style={{ color: "rgba(245,240,234,0.2)", textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <p>No chat sessions yet</p>
            </div>
          ) : sessions.map(s => (
            <div key={s.id} style={{ position: "relative" }}>
              <SessionCard
                session={s}
                isActive={activeSession?.id === s.id}
                onClick={() => loadSession(s)}
              />
              <button
                onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                style={{
                  position: "absolute", top: 12, right: 12,
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 6, padding: "2px 8px", color: "#f87171",
                  cursor: "pointer", fontSize: 11, display: "none",
                }}
                className="delete-btn"
              >
                🗑
              </button>
            </div>
          ))}
        </div>

        {/* Transcript */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
          {loadingSession ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <div style={{ color: "rgba(245,240,234,0.3)", fontSize: 14 }}>Loading transcript...</div>
            </div>
          ) : (
            <TranscriptView session={activeSession} />
          )}
        </div>
      </div>
    </div>
  );
}
