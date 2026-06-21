import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN = () => localStorage.getItem("havi_admin_token");

const STATUS_COLORS = {
  pending: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  confirmed: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(59,130,246,0.3)" },
  completed: { bg: "rgba(34,197,94,0.12)", text: "#4ade80", border: "rgba(34,197,94,0.3)" },
  cancelled: { bg: "rgba(239,68,68,0.12)", text: "#f87171", border: "rgba(239,68,68,0.3)" },
};

const STATUS_LIST = ["pending", "confirmed", "completed", "cancelled"];

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(d) {
  const date = new Date(d);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      textTransform: "capitalize",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.text }} />
      {status}
    </span>
  );
}

function BookingDrawer({ booking, onClose, onUpdate }) {
  const [status, setStatus] = useState(booking.status);
  const [note, setNote] = useState(booking.adminNote || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ status, adminNote: note }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        position: "fixed", right: 0, top: 0, bottom: 0, width: 420,
        background: "#111010", borderLeft: "1px solid rgba(255,255,255,0.08)",
        zIndex: 200, padding: 28, overflowY: "auto",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
        display: "flex", flexDirection: "column", gap: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "#f5f0ea", fontSize: 18, fontWeight: 800, margin: 0 }}>Booking Details</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(245,240,234,0.4)", cursor: "pointer", fontSize: 22 }}>✕</button>
      </div>

      {/* Info */}
      <div style={{ background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.15)", borderRadius: 14, padding: 18 }}>
        <Row label="Name" value={booking.name} />
        <Row label="Email" value={booking.email} />
        <Row label="Phone" value={booking.phone || "—"} />
        <Row label="Service" value={booking.service} />
        <Row label="Date" value={fmtDate(booking.date)} />
        <Row label="Time" value={booking.timeSlot} />
        <Row label="Submitted" value={fmtDate(booking.createdAt)} />
        {booking.message && <Row label="Message" value={booking.message} />}
      </div>

      {/* Status */}
      <div>
        <label style={{ color: "rgba(245,240,234,0.5)", fontSize: 12, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
          Update Status
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STATUS_LIST.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              style={{
                padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: "pointer", textTransform: "capitalize",
                border: status === s ? `2px solid ${STATUS_COLORS[s].text}` : "2px solid rgba(255,255,255,0.08)",
                background: status === s ? STATUS_COLORS[s].bg : "rgba(255,255,255,0.04)",
                color: status === s ? STATUS_COLORS[s].text : "rgba(245,240,234,0.5)",
                transition: "all 0.15s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Note */}
      <div>
        <label style={{ color: "rgba(245,240,234,0.5)", fontSize: 12, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
          Admin Note
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add private notes about this booking..."
          rows={4}
          style={{
            width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, padding: "12px 14px", color: "#f5f0ea", fontSize: 14,
            outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
          }}
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{
          width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
          background: "linear-gradient(135deg, #c8a96e, #a07840)",
          color: "#fff", fontWeight: 700, fontSize: 15, cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.7 : 1, marginTop: "auto",
        }}
      >
        {saving ? "Saving..." : "✓ Save Changes"}
      </button>
    </motion.div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
      <span style={{ color: "rgba(245,240,234,0.4)", fontSize: 13, minWidth: 70, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#e8e2da", fontSize: 13, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

const FILTER_OPTS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function BookingsManager() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PER_PAGE });
      if (filter) params.set("status", filter);
      const res = await fetch(`${API}/api/bookings?${params}`, {
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });
      const data = await res.json();
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = useCallback((updated) => {
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this booking permanently?")) return;
    await fetch(`${API}/api/bookings/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${TOKEN()}` },
    });
    setBookings(prev => prev.filter(b => b.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "#f5f0ea", fontSize: 24, fontWeight: 800, margin: 0 }}>Bookings</h1>
          <p style={{ color: "rgba(245,240,234,0.4)", fontSize: 14, margin: "4px 0 0" }}>{total} total bookings</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {FILTER_OPTS.map(f => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            style={{
              padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: filter === f.value ? "2px solid #c8a96e" : "2px solid rgba(255,255,255,0.08)",
              background: filter === f.value ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.04)",
              color: filter === f.value ? "#c8a96e" : "rgba(245,240,234,0.5)",
              transition: "all 0.15s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Client", "Service", "Date", "Time", "Status", "Submitted", ""].map(h => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "rgba(245,240,234,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "rgba(245,240,234,0.3)" }}>Loading bookings...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "rgba(245,240,234,0.2)" }}>No bookings found</td></tr>
              ) : bookings.map(b => (
                <motion.tr
                  key={b.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    background: selected?.id === b.id ? "rgba(200,169,110,0.06)" : "transparent",
                  }}
                  onClick={() => setSelected(b)}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ color: "#e8e2da", fontWeight: 600, fontSize: 14 }}>{b.name}</div>
                    <div style={{ color: "rgba(245,240,234,0.35)", fontSize: 12 }}>{b.email}</div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "rgba(245,240,234,0.6)", fontSize: 13 }}>{b.service}</td>
                  <td style={{ padding: "14px 16px", color: "rgba(245,240,234,0.6)", fontSize: 13, whiteSpace: "nowrap" }}>{fmtDate(b.date)}</td>
                  <td style={{ padding: "14px 16px", color: "rgba(245,240,234,0.6)", fontSize: 13 }}>{b.timeSlot}</td>
                  <td style={{ padding: "14px 16px" }}><StatusBadge status={b.status} /></td>
                  <td style={{ padding: "14px 16px", color: "rgba(245,240,234,0.35)", fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(b.createdAt)}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(b.id); }}
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "5px 10px", color: "#f87171", cursor: "pointer", fontSize: 12 }}
                    >
                      Delete
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > PER_PAGE && (
          <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8, justifyContent: "center" }}>
            {Array.from({ length: Math.ceil(total / PER_PAGE) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: p === page ? "2px solid #c8a96e" : "2px solid rgba(255,255,255,0.08)",
                  background: p === page ? "rgba(200,169,110,0.15)" : "transparent",
                  color: p === page ? "#c8a96e" : "rgba(245,240,234,0.4)",
                  cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}
              >{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 199 }}
            />
            <BookingDrawer booking={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
