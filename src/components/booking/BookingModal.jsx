import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBooking } from "./useBooking";
import QRCode from "qrcode";

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
  { value: "free_consultation", label: "Free Consultation", icon: "☕", desc: "30-min intro call to discuss your vision" },
  { value: "site_visit",        label: "Site Visit",        icon: "🏗️", desc: "Our team visits your location for assessment" },
  { value: "design_review",     label: "Design Review",    icon: "🎨", desc: "Review & refine your design concept" },
  { value: "project_kickoff",   label: "Project Kickoff",  icon: "🚀", desc: "Start your approved project formally" },
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
  pending:   { color: "#92400e", bg: "#fef3c7", border: "#fde68a", label: "Awaiting Verification", icon: "⏳" },
  verified:  { color: "#1e40af", bg: "#dbeafe", border: "#bfdbfe", label: "Verified",               icon: "📞" },
  confirmed: { color: "#166534", bg: "#dcfce7", border: "#bbf7d0", label: "Confirmed",              icon: "✅" },
  completed: { color: "#6b21a8", bg: "#f3e8ff", border: "#e9d5ff", label: "Completed",              icon: "🎉" },
  cancelled: { color: "#991b1b", bg: "#fee2e2", border: "#fecaca", label: "Cancelled",              icon: "❌" },
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
          <div style={{ display: "flex", background: T.sand, borderRadius: 6, padding: 2, marginBottom: 10, gap: 2, border: `1px solid ${T.line}` }}>
            {[
              { id: "24hr", label: "24h" },
              { id: "12hr", label: "12h" },
              { id: "ethiopian", label: "ET (እጅ)" }
            ].map(fmt => (
              <button
                key={fmt.id}
                onClick={() => setTimeFormat(fmt.id)}
                style={{
                  flex: 1, padding: "4px 2px", border: "none", borderRadius: 4, fontSize: 9, fontWeight: 700,
                  cursor: "pointer",
                  background: timeFormat === fmt.id ? T.accent : "transparent",
                  color: timeFormat === fmt.id ? "#fff" : T.stone,
                  transition: "all 0.12s"
                }}
              >
                {fmt.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ color: T.stone, fontSize: 13, padding: 16, textAlign: "center" }}>Loading…</div>
          ) : availability?.available?.length === 0 ? (
            <div style={{ color: "#991b1b", fontSize: 12, padding: "12px 0", lineHeight: 1.5 }}>No slots available. Pick another day.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(availability?.available || []).map(slot => {
                const isSel = selectedSlot === slot;
                return (
                  <motion.button key={slot} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => handleSlotClick(slot)}
                    style={{
                      width: "100%", padding: "10px 12px",
                      border: `${isSel ? 2 : 1}px solid ${isSel ? T.accent : T.line}`,
                      borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: isSel ? 700 : 500,
                      background: isSel ? T.accent : T.paper,
                      color: isSel ? "#fff" : T.ink,
                      transition: "all 0.12s",
                    }}>
                    {formatTimeSlot(slot, timeFormat)}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function BookingModal({ isOpen, onClose }) {
  const { availability, availabilityLoading, submitting, looking, error, lookupResult, fetchAvailability, submitBooking, lookupBooking, reset } = useBooking();

  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submittedBooking, setSubmittedBooking] = useState(null);
  const [timeFormat, setTimeFormat] = useState("24hr");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [lookupRef, setLookupRef] = useState("");
  const [lookupError, setLookupError] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", meetingType: "free_consultation", siteAddress: "", budget: "", services: [], projectDescription: "", service: "" });

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setStep(0); setSelectedDate(null); setSelectedSlot(null);
      setSubmittedBooking(null); setLookupRef(""); setLookupError(null);
      setQrCodeUrl("");
      setTimeFormat("24hr");
      setForm({ name: "", email: "", phone: "", city: "", meetingType: "free_consultation", siteAddress: "", budget: "", services: [], projectDescription: "", service: "" });
      reset();
    }, 300);
  }, [onClose, reset]);

  const toggleService = (s) => setForm(f => ({
    ...f,
    services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s],
    service: f.service || s,
  }));

  const goSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) return;
    const dateObj = selectedDate instanceof Date ? selectedDate : selectedDate?.date;
    try {
      const result = await submitBooking({ name: form.name, email: form.email, phone: form.phone, city: form.city, service: form.service || form.services[0] || "Interior Design", services: form.services, meetingType: form.meetingType, date: dateObj?.toISOString(), timeSlot: selectedSlot, siteAddress: form.siteAddress, budget: form.budget, projectDescription: form.projectDescription });
      setSubmittedBooking(result.booking);

      // Generate QR Code URL
      const qrDataUrl = await QRCode.toDataURL(result.booking.bookingRef, {
        width: 256,
        margin: 1,
        color: {
          dark: T.ink,
          light: "#ffffff",
        },
      });
      setQrCodeUrl(qrDataUrl);
      setStep(2);
    } catch (_) {}
  };

  const downloadBookingCard = () => {
    if (!submittedBooking) return;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 900;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = T.paper;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = T.line;
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Header Branding
    ctx.textAlign = "center";
    ctx.fillStyle = T.stone;
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("HAVI'S DESIGN", canvas.width / 2, 80);

    ctx.fillStyle = T.accent;
    ctx.font = "italic 32px Georgia, serif";
    ctx.fillText("Booking Confirmation", canvas.width / 2, 130);

    // Divider Line
    ctx.strokeStyle = T.line;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(40, 180);
    ctx.lineTo(canvas.width - 40, 180);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Booking Ref (Big and Bold)
    ctx.fillStyle = T.stone;
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("BOOKING ID", canvas.width / 2, 230);

    ctx.fillStyle = T.ink;
    ctx.font = "bold 42px monospace";
    ctx.fillText(submittedBooking.bookingRef, canvas.width / 2, 280);

    // Dotted Separator
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(40, 320);
    ctx.lineTo(canvas.width - 40, 320);
    ctx.stroke();
    ctx.setLineDash([]);

    // Client Info
    ctx.textAlign = "left";
    ctx.fillStyle = T.stone;
    ctx.font = "14px sans-serif";

    const drawField = (label, val, y) => {
      ctx.fillStyle = T.stone;
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(label.toUpperCase(), 60, y);
      ctx.fillStyle = T.ink;
      ctx.font = "600 18px sans-serif";
      ctx.fillText(val, 60, y + 24);
    };

    drawField("Client Name", submittedBooking.name || form.name, 370);
    drawField("Meeting Type", MEETING_LABELS[submittedBooking.meetingType] || "Consultation", 440);
    drawField("Date", fmtDate(submittedBooking.date), 510);
    drawField("Time Slot", formatTimeSlot(submittedBooking.timeSlot, timeFormat), 580);

    // Draw QR Code
    if (qrCodeUrl) {
      const qrImg = new Image();
      qrImg.src = qrCodeUrl;
      qrImg.onload = () => {
        // Draw centered QR Code
        const qrSize = 160;
        ctx.drawImage(qrImg, canvas.width - qrSize - 60, 370, qrSize, qrSize);

        // Footer note
        ctx.textAlign = "center";
        ctx.fillStyle = T.stone;
        ctx.font = "italic 13px sans-serif";
        ctx.fillText("Awaiting verification. We will call you within 2 hours.", canvas.width / 2, 780);

        ctx.fillStyle = T.accent;
        ctx.font = "bold 14px sans-serif";
        ctx.fillText("Thank you for choosing HAVI'S DESIGN", canvas.width / 2, 810);

        // Trigger Download
        const link = document.createElement("a");
        link.download = `havi-booking-${submittedBooking.bookingRef}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
    } else {
      // Trigger Download immediately if no QR code loaded
      const link = document.createElement("a");
      link.download = `havi-booking-${submittedBooking.bookingRef}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const handleLookup = async () => {
    if (!lookupRef.trim()) return;
    setLookupError(null);
    try { await lookupBooking(lookupRef); setStep(3); }
    catch (e) { setLookupError(e.message); }
  };

  useEffect(() => {
    if (selectedDate && typeof selectedDate === "object" && selectedDate.timeSlot) setSelectedSlot(selectedDate.timeSlot);
  }, [selectedDate]);

  if (!isOpen) return null;

  // Shared styles
  const inputStyle = {
    width: "100%", padding: "10px 13px", borderRadius: 8, fontSize: 13,
    background: T.paper, border: `1px solid ${T.line}`,
    color: T.ink, outline: "none", boxSizing: "border-box",
    fontFamily: "Inter, system-ui, sans-serif",
  };
  const labelStyle = { fontSize: 11, color: T.stone, display: "block", marginBottom: 5, fontWeight: 500, letterSpacing: 0.3 };
  const fieldRow = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(18,17,16,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => e.target === e.currentTarget && handleClose()}>

          <motion.div initial={{ y: 24, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 20, width: "100%", maxWidth: 740, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 64px rgba(18,17,16,0.18), 0 0 0 1px rgba(18,17,16,0.06)" }}>

            {/* Header */}
            <div style={{ padding: "22px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a" }} />
                  <span style={{ fontSize: 10, color: T.stone, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>HAVI'S DESIGN</span>
                </div>
                <h2 style={{ color: T.ink, fontWeight: 800, fontSize: 19, margin: 0, fontFamily: "Fraunces, Georgia, serif" }}>
                  {step === 0 && "Select a Date & Time"}
                  {step === 1 && "Your Meeting Details"}
                  {step === 2 && "Booking Submitted"}
                  {step === 3 && "Meeting Schedule"}
                </h2>
              </div>
              <button onClick={handleClose} style={{ background: T.sand, border: `1px solid ${T.line}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: T.stone, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <StepBar step={step} />
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px 28px" }}>
              <AnimatePresence mode="wait">

                {/* ── STEP 0: CALENDAR ── */}
                {step === 0 && (
                  <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
                    <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} availability={availability} fetchAvailability={fetchAvailability} loading={availabilityLoading} timeFormat={timeFormat} setTimeFormat={setTimeFormat} />

                    <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${T.line}`, paddingTop: 18 }}>
                      <div style={{ fontSize: 13, color: T.stone }}>
                        {selectedDate && selectedSlot
                          ? <span style={{ color: T.accent, fontWeight: 600 }}>📅 {fmtDate(selectedDate instanceof Date ? selectedDate : selectedDate.date)} · {formatTimeSlot(selectedSlot, timeFormat)}</span>
                          : "Select a date then a time slot"}
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => selectedDate && selectedSlot && setStep(1)}
                        disabled={!selectedDate || !selectedSlot}
                        style={{ background: selectedDate && selectedSlot ? T.accent : T.sand, border: "none", borderRadius: 10, padding: "11px 26px", color: selectedDate && selectedSlot ? "#fff" : T.stone, fontSize: 13, fontWeight: 700, cursor: selectedDate && selectedSlot ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
                        Continue →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 1: DETAILS ── */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
                    {/* Selected slot banner */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, background: `${T.accent}12`, border: `1px solid ${T.accent}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 18 }}>
                      <span style={{ fontSize: 16 }}>📅</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: T.accent, fontWeight: 700, fontSize: 13 }}>{fmtDate(selectedDate instanceof Date ? selectedDate : selectedDate?.date)}</div>
                        <div style={{ color: T.stone, fontSize: 11 }}>at {selectedSlot}</div>
                      </div>
                      <button onClick={() => setStep(0)} style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 6, padding: "3px 10px", color: T.stone, fontSize: 11, cursor: "pointer" }}>Change</button>
                    </div>

                    {/* Meeting type */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ ...labelStyle, textTransform: "uppercase", letterSpacing: 1, color: T.accent, fontWeight: 700 }}>Meeting Type</label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(148px,1fr))", gap: 8 }}>
                        {MEETING_TYPES.map(mt => (
                          <button key={mt.value} onClick={() => setForm(f => ({ ...f, meetingType: mt.value }))}
                            style={{ border: `${form.meetingType === mt.value ? 2 : 1}px solid ${form.meetingType === mt.value ? T.accent : T.line}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left", background: form.meetingType === mt.value ? `${T.accent}0f` : T.paper, transition: "all 0.12s" }}>
                            <div style={{ fontSize: 18, marginBottom: 4 }}>{mt.icon}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: form.meetingType === mt.value ? T.accent : T.ink }}>{mt.label}</div>
                            <div style={{ fontSize: 10, color: T.stone, lineHeight: 1.4, marginTop: 2 }}>{mt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Personal info */}
                    <div style={{ ...fieldRow, marginBottom: 10 }}>
                      <div><label style={labelStyle}>Full Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" style={inputStyle} /></div>
                      <div><label style={labelStyle}>Phone Number *</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+251 9XX XXX XXXX" style={inputStyle} /></div>
                    </div>
                    <div style={{ ...fieldRow, marginBottom: 10 }}>
                      <div><label style={labelStyle}>Email Address *</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" type="email" style={inputStyle} /></div>
                      <div><label style={labelStyle}>Neighborhood / City</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Bole, Addis Ababa" style={inputStyle} /></div>
                    </div>

                    {form.meetingType === "site_visit" && (
                      <div style={{ marginBottom: 10 }}>
                        <label style={labelStyle}>Site Address *</label>
                        <input value={form.siteAddress} onChange={e => setForm(f => ({ ...f, siteAddress: e.target.value }))} placeholder="Full address of the site to visit" style={inputStyle} />
                      </div>
                    )}

                    {/* Services */}
                    <div style={{ marginBottom: 10 }}>
                      <label style={labelStyle}>Services Interested In</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {SERVICES.map(s => (
                          <button key={s} onClick={() => toggleService(s)}
                            style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: `1px solid ${form.services.includes(s) ? T.accent : T.line}`, background: form.services.includes(s) ? `${T.accent}12` : T.paper, color: form.services.includes(s) ? T.accent : T.stone, fontWeight: form.services.includes(s) ? 600 : 400, transition: "all 0.12s" }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Budget */}
                    <div style={{ marginBottom: 10 }}>
                      <label style={labelStyle}>Budget Range</label>
                      <select value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                        <option value="">Select a range (optional)</option>
                        {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: 10 }}>
                      <label style={labelStyle}>Tell Us About Your Project</label>
                      <textarea value={form.projectDescription} onChange={e => setForm(f => ({ ...f, projectDescription: e.target.value }))} placeholder="Describe your space, goals, style preferences, timeline…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                    </div>

                    {error && <div style={{ color: "#991b1b", fontSize: 13, marginBottom: 10, padding: "10px 14px", background: "#fee2e2", borderRadius: 8, border: "1px solid #fecaca" }}>{error}</div>}

                    <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.line}`, paddingTop: 18 }}>
                      <button onClick={() => setStep(0)} style={{ background: T.sand, border: `1px solid ${T.line}`, borderRadius: 10, padding: "11px 18px", color: T.stone, fontSize: 13, cursor: "pointer" }}>← Back</button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={goSubmit} disabled={!form.name.trim() || !form.email.trim() || !form.phone.trim() || submitting}
                        style={{ flex: 1, background: T.accent, border: "none", borderRadius: 10, padding: "11px 0", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: (!form.name.trim() || !form.email.trim() || !form.phone.trim()) ? 0.5 : 1 }}>
                        {submitting ? "Submitting…" : "Submit Booking →"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 2: PENDING ── */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }}>
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 14, stiffness: 200 }} style={{ fontSize: 44, marginBottom: 8 }}>✅</motion.div>
                      <h3 style={{ color: T.ink, fontWeight: 800, fontSize: 20, marginBottom: 4, fontFamily: "Fraunces, Georgia, serif" }}>Booking Request Received!</h3>
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
                              ⏳ Awaiting Verification
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
                          📥 Download Card
                        </button>
                      </div>
                    </div>

                    {/* Call Notice Info */}
                    <div style={{ display: "flex", gap: 10, background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                      <div style={{ fontSize: 20, flexShrink: 0 }}>📞</div>
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
                          {looking ? "…" : "View →"}
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
                      <div style={{ fontSize: 28 }}>📅</div>
                      <div>
                        <div style={{ fontSize: 10, color: T.stone, textTransform: "uppercase", letterSpacing: 1 }}>Booking Reference</div>
                        <div style={{ color: T.accent, fontWeight: 900, fontSize: 20, letterSpacing: 3, fontFamily: "monospace" }}>{lookupResult.bookingRef}</div>
                      </div>
                      <div style={{ marginLeft: "auto" }}>
                        {(() => {
                          const cfg = STATUS_CONFIG[lookupResult.status] || STATUS_CONFIG.pending;
                          return <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>{cfg.icon} {cfg.label}</span>;
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
                        <div style={{ fontSize: 10, color: "#1e40af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>🔗 Meeting Link</div>
                        <a href={lookupResult.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#1e40af", fontSize: 13, wordBreak: "break-all" }}>{lookupResult.meetingLink}</a>
                      </div>
                    )}

                    {lookupResult.siteAddress && lookupResult.meetingType === "site_visit" && (
                      <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: "#166534", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>📍 Meeting Location</div>
                        <div style={{ color: "#14532d", fontSize: 13 }}>{lookupResult.siteAddress}</div>
                      </div>
                    )}

                    {lookupResult.confirmedNote && (
                      <div style={{ background: `${T.accent}0f`, border: `1px solid ${T.accent}33`, borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>📝 Instructions from HAVI'S DESIGN</div>
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
