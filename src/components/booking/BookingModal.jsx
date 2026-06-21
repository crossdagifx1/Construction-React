import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBooking } from "./useBooking";

const SERVICES = [
  { id: "Interior Design", icon: "🏠", label: "Interior Design", desc: "Transform your living spaces" },
  { id: "Renovation", icon: "🔨", label: "Renovation", desc: "Full-scale home makeovers" },
  { id: "Consultation", icon: "💬", label: "Consultation", desc: "Expert advice & planning" },
  { id: "Commercial", icon: "🏢", label: "Commercial", desc: "Office & retail design" },
  { id: "Landscaping", icon: "🌿", label: "Landscaping", desc: "Outdoor beauty & function" },
  { id: "Other", icon: "✨", label: "Other", desc: "Tell us your project idea" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function MiniCalendar({ selectedDate, onSelectDate }) {
  const [viewDate, setViewDate] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const startPad = firstDay.getDay();
  const cells = [];

  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={prevMonth} style={calNavBtn}>‹</button>
        <span style={{ color: "#f5f0ea", fontWeight: 600, fontSize: 14 }}>
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button onClick={nextMonth} style={calNavBtn}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, color: "rgba(245,240,234,0.4)", padding: "4px 0", fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;
          const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
          const isPast = cellDate < today;
          const isSelected = selectedDate &&
            cellDate.toDateString() === new Date(selectedDate).toDateString();
          const isToday = cellDate.toDateString() === today.toDateString();
          return (
            <button
              key={day}
              disabled={isPast}
              onClick={() => onSelectDate(cellDate)}
              style={{
                padding: "7px 0",
                borderRadius: 8,
                border: isSelected ? "2px solid #c8a96e" : "2px solid transparent",
                background: isSelected ? "rgba(200,169,110,0.25)" : isToday ? "rgba(200,169,110,0.1)" : "transparent",
                color: isPast ? "rgba(245,240,234,0.2)" : isSelected ? "#c8a96e" : "#e8e2da",
                cursor: isPast ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: isSelected || isToday ? 700 : 400,
                transition: "all 0.15s",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const calNavBtn = {
  background: "none", border: "none", cursor: "pointer",
  color: "#c8a96e", fontSize: 22, lineHeight: 1, padding: "0 6px",
};

function TimeSlotGrid({ availability, selected, onSelect }) {
  if (!availability) return (
    <p style={{ color: "rgba(245,240,234,0.4)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
      Pick a date to see available times
    </p>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
      {availability.allSlots.map(slot => {
        const isBooked = availability.booked.includes(slot);
        const isSelected = selected === slot;
        return (
          <button
            key={slot}
            disabled={isBooked}
            onClick={() => !isBooked && onSelect(slot)}
            style={{
              padding: "10px 0",
              borderRadius: 10,
              border: isSelected ? "2px solid #c8a96e" : "2px solid rgba(255,255,255,0.08)",
              background: isSelected ? "rgba(200,169,110,0.2)" : isBooked ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
              color: isBooked ? "rgba(245,240,234,0.2)" : isSelected ? "#c8a96e" : "#e8e2da",
              cursor: isBooked ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: isSelected ? 700 : 400,
              textDecoration: isBooked ? "line-through" : "none",
              transition: "all 0.15s",
            }}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  padding: "12px 14px",
  color: "#f5f0ea",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

export default function BookingModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [service, setService] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlot, setTimeSlot] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const { availability, availabilityLoading, submitting, success, error, fetchAvailability, submitBooking, reset } = useBooking();

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setTimeSlot("");
    fetchAvailability(date);
  };

  const handleSubmit = async () => {
    try {
      await submitBooking({
        ...form,
        service,
        date: selectedDate.toISOString(),
        timeSlot,
      });
    } catch {}
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      reset();
      setStep(1);
      setService("");
      setSelectedDate(null);
      setTimeSlot("");
      setForm({ name: "", email: "", phone: "", message: "" });
    }, 400);
  };

  const canGoNext = (step === 1 && service) || (step === 2 && selectedDate && timeSlot) || (step === 3 && form.name && form.email);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .havi-booking-overlay {
          position: fixed; inset: 0; z-index: 10000;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .havi-booking-modal {
          width: 100%; max-width: 560px;
          background: rgba(15,14,13,0.98);
          border: 1px solid rgba(200,169,110,0.2);
          border-radius: 24px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.7);
          overflow: hidden;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }
        .havi-booking-header {
          padding: 24px 28px 0;
          background: linear-gradient(180deg, rgba(200,169,110,0.08) 0%, transparent 100%);
        }
        .havi-booking-progress {
          display: flex;
          gap: 6px;
          margin-bottom: 20px;
        }
        .havi-booking-progress-bar {
          height: 3px;
          flex: 1;
          border-radius: 2px;
          transition: background 0.3s;
        }
        .havi-booking-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 28px 28px;
          scrollbar-width: thin;
          scrollbar-color: rgba(200,169,110,0.2) transparent;
        }
        .havi-service-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (max-width: 480px) {
          .havi-service-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .havi-service-card {
          padding: 16px 10px;
          border-radius: 14px;
          border: 2px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
        }
        .havi-service-card:hover {
          border-color: rgba(200,169,110,0.4);
          background: rgba(200,169,110,0.06);
        }
        .havi-service-card--selected {
          border-color: #c8a96e;
          background: rgba(200,169,110,0.15);
        }
      `}</style>

      <AnimatePresence>
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="havi-booking-overlay"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="havi-booking-modal"
          >
            {success ? (
              /* Success state */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ padding: 48, textAlign: "center" }}
              >
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <h3 style={{ color: "#c8a96e", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Booking Confirmed!</h3>
                <p style={{ color: "rgba(245,240,234,0.6)", fontSize: 14, marginBottom: 8 }}>
                  Your {service} consultation is scheduled for<br />
                  <strong style={{ color: "#e8e2da" }}>
                    {selectedDate?.toDateString()} at {timeSlot}
                  </strong>
                </p>
                <p style={{ color: "rgba(245,240,234,0.4)", fontSize: 13, marginBottom: 28 }}>
                  We'll reach out to {form.email} to confirm the details.
                </p>
                <button
                  onClick={handleClose}
                  style={{
                    background: "linear-gradient(135deg, #c8a96e, #a07840)",
                    border: "none", borderRadius: 12, padding: "12px 32px",
                    color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </motion.div>
            ) : (
              <>
                {/* Header */}
                <div className="havi-booking-header">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <h2 style={{ color: "#f5f0ea", fontSize: 20, fontWeight: 700, margin: 0 }}>Book a Consultation</h2>
                      <p style={{ color: "rgba(245,240,234,0.4)", fontSize: 13, margin: "4px 0 0" }}>
                        Step {step} of 3 — {step === 1 ? "Choose service" : step === 2 ? "Pick date & time" : "Your details"}
                      </p>
                    </div>
                    <button onClick={handleClose} style={{ background: "none", border: "none", color: "rgba(245,240,234,0.4)", cursor: "pointer", fontSize: 22 }}>✕</button>
                  </div>

                  {/* Progress bars */}
                  <div className="havi-booking-progress">
                    {[1, 2, 3].map(s => (
                      <div
                        key={s}
                        className="havi-booking-progress-bar"
                        style={{ background: step >= s ? "linear-gradient(90deg, #c8a96e, #a07840)" : "rgba(255,255,255,0.1)" }}
                      />
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div className="havi-booking-body">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div className="havi-service-grid">
                          {SERVICES.map(svc => (
                            <div
                              key={svc.id}
                              className={`havi-service-card ${service === svc.id ? "havi-service-card--selected" : ""}`}
                              onClick={() => setService(svc.id)}
                            >
                              <div style={{ fontSize: 28, marginBottom: 8 }}>{svc.icon}</div>
                              <div style={{ color: service === svc.id ? "#c8a96e" : "#e8e2da", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{svc.label}</div>
                              <div style={{ color: "rgba(245,240,234,0.4)", fontSize: 11 }}>{svc.desc}</div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div style={{ display: "grid", gap: 16 }}>
                          <MiniCalendar selectedDate={selectedDate} onSelectDate={handleDateSelect} />
                          {availabilityLoading ? (
                            <p style={{ textAlign: "center", color: "#c8a96e", fontSize: 13 }}>Loading availability...</p>
                          ) : (
                            <>
                              <p style={{ color: "rgba(245,240,234,0.5)", fontSize: 12, margin: 0 }}>Available time slots for {selectedDate?.toDateString() || "—"}</p>
                              <TimeSlotGrid availability={availability} selected={timeSlot} onSelect={setTimeSlot} />
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div style={{ display: "grid", gap: 14 }}>
                          {/* Summary */}
                          <div style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: 12, padding: "14px 16px", fontSize: 13 }}>
                            <div style={{ color: "#c8a96e", fontWeight: 700, marginBottom: 6 }}>📋 Booking Summary</div>
                            <div style={{ color: "#e8e2da" }}>Service: <strong>{service}</strong></div>
                            <div style={{ color: "#e8e2da" }}>Date: <strong>{selectedDate?.toDateString()}</strong></div>
                            <div style={{ color: "#e8e2da" }}>Time: <strong>{timeSlot}</strong></div>
                          </div>

                          <input style={inputStyle} placeholder="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                          <input style={inputStyle} type="email" placeholder="Email Address *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                          <input style={inputStyle} type="tel" placeholder="Phone Number (optional)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                          <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} placeholder="Tell us about your project (optional)" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />

                          {error && (
                            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#fca5a5", fontSize: 13 }}>
                              ⚠️ {error}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div style={{ padding: "0 28px 24px", display: "flex", gap: 10, justifyContent: "space-between" }}>
                  {step > 1 ? (
                    <button
                      onClick={() => setStep(s => s - 1)}
                      style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#e8e2da", cursor: "pointer", fontWeight: 600, fontSize: 15 }}
                    >
                      ← Back
                    </button>
                  ) : <div style={{ flex: 1 }} />}

                  {step < 3 ? (
                    <button
                      onClick={() => setStep(s => s + 1)}
                      disabled={!canGoNext}
                      style={{
                        flex: 2, padding: "13px 0", borderRadius: 12, border: "none",
                        background: canGoNext ? "linear-gradient(135deg, #c8a96e, #a07840)" : "rgba(255,255,255,0.06)",
                        color: canGoNext ? "#fff" : "rgba(245,240,234,0.3)",
                        cursor: canGoNext ? "pointer" : "not-allowed",
                        fontWeight: 700, fontSize: 15, transition: "all 0.2s",
                      }}
                    >
                      Continue →
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!canGoNext || submitting}
                      style={{
                        flex: 2, padding: "13px 0", borderRadius: 12, border: "none",
                        background: canGoNext ? "linear-gradient(135deg, #c8a96e, #a07840)" : "rgba(255,255,255,0.06)",
                        color: canGoNext ? "#fff" : "rgba(245,240,234,0.3)",
                        cursor: canGoNext && !submitting ? "pointer" : "not-allowed",
                        fontWeight: 700, fontSize: 15, transition: "all 0.2s",
                      }}
                    >
                      {submitting ? "Submitting..." : "✓ Confirm Booking"}
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
