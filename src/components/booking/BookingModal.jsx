import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBooking } from "./useBooking";
import QRCode from "qrcode";
import { 
  FiClock, FiPhoneCall, FiCheckCircle, FiAward, FiXCircle, 
  FiCoffee, FiMapPin, FiCompass, FiBriefcase,
  FiCalendar, FiFileText, FiLink, FiAlertCircle, FiDownload
} from "react-icons/fi";

// ── Design tokens (matches landing page) ─────────────────────────────────────
const T = {
  paper:  "#F6F3ED",
  sand:   "#EFE9DF",
  line:   "#E2DCD0",
  ink:    "#121110",
  stone:  "#6F6A62",
  accent: "#B98A4B",
  deep:   "#8C6635",
};

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const MEETING_TYPES = [
  { value: "free_consultation", label: "Free Consultation", icon: <FiCoffee size={18} style={{ display: "inline-block", verticalAlign: "middle" }} />, desc: "30-min intro call to discuss your vision" },
  { value: "site_visit",        label: "Site Visit",        icon: <FiMapPin size={18} style={{ display: "inline-block", verticalAlign: "middle" }} />, desc: "Our team visits your location for assessment" },
  { value: "design_review",     label: "Design Review",     icon: <FiCompass size={18} style={{ display: "inline-block", verticalAlign: "middle" }} />, desc: "Review & refine your design concept" },
  { value: "project_kickoff",   label: "Project Kickoff",   icon: <FiBriefcase size={18} style={{ display: "inline-block", verticalAlign: "middle" }} />, desc: "Start your approved project formally" },
];

const SERVICES = ["Interior Design","Renovation","Office Design","Commercial Construction","Landscaping","Furniture Selection"];

const BUDGETS = [
  "Under ETB 30,000",
  "ETB 30,000 – 80,000",
  "ETB 80,000 – 200,000",
  "ETB 200,000 – 500,000",
  "Over ETB 500,000",
  "Not sure yet",
];

const STATUS_CONFIG = {
  pending:   { color: "#92400e", bg: "#fef3c7", border: "#fde68a", label: "Awaiting Verification", icon: <FiClock size={12} /> },
  verified:  { color: "#1e40af", bg: "#dbeafe", border: "#bfdbfe", label: "Verified",               icon: <FiPhoneCall size={12} /> },
  confirmed: { color: "#166534", bg: "#dcfce7", border: "#bbf7d0", label: "Confirmed",              icon: <FiCheckCircle size={12} /> },
  completed: { color: "#6b21a8", bg: "#f3e8ff", border: "#e9d5ff", label: "Completed",              icon: <FiAward size={12} /> },
  cancelled: { color: "#991b1b", bg: "#fee2e2", border: "#fecaca", label: "Cancelled",              icon: <FiXCircle size={12} /> },
};

const MEETING_LABELS = {
  free_consultation: "Free Consultation",
  site_visit:        "Site Visit",
  design_review:     "Design Review",
  project_kickoff:   "Project Kickoff",
};

function fmtDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatTimeSlot(slotStr, format) {
  if (!slotStr) return "";
  if (format === "24hr") return slotStr;
  
  const [hourStr, minStr] = slotStr.split(":");
  const h = parseInt(hourStr, 10);
  
  if (format === "12hr") {
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour.toString().padStart(2, '0')}:${minStr} ${ampm}`;
  }
  
  if (format === "ethiopian") {
    let ethHour = h >= 6 ? h - 6 : h + 6;
    if (ethHour === 0) ethHour = 12;
    
    let label = "";
    if (h >= 6 && h < 12) {
      label = "ጠዋት (morning)";
    } else if (h >= 12 && h < 18) {
      label = "ከሰዓት (afternoon)";
    } else if (h >= 18 && h < 24) {
      label = "ማታ (night)";
    } else {
      label = "ሌሊት (night)";
    }
    return `${ethHour}:${minStr} ${label}`;
  }
  return slotStr;
}

// ── Step Progress Bar ─────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ["Date & Time", "Your Details", "Submitted", "My Booking"];
  return (
    <div style={{ padding: "20px 28px 0" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700,
              background: i < step ? T.accent : i === step ? T.paper : T.sand,
              color: i < step ? "#fff" : i === step ? T.accent : T.stone,
              border: `2px solid ${i < step ? T.accent : i === step ? T.accent : T.line}`,
              transition: "all 0.3s",
            }}>
              {i < step ? "✓" : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1.5, background: i < step ? T.accent : T.line, transition: "background 0.4s" }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ fontSize: 10, color: i === step ? T.accent : T.stone, textAlign: "center", width: 70, lineHeight: 1.3, fontWeight: i === step ? 700 : 400, opacity: i > step ? 0.5 : 1 }}>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────
function Calendar({ selectedDate, onSelectDate, availability, fetchAvailability, loading, timeFormat, setTimeFormat }) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedSlot, setSelectedSlot] = useState(null);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); } else setViewMonth(m => m + 1); };

  const handleDayClick = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    if (d < today && d.toDateString() !== today.toDateString()) return;
    if (d.getDay() === 0) return;
    onSelectDate(d);
    setSelectedSlot(null);
    fetchAvailability(d.toISOString().split("T")[0]);
  };

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    onSelectDate(prev => ({ date: prev instanceof Date ? prev : prev?.date, timeSlot: slot }));
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    const d = selectedDate instanceof Date ? selectedDate : selectedDate?.date;
    if (!d) return false;
    return new Date(viewYear, viewMonth, day).toDateString() === d.toDateString();
  };

  const isPast  = (day) => { const d = new Date(viewYear, viewMonth, day); return d < today && d.toDateString() !== today.toDateString(); };
  const isSun   = (day) => new Date(viewYear, viewMonth, day).getDay() === 0;
  const isToday = (day) => new Date(viewYear, viewMonth, day).toDateString() === today.toDateString();

  const navBtn = { background: T.sand, border: `1px solid ${T.line}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: T.ink, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      {/* Calendar grid */}
      <div style={{ flex: "1 1 280px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={prevMonth} style={navBtn}>‹</button>
          <span style={{ color: T.ink, fontWeight: 700, fontSize: 14 }}>{MONTHS[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} style={navBtn}>›</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 6 }}>
          {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 9, color: T.stone, fontWeight: 700, padding: "3px 0", letterSpacing: 0.5 }}>{d}</div>)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
          {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1;
            const past = isPast(day);
            const sun  = isSun(day);
            const sel  = isSelected(day);
            const tod  = isToday(day);
            const disabled = past || sun;
            return (
              <button key={day} onClick={() => !disabled && handleDayClick(day)}
                style={{
                  width: "100%", aspectRatio: "1/1",
                  border: sel ? `2px solid ${T.accent}` : `1px solid ${tod ? T.accent : "transparent"}`,
                  borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
                  fontSize: 13, fontWeight: sel ? 700 : 400,
                  background: sel ? T.accent : tod ? `${T.accent}18` : "transparent",
                  color: sel ? "#fff" : disabled ? T.line : tod ? T.accent : T.ink,
                  transition: "all 0.12s",
                }}>
                {day}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 10, fontSize: 10, color: T.stone, textAlign: "center", opacity: 0.7 }}>
          Sundays closed · No past dates
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div style={{ flex: "1 1 140px", minWidth: 140 }}>
          <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            {fmtDate(selectedDate instanceof Date ? selectedDate : selectedDate?.date)}
          </div>

          {/* Time format selector */}
          <div style={{ display: "flex", background: T.sand, borderRadius: 8, padding: 2, marginBottom: 12, border: `1px solid ${T.line}` }}>
            {[
              { id: "24hr", label: "24h" },
              { id: "12hr", label: "12h" },
              { id: "ethiopian", label: "ET" }
            ].map(fmt => (
              <button key={fmt.id} onClick={() => setTimeFormat(fmt.id)}
                style={{
                  flex: 1, padding: "4px 0", border: "none", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer",
                  background: timeFormat === fmt.id ? T.accent : "transparent",
                  color: timeFormat === fmt.id ? "#fff" : T.stone,
                  transition: "all 0.12s"
                }}>
                {fmt.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ color: T.stone, fontSize: 12 }}>Loading availability…</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
              {availability.map(({ timeSlot, available }) => (
                <button key={timeSlot} disabled={!available} onClick={() => handleSlotClick(timeSlot)}
                  style={{
                    padding: "8px 12px", borderRadius: 8, border: `1px solid ${selectedSlot === timeSlot ? T.accent : T.line}`,
                    background: selectedSlot === timeSlot ? T.accent : available ? "#fff" : T.sand,
                    color: selectedSlot === timeSlot ? "#fff" : available ? T.ink : T.stone,
                    cursor: available ? "pointer" : "not-allowed",
                    fontSize: 12, fontWeight: 600,
                    opacity: available ? 1 : 0.4,
                    transition: "all 0.12s",
                  }}>
                  {formatTimeSlot(timeSlot, timeFormat)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Booking Modal ────────────────────────────────────────────────────────
export default function BookingModal({ isOpen, onClose }) {
  const {
    step, setStep, selectedDate, setSelectedDate, availability, fetchAvailability, loading,
    form, setForm, submitting, submittedBooking, submitError, submit,
    lookupRef, setLookupRef, lookupResult, setLookupResult, lookupError, setLookupError, looking, handleLookup
  } = useBooking();

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [timeFormat, setTimeFormat] = useState("12hr");

  useEffect(() => {
    if (step === 2 && submittedBooking?.bookingRef) {
      QRCode.toDataURL(submittedBooking.bookingRef, {
        margin: 1,
        color: { dark: "#121110", light: "#F6F3ED" }
      }).then(setQrCodeUrl).catch(console.error);
    }
  }, [step, submittedBooking]);

  const handleClose = () => {
    onClose();
    setStep(0);
    setSelectedDate(null);
    setForm({ name: "", email: "", phone: "", service: "Interior Design", meetingType: "free_consultation", budget: "Under ETB 30,000", message: "", services: [], projectDescription: "" });
    setLookupRef("");
    setLookupResult(null);
    setLookupError("");
    setQrCodeUrl("");
  };

  const downloadBookingCard = () => {
    if (!submittedBooking) return;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    // Draw background
    ctx.fillStyle = T.paper;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = T.accent;
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Draw branding header
    ctx.font = "bold 14px monospace";
    ctx.fillStyle = T.stone;
    ctx.textAlign = "center";
    ctx.fillText("HAVI'S DESIGN PASS", canvas.width / 2, 40);

    // Draw reference number
    ctx.font = "bold 36px monospace";
    ctx.fillStyle = T.accent;
    ctx.fillText(submittedBooking.bookingRef, canvas.width / 2, 85);

    // Draw separator dashed line
    ctx.beginPath();
    ctx.setLineDash([6, 6]);
    ctx.moveTo(30, 110);
    ctx.lineTo(canvas.width - 30, 110);
    ctx.strokeStyle = T.line;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Details Title & values
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = T.stone;

    const col1 = 50;
    const col2 = 300;

    // Row 1
    ctx.fillText("CLIENT NAME", col1, 140);
    ctx.fillText("MEETING TYPE", col2, 140);
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = T.ink;
    ctx.fillText(submittedBooking.name.toUpperCase(), col1, 165);
    ctx.fillText(MEETING_LABELS[submittedBooking.meetingType] || "Consultation", col2, 165);

    // Row 2
    ctx.font = "12px sans-serif";
    ctx.fillStyle = T.stone;
    ctx.fillText("DATE", col1, 210);
    ctx.fillText("TIME SLOT", col2, 210);
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = T.ink;
    ctx.fillText(fmtDate(submittedBooking.date), col1, 235);
    ctx.fillText(formatTimeSlot(submittedBooking.timeSlot, timeFormat), col2, 235);

    // Draw Status Alert banner
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "#92400e";
    ctx.fillRect(50, 270, 200, 32);
    ctx.fillStyle = "#fff";
    ctx.fillText("Awaiting Verification", 65, 291);

    // Draw QR Code onto canvas
    if (qrCodeUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 430, 135, 120, 120);
        ctx.font = "bold 9px sans-serif";
        ctx.fillStyle = T.stone;
        ctx.textAlign = "center";
        ctx.fillText("Scan to track schedule", 490, 275);

        // Download trigger
        const link = document.createElement("a");
        link.download = `HAVI-Booking-${submittedBooking.bookingRef}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
      img.src = qrCodeUrl;
    } else {
      // Fallback download if image load fails or not ready
      const link = document.createElement("a");
      link.download = `HAVI-Booking-${submittedBooking.bookingRef}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
    background: "#fff", border: `1px solid ${T.line}`,
    color: T.ink, outline: "none", transition: "all 0.15s", boxSizing: "border-box"
  };

  const selectStyle = {
    ...inputStyle, appearance: "none", cursor: "pointer",
    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='none' stroke='%236F6A62' stroke-width='2' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path d='M19 9l-7 7-7-7'></path></svg>")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", backgroundSize: "16px"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, background: "rgba(18,17,16,0.3)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            style={{ width: "100%", maxWidth: step === 0 ? 560 : 500, background: T.paper, borderRadius: 20, border: `1.5px solid ${T.line}`, display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden", boxShadow: "0 20px 50px rgba(18,17,16,0.15)" }}>
            
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 28px", borderBottom: `1.5px solid ${T.line}` }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.ink, fontFamily: "Fraunces, Georgia, serif" }}>
                  {step === 3 ? "Booking Status Tracker" : "Schedule a Consultation"}
                </h2>
              </div>
              <button onClick={handleClose} style={{ background: T.sand, border: "none", color: T.stone, fontSize: 18, width: 32, height: 32, borderRadius: 8, cursor: "pointer" }}>×</button>
            </div>

            {/* Step indicator */}
            {step < 3 && <StepBar step={step} />}

            {/* Step content */}
            <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
              <AnimatePresence mode="wait">

                {/* ── STEP 0: CALENDAR SELECT ── */}
                {step === 0 && (
                  <motion.div key="s0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ fontSize: 11, color: T.stone, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 5, fontWeight: 700 }}>Meeting Type</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {MEETING_TYPES.map(m => (
                          <button key={m.value} onClick={() => setForm(f => ({ ...f, meetingType: m.value }))}
                            style={{
                              textAlign: "left", padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                              background: form.meetingType === m.value ? `${T.accent}12` : "#fff",
                              border: `1.5px solid ${form.meetingType === m.value ? T.accent : T.line}`,
                              transition: "all 0.15s"
                            }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ color: form.meetingType === m.value ? T.accent : T.stone }}>{m.icon}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{m.label}</span>
                            </div>
                            <div style={{ fontSize: 11, color: T.stone, lineHeight: 1.3 }}>{m.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={{ fontSize: 11, color: T.stone, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 5, fontWeight: 700 }}>Select Date & Time</label>
                      <Calendar
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        availability={availability}
                        fetchAvailability={fetchAvailability}
                        loading={loading}
                        timeFormat={timeFormat}
                        setTimeFormat={setTimeFormat}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1.5px solid ${T.line}`, paddingTop: 16, alignItems: "center" }}>
                      {/* Lookup trigger link */}
                      <button onClick={() => setStep(2)} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
                        Already booked? Track status →
                      </button>
                      <button disabled={!selectedDate?.date || !selectedDate?.timeSlot} onClick={() => setStep(1)}
                        style={{
                          background: T.accent, border: "none", borderRadius: 8, padding: "10px 24px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: (selectedDate?.date && selectedDate?.timeSlot) ? "pointer" : "not-allowed", opacity: (selectedDate?.date && selectedDate?.timeSlot) ? 1 : 0.5
                        }}>
                        Continue
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 1: FORM DETAILS ── */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={{ fontSize: 11, color: T.stone, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4, fontWeight: 700 }}>Full Name</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: T.stone, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4, fontWeight: 700 }}>Phone Number</label>
                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+251912..." style={inputStyle} />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={{ fontSize: 11, color: T.stone, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4, fontWeight: 700 }}>Email Address</label>
                        <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: T.stone, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4, fontWeight: 700 }}>Service</label>
                        <select value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} style={selectStyle}>
                          {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, color: T.stone, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4, fontWeight: 700 }}>Budget (ETB)</label>
                      <select value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} style={selectStyle}>
                        {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>

                    <div style={{ marginBottom: 18 }}>
                      <label style={{ fontSize: 11, color: T.stone, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4, fontWeight: 700 }}>Project Details</label>
                      <textarea value={form.projectDescription} onChange={e => setForm(f => ({ ...f, projectDescription: e.target.value }))} placeholder="Describe your site details, measurements, or preferences..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                    </div>

                    {submitError && (
                      <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 12.5, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                        <FiAlertCircle /> {submitError}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1.5px solid ${T.line}`, paddingTop: 16 }}>
                      <button onClick={() => setStep(0)} style={{ background: T.sand, border: `1px solid ${T.line}`, borderRadius: 8, padding: "10px 20px", color: T.stone, fontSize: 13, cursor: "pointer" }}>Back</button>
                      <button disabled={submitting || !form.name.trim() || !form.phone.trim() || !form.email.trim()} onClick={submit}
                        style={{
                          background: T.accent, border: "none", borderRadius: 8, padding: "10px 24px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: (submitting || !form.name.trim() || !form.phone.trim() || !form.email.trim()) ? "not-allowed" : "pointer"
                        }}>
                        {submitting ? "Booking…" : "Request Appointment"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 2: VERIFICATION STAGE (TICKET/QR) ── */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", color: "#166534", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24 }}>
                        <FiCheckCircle />
                      </div>
                      <h3 style={{ margin: "0 0 4px", fontSize: 18, color: T.ink, fontFamily: "Fraunces, Georgia, serif" }}>Booking Registered!</h3>
                      <p style={{ color: T.stone, fontSize: 13, lineHeight: 1.5, maxWidth: 420, margin: "0 auto" }}>
                        Your request has been successfully registered. Save your booking card below.
                      </p>
                    </div>

                    {/* Premium Ticket Card */}
                    <div style={{
                      background: T.paper,
                      border: `1.5px solid ${T.line}`,
                      borderRadius: 16,
                      overflow: "hidden",
                      boxShadow: "0 8px 32px rgba(18,17,16,0.06)",
                      marginBottom: 16,
                    }}>
                      {/* Ticket Header */}
                      <div style={{
                        padding: "16px 20px",
                        borderBottom: `1px dashed ${T.line}`,
                        textAlign: "center",
                        background: `${T.accent}0a`,
                      }}>
                        <div style={{ fontSize: 9, color: T.stone, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 2 }}>HAVI'S DESIGN PASS</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: T.accent, letterSpacing: 2, fontFamily: "monospace" }}>
                          {submittedBooking?.bookingRef}
                        </div>
                      </div>

                      {/* Ticket Body */}
                      <div style={{ padding: 20, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                        {/* Details */}
                        <div style={{ flex: "1 1 200px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 9, color: T.stone, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Client</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{submittedBooking?.name || form.name}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: T.stone, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Meeting Type</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{MEETING_LABELS[submittedBooking?.meetingType] || "Consultation"}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: T.stone, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Date</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{fmtDate(submittedBooking?.date)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: T.stone, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Time Slot</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{formatTimeSlot(submittedBooking?.timeSlot, timeFormat)}</div>
                          </div>
                          <div style={{ gridColumn: "span 2" }}>
                            <div style={{ fontSize: 9, color: T.stone, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Status</div>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: "#fef3c7",
                              color: "#92400e",
                              border: "1px solid #fde68a",
                              borderRadius: 12,
                              padding: "2px 8px",
                              fontSize: 10,
                              fontWeight: 700
                            }}>
                              <FiClock size={10} style={{ marginRight: 2 }} /> Awaiting Verification
                            </span>
                          </div>
                        </div>

                        {/* QR Code */}
                        {qrCodeUrl && (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderLeft: `1px solid ${T.line}`, paddingLeft: 16, flex: "0 0 120px" }}>
                            <img src={qrCodeUrl} alt="QR Code" style={{ width: 90, height: 90, border: `1px solid ${T.line}`, borderRadius: 8, padding: 3, background: "#fff" }} />
                            <span style={{ fontSize: 8, color: T.stone, marginTop: 4, textAlign: "center" }}>Scan to track</span>
                          </div>
                        )}
                      </div>

                      {/* Download Action */}
                      <div style={{ padding: "0 20px 16px", display: "flex", justifyContent: "center" }}>
                        <button onClick={downloadBookingCard} style={{
                          background: T.accent,
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 16px",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          transition: "all 0.12s"
                        }}>
                          <FiDownload /> Download Card
                        </button>
                      </div>
                    </div>

                    {/* Call Notice Info */}
                    <div style={{ display: "flex", gap: 10, background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                      <div style={{ color: "#1e40af", fontSize: 20, flexShrink: 0 }}><FiPhoneCall /></div>
                      <div>
                        <div style={{ color: "#1e40af", fontWeight: 700, fontSize: 13, marginBottom: 2 }}>We'll Call You to Confirm</div>
                        <div style={{ color: "#1e3a8a", fontSize: 12, lineHeight: 1.5 }}>
                          Our team will call you on <strong>{submittedBooking?.phone || form.phone}</strong> within 2 hours to confirm your booking. Track your schedule using ID <strong style={{ fontFamily: "monospace" }}>{submittedBooking?.bookingRef}</strong>.
                        </div>
                      </div>
                    </div>

                    {/* Direct track lookup */}
                    <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 14 }}>
                      <div style={{ fontSize: 12, color: T.stone, marginBottom: 8, textAlign: "center" }}>Already verified? Look up details below:</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input value={lookupRef} onChange={e => setLookupRef(e.target.value.toUpperCase())} placeholder="e.g. HV-3K9XP" style={{ ...inputStyle, flex: 1, letterSpacing: 3, fontFamily: "monospace", fontWeight: 700 }} onKeyDown={e => e.key === "Enter" && handleLookup()} />
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={handleLookup} disabled={!lookupRef.trim() || looking}
                          style={{ background: T.accent, border: "none", borderRadius: 8, padding: "10px 18px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                          {looking ? "…" : "View"}
                        </motion.button>
                      </div>
                      {lookupError && <div style={{ color: "#991b1b", fontSize: 12, marginTop: 6 }}>{lookupError}</div>}
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 3: LOOKUP RESULT ── */}
                {step === 3 && lookupResult && (
                  <motion.div key="s3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }}>
                    {/* Ref header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, background: T.sand, border: `1px solid ${T.line}`, borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
                      <div style={{ color: T.accent, fontSize: 24 }}><FiCalendar /></div>
                      <div>
                        <div style={{ fontSize: 10, color: T.stone, textTransform: "uppercase", letterSpacing: 1 }}>Booking Reference</div>
                        <div style={{ color: T.accent, fontWeight: 900, fontSize: 20, letterSpacing: 3, fontFamily: "monospace" }}>{lookupResult.bookingRef}</div>
                      </div>
                      <div style={{ marginLeft: "auto" }}>
                        {(() => {
                          const cfg = STATUS_CONFIG[lookupResult.status] || STATUS_CONFIG.pending;
                          return (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>
                              {cfg.icon} {cfg.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Info grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      {[
                        { label: "Client Name",  value: lookupResult.name },
                        { label: "Meeting Type", value: MEETING_LABELS[lookupResult.meetingType] || lookupResult.meetingType },
                        { label: "Date",         value: fmtDate(lookupResult.date) },
                        { label: "Time",         value: formatTimeSlot(lookupResult.timeSlot, timeFormat) },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: T.sand, border: `1px solid ${T.line}`, borderRadius: 10, padding: "12px 14px" }}>
                          <div style={{ fontSize: 10, color: T.stone, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>{label}</div>
                          <div style={{ color: T.ink, fontWeight: 600, fontSize: 13 }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {lookupResult.meetingLink && (
                      <div style={{ background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: "#1e40af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}><FiLink /> Meeting Link</div>
                        <a href={lookupResult.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#1e40af", fontSize: 13, wordBreak: "break-all" }}>{lookupResult.meetingLink}</a>
                      </div>
                    )}

                    {lookupResult.siteAddress && lookupResult.meetingType === "site_visit" && (
                      <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: "#166534", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}><FiMapPin /> Meeting Location</div>
                        <div style={{ color: "#14532d", fontSize: 13 }}>{lookupResult.siteAddress}</div>
                      </div>
                    )}

                    {lookupResult.confirmedNote && (
                      <div style={{ background: `${T.accent}0f`, border: `1px solid ${T.accent}33`, borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}><FiFileText /> Instructions from HAVI'S DESIGN</div>
                        <div style={{ color: T.ink, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-line" }}>{lookupResult.confirmedNote}</div>
                      </div>
                    )}

                    <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 14, display: "flex", gap: 8 }}>
                      <button onClick={() => { setStep(2); setLookupRef(""); }} style={{ background: T.sand, border: `1px solid ${T.line}`, borderRadius: 8, padding: "10px 16px", color: T.stone, fontSize: 13, cursor: "pointer" }}>← Back</button>
                      <button onClick={handleClose} style={{ flex: 1, background: T.accent, border: "none", borderRadius: 8, padding: "10px 0", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Done ✓</button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
