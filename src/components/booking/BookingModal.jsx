import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBooking } from "./useBooking";

// ── Constants ────────────────────────────────────────────────────────────────
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const MEETING_TYPES = [
  { value: "free_consultation", label: "Free Consultation", icon: "☕", desc: "30-min intro call to discuss your vision" },
  { value: "site_visit", label: "Site Visit", icon: "🏗️", desc: "Our team visits your location for assessment" },
  { value: "design_review", label: "Design Review", icon: "🎨", desc: "Review & refine your design concept" },
  { value: "project_kickoff", label: "Project Kickoff", icon: "🚀", desc: "Start your approved project formally" },
];

const SERVICES = ["Interior Design", "Renovation", "Office Design", "Commercial Construction", "Landscaping", "Furniture Selection"];

const BUDGETS = [
  "Under ETB 30,000",
  "ETB 30,000 – 80,000",
  "ETB 80,000 – 200,000",
  "ETB 200,000 – 500,000",
  "Over ETB 500,000",
  "Not sure yet",
];

const STATUS_CONFIG = {
  pending:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "Awaiting Verification",  icon: "⏳" },
  verified:  { color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  label: "Verified",                icon: "📞" },
  confirmed: { color: "#22c55e", bg: "rgba(34,197,94,0.1)",   label: "Confirmed",               icon: "✅" },
  completed: { color: "#a855f7", bg: "rgba(168,85,247,0.1)",  label: "Completed",               icon: "🎉" },
  cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "Cancelled",               icon: "❌" },
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

// ── Step Progress Bar ─────────────────────────────────────────────────────────
function StepBar({ step, total = 4 }) {
  const steps = ["Date & Time", "Your Details", "Submitted", "Verification"];
  return (
    <div style={{ padding: "20px 28px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 8 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700,
              background: i < step ? "linear-gradient(135deg,#c8a96e,#a07840)" : i === step ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.06)",
              color: i < step ? "#fff" : i === step ? "#c8a96e" : "rgba(255,255,255,0.3)",
              border: i === step ? "2px solid #c8a96e" : "2px solid transparent",
              transition: "all 0.3s",
            }}>
              {i < step ? "✓" : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? "rgba(200,169,110,0.6)" : "rgba(255,255,255,0.07)", transition: "background 0.4s" }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {steps.map((s, i) => (
          <div key={s} style={{ fontSize: 10, color: i === step ? "#c8a96e" : "rgba(255,255,255,0.25)", textAlign: "center", width: 70, lineHeight: 1.2, fontWeight: i === step ? 600 : 400 }}>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Calendar Component ────────────────────────────────────────────────────────
function Calendar({ selectedDate, onSelectDate, availability, fetchAvailability, loading }) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedSlot, setSelectedSlot] = useState(null);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    if (d < today) return;
    if (d.getDay() === 0) return; // no Sundays
    const iso = d.toISOString().split("T")[0];
    onSelectDate(d);
    setSelectedSlot(null);
    fetchAvailability(iso);
  };

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    onSelectDate(prev => ({ date: prev, timeSlot: slot }));
  };

  const isToday = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    return d.toDateString() === today.toDateString();
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    const d = selectedDate instanceof Date ? selectedDate : selectedDate.date;
    if (!d) return false;
    const check = new Date(viewYear, viewMonth, day);
    return check.toDateString() === d.toDateString();
  };

  const isPast = (day) => new Date(viewYear, viewMonth, day) < today;
  const isSunday = (day) => new Date(viewYear, viewMonth, day).getDay() === 0;

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {/* Calendar grid */}
      <div style={{ flex: "1 1 300px" }}>
        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <button onClick={prevMonth} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 16 }}>‹</button>
          <span style={{ color: "#f5f0ea", fontWeight: 700, fontSize: 15 }}>{MONTHS[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 16 }}>›</button>
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, padding: "4px 0" }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1;
            const past = isPast(day) && !isToday(day);
            const sun = isSunday(day);
            const sel = isSelected(day);
            const disabled = (past && !isToday(day)) || sun;
            return (
              <button
                key={day}
                onClick={() => !disabled && handleDayClick(day)}
                style={{
                  width: "100%", aspectRatio: "1/1", border: sel ? "2px solid #c8a96e" : "2px solid transparent",
                  borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: sel ? 700 : 400,
                  background: sel ? "linear-gradient(135deg,#c8a96e,#a07840)" : isToday(day) ? "rgba(200,169,110,0.12)" : "transparent",
                  color: sel ? "#fff" : disabled ? "rgba(255,255,255,0.18)" : isToday(day) ? "#c8a96e" : "rgba(245,240,234,0.8)",
                  transition: "all 0.15s",
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
          Sundays are closed • No past dates
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div style={{ flex: "1 1 160px", minWidth: 140 }}>
          <div style={{ fontSize: 12, color: "#c8a96e", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            {fmtDate(selectedDate instanceof Date ? selectedDate : selectedDate.date)}
          </div>
          {loading ? (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: 20 }}>Loading slots…</div>
          ) : availability?.available?.length === 0 ? (
            <div style={{ color: "#f87171", fontSize: 13, textAlign: "center", padding: 20 }}>No slots available. Pick another day.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(availability?.available || []).map(slot => {
                const isSel = selectedSlot === slot;
                return (
                  <motion.button
                    key={slot}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSlotClick(slot)}
                    style={{
                      width: "100%", padding: "11px 12px",
                      border: isSel ? "2px solid #c8a96e" : "2px solid rgba(255,255,255,0.1)",
                      borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: isSel ? 700 : 500,
                      background: isSel ? "linear-gradient(135deg,#c8a96e,#a07840)" : "rgba(255,255,255,0.04)",
                      color: isSel ? "#fff" : "rgba(245,240,234,0.8)",
                      transition: "all 0.15s",
                    }}
                  >
                    {slot}
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function BookingModal({ isOpen, onClose }) {
  const { availability, availabilityLoading, submitting, looking, error, lookupResult, fetchAvailability, submitBooking, lookupBooking, reset } = useBooking();

  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submittedBooking, setSubmittedBooking] = useState(null);
  const [lookupRef, setLookupRef] = useState("");
  const [lookupError, setLookupError] = useState(null);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", city: "",
    meetingType: "free_consultation",
    siteAddress: "",
    budget: "",
    services: [],
    projectDescription: "",
    service: "",
  });

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setStep(0); setSelectedDate(null); setSelectedSlot(null);
      setSubmittedBooking(null); setLookupRef(""); setLookupError(null);
      setForm({ name: "", email: "", phone: "", city: "", meetingType: "free_consultation", siteAddress: "", budget: "", services: [], projectDescription: "", service: "" });
      reset();
    }, 300);
  }, [onClose, reset]);

  const toggleService = (s) => setForm(f => ({
    ...f,
    services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s],
    service: f.services.includes(s) ? f.service : (f.service || s),
  }));

  const goStep1 = () => {
    if (!selectedDate || !selectedSlot) return;
    setStep(1);
  };

  const goSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) return;
    const dateObj = selectedDate instanceof Date ? selectedDate : selectedDate?.date;
    try {
      const result = await submitBooking({
        name: form.name, email: form.email, phone: form.phone, city: form.city,
        service: form.service || form.services[0] || "Interior Design",
        services: form.services,
        meetingType: form.meetingType,
        date: dateObj?.toISOString(),
        timeSlot: selectedSlot,
        siteAddress: form.siteAddress,
        budget: form.budget,
        projectDescription: form.projectDescription,
      });
      setSubmittedBooking(result.booking);
      setStep(2);
    } catch (_) {}
  };

  const handleLookup = async () => {
    if (!lookupRef.trim()) return;
    setLookupError(null);
    try {
      await lookupBooking(lookupRef);
      setStep(3);
    } catch (e) {
      setLookupError(e.message);
    }
  };

  // Sync slot selection from calendar
  useEffect(() => {
    if (selectedDate && typeof selectedDate === "object" && selectedDate.timeSlot) {
      setSelectedSlot(selectedDate.timeSlot);
    }
  }, [selectedDate]);

  if (!isOpen) return null;

  const overlayStyle = {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(10,10,15,0.85)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "16px",
  };

  const modalStyle = {
    background: "linear-gradient(160deg,#1a1812 0%,#141008 100%)",
    border: "1px solid rgba(200,169,110,0.2)", borderRadius: 24,
    width: "100%", maxWidth: 760, maxHeight: "90vh",
    overflow: "hidden", display: "flex", flexDirection: "column",
    boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,169,110,0.08)",
  };

  const gold = "#c8a96e";
  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f5f0ea", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={overlayStyle} onClick={e => e.target === e.currentTarget && handleClose()}>
          <motion.div initial={{ y: 30, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.97 }} transition={{ type: "spring", damping: 28, stiffness: 280 }} style={modalStyle}>

            {/* Header */}
            <div style={{ padding: "22px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
                  <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>HAVI'S DESIGN</span>
                </div>
                <h2 style={{ color: "#f5f0ea", fontWeight: 800, fontSize: 20, margin: 0 }}>
                  {step === 0 && "Select a Date & Time"}
                  {step === 1 && "Your Meeting Details"}
                  {step === 2 && "Booking Submitted!"}
                  {step === 3 && "Meeting Schedule"}
                </h2>
              </div>
              <button onClick={handleClose} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            {/* Step progress */}
            <StepBar step={step} />

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px 28px" }}>
              <AnimatePresence mode="wait">

                {/* ── STEP 0: CALENDAR ── */}
                {step === 0 && (
                  <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                    <Calendar
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                      availability={availability}
                      fetchAvailability={fetchAvailability}
                      loading={availabilityLoading}
                    />

                    <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20 }}>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginRight: "auto" }}>
                        {selectedDate && selectedSlot ? (
                          <span style={{ color: gold }}>📅 {fmtDate(selectedDate instanceof Date ? selectedDate : selectedDate.date)} · {selectedSlot}</span>
                        ) : "Select date then time slot"}
                      </div>
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={goStep1}
                        disabled={!selectedDate || !selectedSlot}
                        style={{
                          background: selectedDate && selectedSlot ? "linear-gradient(135deg,#c8a96e,#a07840)" : "rgba(255,255,255,0.07)",
                          border: "none", borderRadius: 12, padding: "12px 28px",
                          color: selectedDate && selectedSlot ? "#fff" : "rgba(255,255,255,0.3)",
                          fontSize: 14, fontWeight: 700, cursor: selectedDate && selectedSlot ? "pointer" : "not-allowed",
                          transition: "all 0.2s",
                        }}>
                        Continue →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 1: DETAILS FORM ── */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                    {/* Appointment summary */}
                    <div style={{ background: "rgba(200,169,110,0.07)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
                      <span style={{ fontSize: 18 }}>📅</span>
                      <div>
                        <div style={{ color: gold, fontWeight: 700 }}>{fmtDate(selectedDate instanceof Date ? selectedDate : selectedDate.date)}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>at {selectedSlot}</div>
                      </div>
                      <button onClick={() => setStep(0)} style={{ marginLeft: "auto", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 10px", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>Change</button>
                    </div>

                    {/* Meeting type */}
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ fontSize: 12, color: gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 10 }}>Meeting Type</label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                        {MEETING_TYPES.map(mt => (
                          <button key={mt.value} onClick={() => setForm(f => ({ ...f, meetingType: mt.value }))}
                            style={{
                              border: form.meetingType === mt.value ? `2px solid ${gold}` : "2px solid rgba(255,255,255,0.08)",
                              borderRadius: 12, padding: "10px 12px", cursor: "pointer", textAlign: "left",
                              background: form.meetingType === mt.value ? "rgba(200,169,110,0.1)" : "rgba(255,255,255,0.03)",
                              transition: "all 0.15s",
                            }}>
                            <div style={{ fontSize: 18, marginBottom: 4 }}>{mt.icon}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: form.meetingType === mt.value ? gold : "rgba(245,240,234,0.8)" }}>{mt.label}</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.4, marginTop: 2 }}>{mt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Personal info */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 5 }}>Full Name *</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 5 }}>Phone Number *</label>
                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+251 9XX XXX XXXX" style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 5 }}>Email Address *</label>
                        <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" type="email" style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 5 }}>Neighborhood / City</label>
                        <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Bole, Addis Ababa" style={inputStyle} />
                      </div>
                    </div>

                    {/* Site address — only for site visit */}
                    {form.meetingType === "site_visit" && (
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 5 }}>Site Address *</label>
                        <input value={form.siteAddress} onChange={e => setForm(f => ({ ...f, siteAddress: e.target.value }))} placeholder="Full address of the site to visit" style={inputStyle} />
                      </div>
                    )}

                    {/* Services */}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>Services Interested In</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {SERVICES.map(s => (
                          <button key={s} onClick={() => toggleService(s)}
                            style={{
                              padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                              border: form.services.includes(s) ? `1.5px solid ${gold}` : "1.5px solid rgba(255,255,255,0.1)",
                              background: form.services.includes(s) ? "rgba(200,169,110,0.12)" : "transparent",
                              color: form.services.includes(s) ? gold : "rgba(255,255,255,0.4)",
                              transition: "all 0.15s",
                            }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Budget */}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 5 }}>Budget Range</label>
                      <select value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                        style={{ ...inputStyle, appearance: "none" }}>
                        <option value="">Select a range (optional)</option>
                        {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>

                    {/* Project description */}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 5 }}>Tell Us About Your Project</label>
                      <textarea value={form.projectDescription} onChange={e => setForm(f => ({ ...f, projectDescription: e.target.value }))}
                        placeholder="Describe your space, what you'd like to achieve, style preferences, timeline, or anything else we should know…"
                        rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                    </div>

                    {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 10 }}>{error}</div>}

                    <div style={{ display: "flex", gap: 10, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20 }}>
                      <button onClick={() => setStep(0)} style={{ flex: "0 0 auto", background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 12, padding: "12px 20px", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer" }}>← Back</button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={goSubmit}
                        disabled={!form.name.trim() || !form.email.trim() || !form.phone.trim() || submitting}
                        style={{
                          flex: 1, background: "linear-gradient(135deg,#c8a96e,#a07840)", border: "none",
                          borderRadius: 12, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                          opacity: (!form.name.trim() || !form.email.trim() || !form.phone.trim()) ? 0.5 : 1,
                        }}>
                        {submitting ? "Submitting…" : "Submit Booking →"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 2: PENDING / VERIFICATION ── */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    {/* Success banner */}
                    <div style={{ textAlign: "center", marginBottom: 28 }}>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200 }}
                        style={{ fontSize: 56, marginBottom: 12 }}>📋</motion.div>
                      <h3 style={{ color: "#f5f0ea", fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Booking Request Received!</h3>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }}>
                        Your request for <strong style={{ color: gold }}>{fmtDate(submittedBooking?.date)} at {submittedBooking?.timeSlot}</strong> has been submitted.
                      </p>
                    </div>

                    {/* Booking summary card */}
                    <div style={{ background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>Your Booking</span>
                        <span style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>⏳ Awaiting Verification</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
                        <div><div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 2 }}>Date</div><div style={{ color: "#f5f0ea", fontWeight: 600 }}>{fmtDate(submittedBooking?.date)}</div></div>
                        <div><div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 2 }}>Time</div><div style={{ color: "#f5f0ea", fontWeight: 600 }}>{submittedBooking?.timeSlot}</div></div>
                        <div><div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 2 }}>Meeting Type</div><div style={{ color: "#f5f0ea", fontWeight: 600 }}>{MEETING_LABELS[submittedBooking?.meetingType] || "Consultation"}</div></div>
                        <div><div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 2 }}>Status</div><div style={{ color: "#f59e0b", fontWeight: 600 }}>Pending</div></div>
                      </div>
                    </div>

                    {/* Call notice */}
                    <div style={{ display: "flex", gap: 14, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 14, padding: "16px 18px", marginBottom: 24 }}>
                      <div style={{ fontSize: 28, flexShrink: 0 }}>📞</div>
                      <div>
                        <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>We Will Call You Within 2 Hours</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6 }}>
                          Our team will call you on <strong style={{ color: "#f5f0ea" }}>{form.phone}</strong> to confirm your booking. Once verified, you'll receive a <strong style={{ color: "#c8a96e" }}>Booking ID</strong> to track your meeting details.
                        </div>
                      </div>
                    </div>

                    {/* Lookup section */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20 }}>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12, textAlign: "center" }}>
                        Already received your Booking ID?
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          value={lookupRef}
                          onChange={e => setLookupRef(e.target.value.toUpperCase())}
                          placeholder="e.g. HV-3K9XP"
                          style={{ ...inputStyle, flex: 1, letterSpacing: 2, fontFamily: "monospace", fontWeight: 700 }}
                          onKeyDown={e => e.key === "Enter" && handleLookup()}
                        />
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={handleLookup}
                          disabled={!lookupRef.trim() || looking}
                          style={{
                            background: "linear-gradient(135deg,#c8a96e,#a07840)", border: "none",
                            borderRadius: 10, padding: "11px 20px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0,
                          }}>
                          {looking ? "…" : "View →"}
                        </motion.button>
                      </div>
                      {lookupError && <div style={{ color: "#f87171", fontSize: 12, marginTop: 8, paddingLeft: 2 }}>{lookupError}</div>}
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 3: LOOKUP RESULT ── */}
                {step === 3 && lookupResult && (
                  <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, padding: "16px 20px", background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: 14 }}>
                      <div style={{ fontSize: 32 }}>📅</div>
                      <div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>Booking Reference</div>
                        <div style={{ color: gold, fontWeight: 900, fontSize: 22, letterSpacing: 3, fontFamily: "monospace" }}>{lookupResult.bookingRef}</div>
                      </div>
                      <div style={{ marginLeft: "auto" }}>
                        {(() => {
                          const cfg = STATUS_CONFIG[lookupResult.status] || STATUS_CONFIG.pending;
                          return (
                            <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700 }}>
                              {cfg.icon} {cfg.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Meeting info */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                      {[
                        { label: "Client Name", value: lookupResult.name },
                        { label: "Meeting Type", value: MEETING_LABELS[lookupResult.meetingType] || lookupResult.meetingType },
                        { label: "Date", value: fmtDate(lookupResult.date) },
                        { label: "Time", value: lookupResult.timeSlot },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
                          <div style={{ color: "#f5f0ea", fontWeight: 600, fontSize: 14 }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Meeting link / location */}
                    {lookupResult.meetingLink && (
                      <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>🔗 Meeting Link</div>
                        <a href={lookupResult.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", fontSize: 14, wordBreak: "break-all" }}>{lookupResult.meetingLink}</a>
                      </div>
                    )}
                    {lookupResult.siteAddress && lookupResult.meetingType === "site_visit" && (
                      <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>📍 Meeting Location</div>
                        <div style={{ color: "#f5f0ea", fontSize: 14 }}>{lookupResult.siteAddress}</div>
                      </div>
                    )}

                    {/* Admin confirmed note */}
                    {lookupResult.confirmedNote && (
                      <div style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>📝 Instructions from HAVI'S DESIGN</div>
                        <div style={{ color: "rgba(245,240,234,0.8)", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-line" }}>{lookupResult.confirmedNote}</div>
                      </div>
                    )}

                    {/* Look up another */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 16, display: "flex", gap: 8 }}>
                      <button onClick={() => { setStep(2); setLookupRef(""); }} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "10px 16px", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>← Back</button>
                      <button onClick={handleClose} style={{ flex: 1, background: "linear-gradient(135deg,#c8a96e,#a07840)", border: "none", borderRadius: 10, padding: "10px 0", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Done ✓</button>
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
