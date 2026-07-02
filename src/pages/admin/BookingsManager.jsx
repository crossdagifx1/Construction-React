import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTimeSlot } from "../../components/booking/BookingModal";
import { 
  FiClock, FiPhoneCall, FiCheckCircle, FiAward, FiXCircle, 
  FiCoffee, FiMapPin, FiCompass, FiBriefcase, FiUser, 
  FiCalendar, FiMail, FiTrash2, FiSearch, FiRefreshCw,
  FiChevronLeft, FiChevronRight, FiEdit2, FiInfo, FiPlusSquare,
  FiFileText, FiSliders, FiLink, FiCheckSquare, FiPlus, FiAlertCircle, FiInbox
} from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "");
const TOKEN = () => localStorage.getItem("havi_admin_token");

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

const STATUS_CFG = {
  pending:   { bg: "#fef3c7", text: "#92400e", border: "#fde68a", label: "Pending",   icon: <FiClock size={12} style={{ display: "inline-block", verticalAlign: "middle" }} /> },
  verified:  { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe", label: "Verified",  icon: <FiPhoneCall size={12} style={{ display: "inline-block", verticalAlign: "middle" }} /> },
  confirmed: { bg: "#dcfce7", text: "#166534", border: "#bbf7d0", label: "Confirmed", icon: <FiCheckCircle size={12} style={{ display: "inline-block", verticalAlign: "middle" }} /> },
  completed: { bg: "#f3e8ff", text: "#6b21a8", border: "#e9d5ff", label: "Completed", icon: <FiAward size={12} style={{ display: "inline-block", verticalAlign: "middle" }} /> },
  cancelled: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca", label: "Cancelled", icon: <FiXCircle size={12} style={{ display: "inline-block", verticalAlign: "middle" }} /> },
};

const MEETING_LABELS = {
  free_consultation: "Free Consultation",
  site_visit:        "Site Visit",
  design_review:     "Design Review",
  project_kickoff:   "Project Kickoff",
};

const MEETING_ICONS = {
  free_consultation: <FiCoffee size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />,
  site_visit:        <FiMapPin size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />,
  design_review:     <FiCompass size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />,
  project_kickoff:   <FiBriefcase size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />,
};

const ALL_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "14:00", "15:00", "16:00", "17:00",
];

const STATUS_LIST = ["pending", "verified", "confirmed", "completed", "cancelled"];

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
      padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
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
  const [deleting, setDeleting] = useState(false);
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

  const deleteBooking = async () => {
    if (!window.confirm("Are you sure you want to permanently delete/unblock this booking?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/bookings/${booking.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });
      if (res.ok) {
        onClose();
        onUpdate(null, booking.id);
      }
    } finally {
      setDeleting(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
    background: T.paper, border: `1px solid ${T.line}`,
    color: T.ink, outline: "none", boxSizing: "border-box",
  };

  const labelStyle = { fontSize: 11, color: T.stone, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 5, fontWeight: 600 };
  const fieldStyle = { marginBottom: 14 };

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 100vw)",
      background: T.paper,
      borderLeft: `1px solid ${T.line}`,
      zIndex: 300, display: "flex", flexDirection: "column",
      boxShadow: "-20px 0 60px rgba(0,0,0,0.1)",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 22px", borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 16, color: T.accent, letterSpacing: 2 }}>{booking.bookingRef}</span>
              <StatusBadge status={status} />
            </div>
            <div style={{ color: T.ink, fontWeight: 700, fontSize: 18 }}>{booking.name}</div>
            <div style={{ color: T.stone, fontSize: 12, marginTop: 2 }}>
              {MEETING_LABELS[booking.meetingType] || booking.meetingType}
              {" · "}{fmtDate(booking.date)} at {booking.timeSlot}
            </div>
          </div>
          <button onClick={onClose} style={{ background: T.sand, border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: T.stone, fontSize: 18 }}>×</button>
        </div>

        {/* Verify button */}
        {booking.status === "pending" && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={verifyPhone} disabled={verifying}
            style={{
              width: "100%", marginTop: 14, padding: "10px 0",
              background: T.accent,
              border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
            {verifying ? "Verifying…" : "Mark as Phone Verified"}
          </motion.button>
        )}
        {booking.verifiedAt && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#1e40af", background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 8, padding: "6px 12px" }}>
            Verified on {fmtDateTime(booking.verifiedAt)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
        {[["details", "Details"], ["client", "Client"], ["manage", "Manage"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              flex: 1, padding: "12px 8px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: "transparent", color: tab === id ? T.accent : T.stone,
              borderBottom: tab === id ? `2px solid ${T.accent}` : "2px solid transparent",
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
              <InfoRow label="Meeting Type" value={<div style={{ display: "flex", alignItems: "center" }}>{MEETING_ICONS[booking.meetingType]} {MEETING_LABELS[booking.meetingType] || booking.meetingType}</div>} />
              <InfoRow label="Date & Time" value={`${fmtDate(booking.date)} at ${booking.timeSlot}`} />
              <InfoRow label="Status" value={<StatusBadge status={status} />} />
              {booking.siteAddress && <InfoRow label="Site Address" value={booking.siteAddress} highlight />}
              {booking.meetingLink && <InfoRow label="Meeting Link" value={<a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#1e40af", wordBreak: "break-all" }}>{booking.meetingLink}</a>} />}
              <InfoRow label="Budget Range" value={booking.budget || "Not specified"} />
              {booking.services?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={labelStyle}>Services Interested</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {booking.services.map(s => (
                      <span key={s} style={{ background: `${T.accent}15`, border: `1px solid ${T.line}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: T.accent, fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {booking.projectDescription && (
                <div style={{ marginBottom: 14 }}>
                  <div style={labelStyle}>Project Description</div>
                  <div style={{ background: T.sand, border: `1px solid ${T.line}`, borderRadius: 10, padding: "12px 14px", color: T.ink, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-line" }}>
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
              <InfoRow label="Email Address" value={<a href={`mailto:${booking.email}`} style={{ color: "#1e40af" }}>{booking.email}</a>} />
              <InfoRow label="Phone Number" value={<a href={`tel:${booking.phone}`} style={{ color: "#166534" }}>{booking.phone || "—"}</a>} />
              <InfoRow label="City / Neighborhood" value={booking.city || "Not provided"} />
              <InfoRow label="Primary Service" value={booking.service || "—"} />
              {booking.siteAddress && <InfoRow label="Site Address" value={booking.siteAddress} highlight />}
              <InfoRow label="Budget Range" value={booking.budget || "Not specified"} />
              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <a href={`tel:${booking.phone}`} style={{ flex: 1, textDecoration: "none", textAlign: "center", background: "#166534", color: "#fff", padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>Call Client</a>
                <a href={`mailto:${booking.email}`} style={{ flex: 1, textDecoration: "none", textAlign: "center", background: T.accent, color: "#fff", padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>Email Client</a>
              </div>
            </motion.div>
          )}

          {/* ── Manage Tab ── */}
          {tab === "manage" && (
            <motion.div key="manage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Status Select */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Booking Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                  {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label}</option>)}
                </select>
              </div>

              {/* Site Visit Address */}
              {booking.meetingType === "site_visit" && (
                <div style={fieldStyle}>
                  <label style={labelStyle}>Site Visit Address</label>
                  <input value={siteAddress} onChange={e => setSiteAddress(e.target.value)} style={inputStyle} />
                </div>
              )}

              {/* Meeting Link */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Meeting Link (Google Meet / Zoom)</label>
                <input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." style={inputStyle} />
              </div>

              {/* Confirmed Note (User Facing) */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Instructions for Client (Visible to User)</label>
                <textarea value={confirmedNote} onChange={e => setConfirmedNote(e.target.value)} placeholder="e.g. Please prepare your house blueprint..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              {/* Admin Notes */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Internal Admin Notes (Private)</label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Site notes, architectural preferences..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
                <button onClick={save} disabled={saving} style={{ width: "100%", background: T.accent, color: "#fff", padding: "11px 0", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {saving ? "Saving Changes…" : "Save Changes"}
                </button>
                <button onClick={deleteBooking} disabled={deleting} style={{ width: "100%", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.3)", color: "#dc2626", padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {deleting ? "Deleting…" : "Delete Booking"}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: T.stone, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3, fontWeight: 600 }}>{label}</div>
      <div style={{
        fontSize: 13.5, color: T.ink, fontWeight: 500,
        background: highlight ? `${T.accent}0f` : "transparent",
        padding: highlight ? "6px 10px" : "0",
        borderRadius: highlight ? 6 : 0,
      }}>{value}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BookingsManager() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState("list"); // "list" | "calendar"
  const [timeFormat, setTimeFormat] = useState("24hr"); // "24hr" | "12hr" | "ethiopian"

  // Calendar states
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalDay, setSelectedCalDay] = useState(today);
  const [dailyBookings, setDailyBookings] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [blockingSlot, setBlockingSlot] = useState(null);

  // List states
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [selected, setSelected] = useState(null);

  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: page.toString(),
        limit: LIMIT.toString(),
      });
      if (search) q.append("search", search);
      if (filterStatus) q.append("status", filterStatus);
      if (filterType) q.append("meetingType", filterType);

      // Main list fetch
      const res = await fetch(`${API}/api/bookings?${q.toString()}`, {
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        setTotal(data.total || 0);
      }

      // Summary stats fetch
      const statsRes = await fetch(`${API}/api/bookings/stats/summary`, {
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch {}
    setLoading(false);
  }, [page, search, filterStatus, filterType]);

  useEffect(() => {
    load();
  }, [load]);

  // Fetch daily bookings when Calendar Selected Day changes
  const fetchDailyBookings = useCallback(async (date) => {
    if (!date) return;
    setDailyLoading(true);
    const dateString = date.toISOString().split("T")[0];
    try {
      const res = await fetch(`${API}/api/bookings?from=${dateString}&to=${dateString}&limit=100`, {
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDailyBookings(data.bookings || []);
      }
    } catch {}
    setDailyLoading(false);
  }, []);

  useEffect(() => {
    if (viewMode === "calendar") {
      fetchDailyBookings(selectedCalDay);
    }
  }, [viewMode, selectedCalDay, fetchDailyBookings]);

  // Block a slot
  const handleBlockSlot = async (slot) => {
    setBlockingSlot(slot);
    const dateString = selectedCalDay.toISOString().split("T")[0];
    try {
      const res = await fetch(`${API}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Admin Blocked",
          email: "techadmin@havisdesign.sys",
          phone: "+251900000000",
          service: "Interior Design",
          meetingType: "free_consultation",
          date: selectedCalDay.toISOString(),
          timeSlot: slot,
          projectDescription: "Blocked / Reserved by Admin Dashboard",
          status: "confirmed"
        }),
      });
      if (res.ok) {
        await fetchDailyBookings(selectedCalDay);
        load();
      }
    } catch {}
    setBlockingSlot(null);
  };

  // Unblock a slot
  const handleUnblockSlot = async (id) => {
    if (!id) return;
    setBlockingSlot(id);
    try {
      const res = await fetch(`${API}/api/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });
      if (res.ok) {
        await fetchDailyBookings(selectedCalDay);
        load();
      }
    } catch {}
    setBlockingSlot(null);
  };

  const handleUpdate = (updatedBooking, deletedId) => {
    if (deletedId) {
      setBookings(prev => prev.filter(b => b.id !== deletedId));
      if (viewMode === "calendar") {
        fetchDailyBookings(selectedCalDay);
      }
      return;
    }
    setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    if (selected?.id === updatedBooking.id) {
      setSelected(updatedBooking);
    }
    if (viewMode === "calendar") {
      fetchDailyBookings(selectedCalDay);
    }
  };

  // Calendar math
  const viewYear = currentDate.getFullYear();
  const viewMonth = currentDate.getMonth();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysCount = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(viewYear, viewMonth - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const statCards = [
    { label: "Total Bookings", value: stats?.total || 0, color: T.accent },
    { label: "Pending",        value: stats?.pending || 0, color: "#d97706" },
    { label: "Verified",       value: stats?.verified || 0, color: "#1e40af" },
    { label: "Confirmed",      value: stats?.confirmed || 0, color: "#166534" },
    { label: "Completed",      value: stats?.completed || 0, color: "#6b21a8" },
    { label: "Cancelled",      value: stats?.cancelled || 0, color: "#dc2626" },
  ];

  const inputStyle = {
    padding: "9px 14px", borderRadius: 10, fontSize: 13,
    background: T.paper, border: `1px solid ${T.line}`,
    color: T.ink, outline: "none",
  };

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1200, position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ color: T.ink, fontWeight: 800, fontSize: 26, margin: "0 0 4px", fontFamily: "Fraunces, Georgia, serif" }}>Bookings Manager</h1>
          <p style={{ color: T.stone, fontSize: 14, margin: 0 }}>Manage consultation requests, verify clients, and reserve/block calendar schedules.</p>
        </div>

        {/* View Mode & Format Selectors */}
        <div style={{ display: "flex", gap: 10 }}>
          {/* Format selector */}
          <div style={{ display: "flex", background: T.sand, borderRadius: 10, padding: 3, border: `1px solid ${T.line}` }}>
            {[
              { id: "24hr", label: "24h" },
              { id: "12hr", label: "12h" },
              { id: "ethiopian", label: "ET Time" }
            ].map(fmt => (
              <button key={fmt.id} onClick={() => setTimeFormat(fmt.id)}
                style={{
                  padding: "6px 12px", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                  background: timeFormat === fmt.id ? T.accent : "transparent",
                  color: timeFormat === fmt.id ? "#fff" : T.stone,
                  transition: "all 0.12s"
                }}>
                {fmt.label}
              </button>
            ))}
          </div>

          {/* List vs Calendar Mode selector */}
          <div style={{ display: "flex", background: T.sand, borderRadius: 10, padding: 3, border: `1px solid ${T.line}` }}>
            {[
              { id: "list", label: "List View" },
              { id: "calendar", label: "Calendar View" }
            ].map(mode => (
              <button key={mode.id} onClick={() => setViewMode(mode.id)}
                style={{
                  padding: "6px 14px", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                  background: viewMode === mode.id ? T.accent : "transparent",
                  color: viewMode === mode.id ? "#fff" : T.stone,
                  transition: "all 0.12s"
                }}>
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
          {statCards.map(card => (
            <motion.div key={card.label} whileHover={{ y: -2 }} style={{
              background: "#fff", border: `1px solid ${T.line}`,
              borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 10px rgba(18,17,16,0.03)"
            }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: card.color, fontVariantNumeric: "tabular-nums" }}>{card.value}</div>
              <div style={{ fontSize: 11, color: T.stone, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2, fontWeight: 600 }}>{card.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── LIST VIEW MODE ── */}
      {viewMode === "list" && (
        <>
          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, email, ref, phone…"
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
            <button onClick={load} style={{ ...inputStyle, cursor: "pointer", background: T.sand, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <FiRefreshCw /> Refresh
            </button>
          </div>

          {/* Table */}
          <div style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(18,17,16,0.02)" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 140px 120px 130px 120px", gap: 0, padding: "10px 16px", borderBottom: `1px solid ${T.line}`, background: T.sand }}>
              {["Booking Ref", "Client", "Meeting Type", "Date & Time", "Status", "Action"].map(h => (
                <div key={h} style={{ fontSize: 10, color: T.stone, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{h}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: T.stone }}>Loading bookings…</div>
            ) : bookings.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12, color: T.stone }}><FiInbox /></div>
                <div style={{ color: T.stone, fontSize: 14 }}>No bookings found</div>
              </div>
            ) : (
              bookings.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  style={{
                    display: "grid", gridTemplateColumns: "110px 1fr 140px 120px 130px 120px",
                    gap: 0, padding: "13px 16px",
                    borderBottom: i < bookings.length - 1 ? `1px solid ${T.line}` : "none",
                    background: selected?.id === b.id ? `${T.accent}0a` : "transparent",
                    transition: "background 0.15s", cursor: "pointer",
                  }}
                  onClick={() => setSelected(b === selected ? null : b)}
                  whileHover={{ background: T.sand }}
                >
                  <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 12, color: T.accent, letterSpacing: 1, alignSelf: "center" }}>{b.bookingRef}</div>
                  <div style={{ alignSelf: "center" }}>
                    <div style={{ color: T.ink, fontWeight: 600, fontSize: 13 }}>{b.name}</div>
                    <div style={{ color: T.stone, fontSize: 11, marginTop: 1 }}>{b.email}</div>
                    {b.phone && <div style={{ color: T.stone, fontSize: 11 }}>{b.phone}</div>}
                  </div>
                  <div style={{ alignSelf: "center" }}>
                    <div style={{ fontSize: 12, color: T.ink, display: "flex", alignItems: "center", gap: 5 }}>
                      <span>{MEETING_ICONS[b.meetingType]}</span>
                      <span>{MEETING_LABELS[b.meetingType] || b.meetingType}</span>
                    </div>
                    {b.siteAddress && <div style={{ fontSize: 10, color: T.accent, marginTop: 2, display: "inline-flex", alignItems: "center", gap: 4 }}><FiMapPin size={10} /> {b.siteAddress.slice(0, 30)}…</div>}
                  </div>
                  <div style={{ alignSelf: "center" }}>
                    <div style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>{fmtDate(b.date)}</div>
                    <div style={{ fontSize: 11, color: T.stone }}>at {formatTimeSlot(b.timeSlot, timeFormat)}</div>
                  </div>
                  <div style={{ alignSelf: "center" }}>
                    <StatusBadge status={b.status} />
                    {b.verifiedAt && <div style={{ fontSize: 10, color: "#1e40af", marginTop: 3, fontWeight: 600 }}>Verified</div>}
                  </div>
                  <div style={{ alignSelf: "center" }}>
                    <button onClick={e => { e.stopPropagation(); setSelected(b); }}
                      style={{
                        background: selected?.id === b.id ? `${T.accent}22` : T.sand,
                        border: `1px solid ${selected?.id === b.id ? T.accent : T.line}`,
                        borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                        color: T.accent, fontSize: 12, fontWeight: 600,
                      }}>
                      {selected?.id === b.id ? "Open" : "View"}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 18, alignItems: "center" }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ ...inputStyle, cursor: "pointer", opacity: page === 1 ? 0.4 : 1, background: T.sand }}>← Prev</button>
              <span style={{ color: T.stone, fontSize: 13 }}>Page {page} of {Math.ceil(total / LIMIT)}</span>
              <button disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)} style={{ ...inputStyle, cursor: "pointer", opacity: page * LIMIT >= total ? 0.4 : 1, background: T.sand }}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ── CALENDAR VIEW MODE ── */}
      {viewMode === "calendar" && (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Month Calendar Grid */}
          <div style={{ flex: "1 1 400px", background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(18,17,16,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <button onClick={prevMonth} style={{ background: T.sand, border: `1px solid ${T.line}`, borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: T.ink }}>‹</button>
              <span style={{ color: T.ink, fontWeight: 800, fontSize: 16, fontFamily: "Fraunces, Georgia, serif" }}>{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={nextMonth} style={{ background: T.sand, border: `1px solid ${T.line}`, borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: T.ink }}>›</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
              {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, color: T.stone, fontWeight: 700, padding: "4px 0", letterSpacing: 0.5 }}>{d}</div>)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {Array(firstDayIndex).fill(null).map((_, i) => <div key={`e-${i}`} />)}
              {Array(daysCount).fill(null).map((_, i) => {
                const day = i + 1;
                const d = new Date(viewYear, viewMonth, day);
                const isSelected = selectedCalDay && d.toDateString() === selectedCalDay.toDateString();
                const isToday = d.toDateString() === today.toDateString();
                const isSun = d.getDay() === 0;

                return (
                  <button key={day} onClick={() => setSelectedCalDay(d)}
                    style={{
                      aspectRatio: "1/1", width: "100%", borderRadius: 10, cursor: "pointer",
                      border: `1.5px solid ${isSelected ? T.accent : isToday ? `${T.accent}33` : "transparent"}`,
                      background: isSelected ? T.accent : isToday ? `${T.accent}12` : isSun ? `${T.sand}66` : "transparent",
                      color: isSelected ? "#fff" : isSun ? T.stone : T.ink,
                      fontSize: 14, fontWeight: isSelected || isToday ? 700 : 500,
                      position: "relative",
                      transition: "all 0.12s",
                    }}>
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Schedule Slots */}
          <div style={{ flex: "1 1 340px", background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(18,17,16,0.02)" }}>
            <h3 style={{ color: T.ink, fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>
              Slots for {selectedCalDay.getDate()} {MONTHS_SHORT[selectedCalDay.getMonth()]} {selectedCalDay.getFullYear()}
            </h3>
            <p style={{ color: T.stone, fontSize: 12, margin: "0 0 16px" }}>Check booked sessions and block/unblock time slots.</p>

            {dailyLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: T.stone }}>Loading schedule…</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ALL_SLOTS.map(slot => {
                  const b = dailyBookings.find(x => x.timeSlot === slot && x.status !== "cancelled");
                  const displayTime = formatTimeSlot(slot, timeFormat);

                  if (b) {
                    const isBlocked = b.name === "Admin Blocked";
                    return (
                      <div key={slot} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 14px", border: `1.5px solid ${isBlocked ? "#fecaca" : T.line}`,
                        borderRadius: 12, background: isBlocked ? "#fee2e2" : T.sand,
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isBlocked ? "#dc2626" : T.ink }}>{displayTime}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.stone, marginTop: 2 }}>
                            {isBlocked ? "Blocked / Reserved" : b.name}
                          </div>
                          {!isBlocked && (
                            <div style={{ fontSize: 10, color: T.stone, marginTop: 2, display: "flex", alignItems: "center" }}>
                              {MEETING_ICONS[b.meetingType]} {MEETING_LABELS[b.meetingType]}
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 6 }}>
                          {isBlocked ? (
                            <button onClick={() => handleUnblockSlot(b.id)} disabled={blockingSlot === b.id}
                              style={{
                                background: "#dc2626", border: "none", borderRadius: 8, padding: "5px 12px",
                                color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
                              }}>
                              {blockingSlot === b.id ? "…" : "Unblock"}
                            </button>
                          ) : (
                            <button onClick={() => setSelected(b)}
                              style={{
                                background: T.paper, border: `1px solid ${T.line}`, borderRadius: 8, padding: "5px 12px",
                                color: T.accent, fontSize: 11, fontWeight: 700, cursor: "pointer",
                              }}>
                              Manage
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Free Slot
                  return (
                    <div key={slot} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", border: `1px solid ${T.line}`, borderRadius: 12, background: "#fff",
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{displayTime}</div>
                        <div style={{ fontSize: 11, color: "#166534", marginTop: 2, fontWeight: 600 }}>Available / Free</div>
                      </div>
                      <button onClick={() => handleBlockSlot(slot)} disabled={blockingSlot === slot}
                        style={{
                          background: T.sand, border: `1px solid ${T.line}`, borderRadius: 8, padding: "6px 12px",
                          color: T.stone, fontSize: 11, fontWeight: 700, cursor: "pointer",
                        }}>
                        {blockingSlot === slot ? "…" : "Block Time"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.15)", zIndex: 299 }} />
            <motion.div initial={{ x: 100 }} animate={{ x: 0 }} exit={{ x: 100 }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 300 }}>
              <BookingDetailDrawer booking={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
