import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "");
const TOKEN = () => localStorage.getItem("havi_admin_token");

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_CFG = {
  pending:   { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b", border: "rgba(245,158,11,0.3)",  label: "Pending",   icon: "⏳" },
  verified:  { bg: "rgba(59,130,246,0.12)",   text: "#60a5fa", border: "rgba(59,130,246,0.3)",   label: "Verified",  icon: "📞" },
  confirmed: { bg: "rgba(34,197,94,0.12)",    text: "#4ade80", border: "rgba(34,197,94,0.3)",    label: "Confirmed", icon: "✅" },
  completed: { bg: "rgba(168,85,247,0.12)",   text: "#c084fc", border: "rgba(168,85,247,0.3)",   label: "Completed", icon: "🎉" },
  cancelled: { bg: "rgba(239,68,68,0.12)",    text: "#f87171", border: "rgba(239,68,68,0.3)",    label: "Cancelled", icon: "❌" },
};

const MEETING_LABELS = {
  free_consultation: "Free Consultation",
  site_visit:        "Site Visit",
  design_review:     "Design Review",
  project_kickoff:   "Project Kickoff",
};

const MEETING_ICONS = {
  free_consultation: "☕",
  site_visit:        "🏗️",
  design_review:     "🎨",
  project_kickoff:   "🚀",
};

const STATUS_LIST = ["pending", "verified", "confirmed", "completed", "cancelled"];

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]} ${dt.getFullYear()}`;
}
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function fmtDateTime(d) {
  if (!d) return "—";
  return `${fmtDate(d)} ${fmtTime(d)}`;
}

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {c.icon} {c.label}
    </span>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function BookingDetailDrawer({ booking, onClose, onUpdate }) {
  const [status, setStatus] = useState(booking.status);
  const [adminNote, setAdminNote] = useState(booking.adminNote || "");
  const [confirmedNote, setConfirmedNote] = useState(booking.confirmedNote || "");
  const [meetingLink, setMeetingLink] = useState(booking.meetingLink || "");
  const [siteAddress, setSiteAddress] = useState(booking.siteAddress || "");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [tab, setTab] = useState("details");

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ status, adminNote, confirmedNote, meetingLink, siteAddress }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data);
      }
    } finally {
      setSaving(false);
    }
  };

  const verifyPhone = async () => {
    setVerifying(true);
    try {
      const res = await fetch(`${API}/api/bookings/${booking.id}/verify`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus("verified");
        onUpdate(data);
      }
    } finally {
      setVerifying(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f5f0ea", outline: "none", boxSizing: "border-box",
  };

  const labelStyle = { fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 5 };
  const fieldStyle = { marginBottom: 14 };
  const gold = "#c8a96e";

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 100vw)",
      background: "linear-gradient(160deg,#16140e 0%,#0e0c08 100%)",
      borderLeft: "1px solid rgba(200,169,110,0.15)",
      zIndex: 300, display: "flex", flexDirection: "column",
      boxShadow: "-20px 0 60px rgba(0,0,0,0.4)",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 16, color: gold, letterSpacing: 2 }}>{booking.bookingRef}</span>
              <StatusBadge status={status} />
            </div>
            <div style={{ color: "#f5f0ea", fontWeight: 700, fontSize: 18 }}>{booking.name}</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>
              {MEETING_ICONS[booking.meetingType]} {MEETING_LABELS[booking.meetingType] || booking.meetingType}
              {" · "}{fmtDate(booking.date)} at {booking.timeSlot}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 18 }}>×</button>
        </div>

        {/* Verify button */}
        {booking.status === "pending" && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={verifyPhone} disabled={verifying}
            style={{
              width: "100%", marginTop: 14, padding: "10px 0",
              background: "linear-gradient(135deg,rgba(59,130,246,0.8),rgba(37,99,235,0.8))",
              border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
            {verifying ? "Verifying…" : "📞 Mark as Phone Verified"}
          </motion.button>
        )}
        {booking.verifiedAt && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#60a5fa", background: "rgba(59,130,246,0.08)", borderRadius: 8, padding: "6px 12px" }}>
            📞 Verified on {fmtDateTime(booking.verifiedAt)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        {[["details", "📋 Details"], ["client", "👤 Client"], ["manage", "⚙️ Manage"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              flex: 1, padding: "12px 8px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: "transparent", color: tab === id ? gold : "rgba(255,255,255,0.35)",
              borderBottom: tab === id ? `2px solid ${gold}` : "2px solid transparent",
              transition: "all 0.15s",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
        <AnimatePresence mode="wait">

          {/* ── Details Tab ── */}
          {tab === "details" && (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <InfoRow label="Meeting Type" value={`${MEETING_ICONS[booking.meetingType]} ${MEETING_LABELS[booking.meetingType] || booking.meetingType}`} />
              <InfoRow label="Date & Time" value={`${fmtDate(booking.date)} at ${booking.timeSlot}`} />
              <InfoRow label="Status" value={<StatusBadge status={status} />} />
              {booking.siteAddress && <InfoRow label="Site Address 📍" value={booking.siteAddress} highlight />}
              {booking.meetingLink && <InfoRow label="Meeting Link 🔗" value={<a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", wordBreak: "break-all" }}>{booking.meetingLink}</a>} />}
              <InfoRow label="Budget Range" value={booking.budget || "Not specified"} />
              {booking.services?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={labelStyle}>Services Interested</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {booking.services.map(s => (
                      <span key={s} style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: gold }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {booking.projectDescription && (
                <div style={{ marginBottom: 14 }}>
                  <div style={labelStyle}>Project Description</div>
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px", color: "rgba(245,240,234,0.75)", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                    {booking.projectDescription}
                  </div>
                </div>
              )}
              {booking.message && <InfoRow label="Additional Message" value={booking.message} />}
              <InfoRow label="Submitted At" value={fmtDateTime(booking.createdAt)} />
              <InfoRow label="Last Updated" value={fmtDateTime(booking.updatedAt)} />
            </motion.div>
          )}

          {/* ── Client Tab ── */}
          {tab === "client" && (
            <motion.div key="client" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <InfoRow label="Full Name" value={booking.name} />
              <InfoRow label="Email Address" value={<a href={`mailto:${booking.email}`} style={{ color: "#60a5fa" }}>{booking.email}</a>} />
              <InfoRow label="Phone Number" value={<a href={`tel:${booking.phone}`} style={{ color: "#4ade80" }}>{booking.phone || "—"}</a>} />
              <InfoRow label="City / Neighborhood" value={booking.city || "Not provided"} />
              <InfoRow label="Primary Service" value={booking.service || "—"} />
              {booking.siteAddress && <InfoRow label="Site Address" value={booking.siteAddress} highlight />}
              <InfoRow label="Budget Range" value={booking.budget || "Not specified"} />

              {/* Quick action buttons */}
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                <a href={`tel:${booking.phone}`} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "11px 14px", color: "#4ade80", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                  📞 Call {booking.name?.split(" ")[0] || "Client"}
                </a>
                <a href={`mailto:${booking.email}?subject=Your HAVI'S DESIGN Booking (${booking.bookingRef})`} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "11px 14px", color: "#60a5fa", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                  ✉️ Email {booking.name?.split(" ")[0] || "Client"}
                </a>
              </div>
            </motion.div>
          )}

          {/* ── Manage Tab ── */}
          {tab === "manage" && (
            <motion.div key="manage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Booking Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                  {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>)}
                </select>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Meeting Link / Zoom URL (shown to client after verification)</label>
                <input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." style={inputStyle} />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Site Address (update if needed)</label>
                <input value={siteAddress} onChange={e => setSiteAddress(e.target.value)} placeholder="Full address for site visit" style={inputStyle} />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>✅ Confirmed Note (shown to client on lookup — what to bring, instructions, etc.)</label>
                <textarea value={confirmedNote} onChange={e => setConfirmedNote(e.target.value)}
                  placeholder="e.g. 'Please bring floor plans and any inspiration images. Our designer will meet you in the lobby at 9:00 AM. Parking is available underground.'"
                  rows={4} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14, marginBottom: 14 }}>
                <label style={labelStyle}>🔒 Internal Admin Note (NOT shown to client)</label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  placeholder="Internal notes for your team — e.g. client seemed unsure about budget, recommend starting with design review…"
                  rows={3} style={{ ...inputStyle, resize: "vertical", borderColor: "rgba(168,85,247,0.2)" }} />
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={save} disabled={saving}
                style={{
                  width: "100%", padding: "13px 0",
                  background: "linear-gradient(135deg,#c8a96e,#a07840)", border: "none",
                  borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>
                {saving ? "Saving…" : "💾 Save Changes"}
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  const labelStyle = { fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 };
  return (
    <div style={{ marginBottom: 14, padding: highlight ? "10px 12px" : 0, background: highlight ? "rgba(200,169,110,0.06)" : "transparent", borderRadius: highlight ? 10 : 0, border: highlight ? "1px solid rgba(200,169,110,0.15)" : "none" }}>
      <div style={labelStyle}>{label}</div>
      <div style={{ color: "#f5f0ea", fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>{value || "—"}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BookingsManager() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);

  const LIMIT = 30;
  const gold = "#c8a96e";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterStatus) params.set("status", filterStatus);
      if (filterType) params.set("meetingType", filterType);
      if (search.trim()) params.set("search", search.trim());

      const [bRes, sRes] = await Promise.all([
        fetch(`${API}/api/bookings?${params}`, { headers: { Authorization: `Bearer ${TOKEN()}` } }),
        fetch(`${API}/api/bookings/stats/summary`, { headers: { Authorization: `Bearer ${TOKEN()}` } }),
      ]);
      if (bRes.ok) {
        const d = await bRes.json();
        setBookings(d.bookings || []);
        setTotal(d.total || 0);
      }
      if (sRes.ok) setStats(await sRes.json());
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType, search]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = (updated) => {
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
    if (selected?.id === updated.id) setSelected(updated);
  };

  const statCards = stats ? [
    { label: "Total", value: stats.total, color: "#c8a96e" },
    { label: "Pending", value: stats.pending, color: "#f59e0b" },
    { label: "Verified", value: stats.verified || 0, color: "#60a5fa" },
    { label: "Confirmed", value: stats.confirmed, color: "#4ade80" },
    { label: "Completed", value: stats.completed, color: "#c084fc" },
    { label: "Cancelled", value: stats.cancelled, color: "#f87171" },
  ] : [];

  const inputStyle = {
    padding: "9px 14px", borderRadius: 10, fontSize: 13,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f5f0ea", outline: "none",
  };

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1200, position: "relative" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#f5f0ea", fontWeight: 800, fontSize: 26, margin: 0, marginBottom: 4 }}>📅 Bookings Manager</h1>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, margin: 0 }}>Manage consultation requests, verify clients, and track meeting schedules.</p>
      </div>

      {/* Stats Row */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 24 }}>
          {statCards.map(card => (
            <motion.div key={card.label} whileHover={{ y: -2 }} style={{
              background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.07)`,
              borderRadius: 14, padding: "14px 16px",
            }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: card.color, fontVariantNumeric: "tabular-nums" }}>{card.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>{card.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="🔍 Search name, email, ref, phone…"
          style={{ ...inputStyle, flex: "1 1 200px", minWidth: 180 }}
        />
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={{ ...inputStyle, minWidth: 130 }}>
          <option value="">All Statuses</option>
          {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label}</option>)}
        </select>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} style={{ ...inputStyle, minWidth: 160 }}>
          <option value="">All Meeting Types</option>
          {Object.entries(MEETING_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button onClick={load} style={{ ...inputStyle, cursor: "pointer" }}>↻ Refresh</button>
      </div>

      {/* Table */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 140px 120px 130px 120px", gap: 0, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          {["Booking Ref", "Client", "Meeting Type", "Date & Time", "Status", "Action"].map(h => (
            <div key={h} style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.2)" }}>Loading bookings…</div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>No bookings found</div>
          </div>
        ) : (
          bookings.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              style={{
                display: "grid", gridTemplateColumns: "110px 1fr 140px 120px 130px 120px",
                gap: 0, padding: "13px 16px",
                borderBottom: i < bookings.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                background: selected?.id === b.id ? "rgba(200,169,110,0.05)" : "transparent",
                transition: "background 0.15s", cursor: "pointer",
              }}
              onClick={() => setSelected(b === selected ? null : b)}
              whileHover={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 12, color: gold, letterSpacing: 1, alignSelf: "center" }}>{b.bookingRef}</div>
              <div style={{ alignSelf: "center" }}>
                <div style={{ color: "#f5f0ea", fontWeight: 600, fontSize: 13 }}>{b.name}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 1 }}>{b.email}</div>
                {b.phone && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>{b.phone}</div>}
              </div>
              <div style={{ alignSelf: "center" }}>
                <div style={{ fontSize: 12, color: "rgba(245,240,234,0.7)", display: "flex", alignItems: "center", gap: 5 }}>
                  <span>{MEETING_ICONS[b.meetingType]}</span>
                  <span>{MEETING_LABELS[b.meetingType] || b.meetingType}</span>
                </div>
                {b.siteAddress && <div style={{ fontSize: 10, color: "rgba(200,169,110,0.6)", marginTop: 2 }}>📍 {b.siteAddress.slice(0, 30)}…</div>}
              </div>
              <div style={{ alignSelf: "center" }}>
                <div style={{ fontSize: 12, color: "rgba(245,240,234,0.8)", fontWeight: 600 }}>{fmtDate(b.date)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>at {b.timeSlot}</div>
              </div>
              <div style={{ alignSelf: "center" }}>
                <StatusBadge status={b.status} />
                {b.verifiedAt && <div style={{ fontSize: 10, color: "#60a5fa", marginTop: 3 }}>📞 Verified</div>}
              </div>
              <div style={{ alignSelf: "center" }}>
                <button onClick={e => { e.stopPropagation(); setSelected(b); }}
                  style={{
                    background: selected?.id === b.id ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${selected?.id === b.id ? "rgba(200,169,110,0.4)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                    color: selected?.id === b.id ? gold : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600,
                  }}>
                  {selected?.id === b.id ? "✓ Open" : "View →"}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 18, alignItems: "center" }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ ...inputStyle, cursor: "pointer", opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Page {page} of {Math.ceil(total / LIMIT)}</span>
          <button disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)} style={{ ...inputStyle, cursor: "pointer", opacity: page * LIMIT >= total ? 0.4 : 1 }}>Next →</button>
        </div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 299 }} />
            <motion.div initial={{ x: 100 }} animate={{ x: 0 }} exit={{ x: 100 }} transition={{ type: "spring", damping: 28, stiffness: 260 }}>
              <BookingDetailDrawer booking={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
