import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FiMessageSquare, FiCpu, FiUser, FiTrash2 } from "react-icons/fi";

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
        background: isActive ? `${T.accent}12` : "#ffffff",
        border: `1px solid ${isActive ? T.accent : T.line}`,
        marginBottom: 8, transition: "all 0.15s",
        boxShadow: "0 2px 10px rgba(18,17,16,0.02)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #c8a96e, #7a5a30)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", flexShrink: 0,
          }}>
            <FiMessageSquare size={13} />
          </div>
          <span style={{ color: T.ink, fontSize: 13, fontWeight: 600 }}>
            Visitor #{session.id.slice(-6).toUpperCase()}
          </span>
        </div>
        <span style={{ color: T.stone, fontSize: 11 }}>{session._count?.messages} msgs</span>
      </div>
      {lastMsg && (
        <p style={{
          color: T.stone, fontSize: 12, margin: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          display: "flex", alignItems: "center", gap: 4
        }}>
          <span style={{ opacity: 0.6, flexShrink: 0 }}>
            {lastMsg.role === "assistant" ? <FiCpu size={11} /> : <FiUser size={11} />}
          </span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{lastMsg.content}</span>
        </p>
      )}
      <div style={{ color: T.stone, fontSize: 11, marginTop: 4, opacity: 0.6 }}>
        {fmtTime(session.updatedAt)}
      </div>
    </motion.div>
  );
}

function TranscriptView({ session }) {
  if (!session) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, padding: 40 }}>
      <div style={{ color: T.stone, fontSize: 40 }}><FiMessageSquare /></div>
      <p style={{ color: T.stone, fontSize: 14 }}>Select a session to view the transcript</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 10, background: T.paper }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: T.ink, fontWeight: 700 }}>Visitor #{session.id.slice(-6).toUpperCase()}</div>
          <div style={{ color: T.stone, fontSize: 12 }}>Session ID: {session.sessionId}</div>
        </div>
        <div style={{ color: T.stone, fontSize: 12 }}>{session.messages?.length} messages</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10, background: "#fff" }}>
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
              background: msg.role === "assistant" ? "linear-gradient(135deg, #c8a96e, #a07840)" : T.sand,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, flexShrink: 0, color: msg.role === "assistant" ? "#fff" : T.stone
            }}>
              {msg.role === "assistant" ? <FiCpu size={12} /> : <FiUser size={12} />}
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
                background: T.paper,
                border: `1px solid ${T.line}`,
                color: T.ink,
                borderBottomLeftRadius: 4,
              }),
            }}>
              {msg.content}
              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: msg.role === "user" ? "right" : "left" }}>
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
        <h1 style={{ color: T.ink, fontSize: 24, fontWeight: 800, margin: 0, fontFamily: "Fraunces, Georgia, serif" }}>Chat Logs</h1>
        <p style={{ color: T.stone, fontSize: 14, margin: "4px 0 0" }}>{total} total sessions from your AI chatbot</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 16, height: "calc(100vh - 200px)" }}>
        {/* Sessions list */}
        <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16, overflowY: "auto", scrollbarWidth: "thin" }}>
          {loading ? (
            <div style={{ color: T.stone, textAlign: "center", padding: 20 }}>Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div style={{ color: T.stone, textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}><FiMessageSquare /></div>
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
                  background: "#fee2e2", border: "1px solid #fecaca",
                  borderRadius: 6, padding: "4px 8px", color: "#dc2626",
                  cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center"
                }}
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>

        {/* Transcript */}
        <div style={{ background: "#ffffff", border: `1px solid ${T.line}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(18,17,16,0.02)" }}>
          {loadingSession ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <div style={{ color: T.stone, fontSize: 14 }}>Loading transcript...</div>
            </div>
          ) : (
            <TranscriptView session={activeSession} />
          )}
        </div>
      </div>
    </div>
  );
}
