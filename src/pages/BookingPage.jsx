import { useState } from "react";
import { motion } from "framer-motion";
import BookingModal from "../components/booking/BookingModal";
import { useBooking } from "../components/booking/useBooking";

const WHY_US = [
  { icon: "🏆", title: "10+ Years Experience", desc: "Trusted by hundreds of clients across Addis Ababa" },
  { icon: "🎨", title: "Custom Designs", desc: "Every project is uniquely tailored to your vision" },
  { icon: "⚡", title: "On-Time Delivery", desc: "We respect your time and deliver on schedule" },
  { icon: "💎", title: "Premium Materials", desc: "Only the finest materials for lasting quality" },
  { icon: "🤝", title: "Free Consultation", desc: "Your first session is completely free" },
  { icon: "🔧", title: "After-Service Support", desc: "We're here for you even after project completion" },
];

const STEPS = [
  { step: "01", icon: "📅", title: "Pick a Date & Time", desc: "Choose from our available calendar slots — we're open Mon–Sat, 9AM to 5PM." },
  { step: "02", icon: "📝", title: "Tell Us Your Vision", desc: "Share your project details, budget, and goals so we can prepare the perfect consultation." },
  { step: "03", icon: "📞", title: "We Call to Confirm", desc: "Our team calls you within 2 hours to verify your booking and answer any quick questions." },
  { step: "04", icon: "✅", title: "Get Your Booking ID", desc: "After verification, you receive a Booking ID to view your full meeting schedule anytime." },
];

const STATUS_CFG = {
  pending:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "Awaiting Verification", icon: "⏳" },
  verified:  { color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  label: "Verified",               icon: "📞" },
  confirmed: { color: "#22c55e", bg: "rgba(34,197,94,0.1)",   label: "Confirmed",              icon: "✅" },
  completed: { color: "#a855f7", bg: "rgba(168,85,247,0.1)",  label: "Completed",              icon: "🎉" },
  cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "Cancelled",              icon: "❌" },
};

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

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

// ── Booking Lookup Section ────────────────────────────────────────────────────
function BookingLookup() {
  const { lookupBooking, looking, lookupResult, error } = useBooking();
  const [ref, setRef] = useState("");
  const [localError, setLocalError] = useState(null);

  const handleLookup = async () => {
    if (!ref.trim()) return;
    setLocalError(null);
    try {
      await lookupBooking(ref);
    } catch (e) {
      setLocalError(e.message);
    }
  };

  const gold = "#c8a96e";

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 24, padding: "40px 32px", maxWidth: 600, margin: "0 auto",
    }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
        <h3 style={{ color: "#f5f0ea", fontWeight: 800, fontSize: 22, margin: "0 0 8px" }}>Find Your Booking</h3>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Enter the Booking ID you received after phone verification to view your full meeting schedule.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={ref}
          onChange={e => setRef(e.target.value.toUpperCase())}
          placeholder="e.g. HV-3K9XP"
          style={{
            flex: 1, padding: "14px 18px", borderRadius: 12, fontSize: 15,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
            color: "#f5f0ea", outline: "none", letterSpacing: 3, fontFamily: "monospace", fontWeight: 700,
          }}
          onKeyDown={e => e.key === "Enter" && handleLookup()}
        />
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={handleLookup}
          disabled={!ref.trim() || looking}
          style={{
            background: "linear-gradient(135deg,#c8a96e,#a07840)", border: "none",
            borderRadius: 12, padding: "14px 24px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0,
            opacity: !ref.trim() ? 0.6 : 1,
          }}>
          {looking ? "…" : "View →"}
        </motion.button>
      </div>

      {(localError || error) && (
        <div style={{ color: "#f87171", fontSize: 13, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 10, marginBottom: 12 }}>
          {localError || error}
        </div>
      )}

      {/* Lookup result */}
      {lookupResult && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          style={{ marginTop: 20 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "14px 16px", background: "rgba(200,169,110,0.07)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>Booking Reference</div>
              <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 18, color: gold, letterSpacing: 3 }}>{lookupResult.bookingRef}</div>
            </div>
            <div>
              {(() => {
                const cfg = STATUS_CFG[lookupResult.status] || STATUS_CFG.pending;
                return (
                  <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700 }}>
                    {cfg.icon} {cfg.label}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[
              { label: "Client Name", value: lookupResult.name },
              { label: "Meeting Type", value: MEETING_LABELS[lookupResult.meetingType] || lookupResult.meetingType },
              { label: "Date", value: fmtDate(lookupResult.date) },
              { label: "Time", value: lookupResult.timeSlot },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>{label}</div>
                <div style={{ color: "#f5f0ea", fontWeight: 600, fontSize: 13 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Meeting link */}
          {lookupResult.meetingLink && (
            <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>🔗 Meeting Link</div>
              <a href={lookupResult.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", fontSize: 13, wordBreak: "break-all" }}>{lookupResult.meetingLink}</a>
            </div>
          )}

          {/* Site address */}
          {lookupResult.siteAddress && lookupResult.meetingType === "site_visit" && (
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "#4ade80", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>📍 Meeting Location</div>
              <div style={{ color: "#f5f0ea", fontSize: 13 }}>{lookupResult.siteAddress}</div>
            </div>
          )}

          {/* Admin note to user */}
          {lookupResult.confirmedNote && (
            <div style={{ background: "rgba(200,169,110,0.07)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>📝 Instructions from HAVI'S DESIGN</div>
              <div style={{ color: "rgba(245,240,234,0.8)", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-line" }}>{lookupResult.confirmedNote}</div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BookingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0f0e0d 0%, #151210 50%, #0f0e0d 100%)" }}>
      {/* Hero Section */}
      <section style={{ padding: "100px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(200,169,110,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: 24, padding: "6px 16px", fontSize: 12, color: "#c8a96e", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            Free Consultation Available
          </div>

          <h1 style={{ fontSize: "clamp(36px,6vw,64px)", fontWeight: 900, color: "#f5f0ea", lineHeight: 1.1, marginBottom: 20, letterSpacing: "-1px" }}>
            Book Your<br />
            <span style={{ background: "linear-gradient(135deg,#c8a96e,#f0d080)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Dream Design</span>
          </h1>

          <p style={{ fontSize: 18, color: "rgba(245,240,234,0.55)", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Schedule a free consultation with our expert designers. Tell us your vision — we'll make it a reality.
          </p>

          <motion.button onClick={() => setIsModalOpen(true)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ background: "linear-gradient(135deg,#c8a96e 0%,#a07840 100%)", border: "none", borderRadius: 16, padding: "16px 44px", color: "#fff", fontSize: 17, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 32px rgba(200,169,110,0.35)" }}>
            📅 Book a Free Consultation
          </motion.button>

          <div style={{ marginTop: 16, color: "rgba(245,240,234,0.3)", fontSize: 13 }}>
            No credit card required · 100% free initial session
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px 60px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ color: "#f5f0ea", fontSize: 28, fontWeight: 800, marginBottom: 10 }}>How It Works</h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>A simple 4-step process from booking to meeting</p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
          {STEPS.map((item, i) => (
            <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 18px", position: "relative", overflow: "hidden" }}
              whileHover={{ borderColor: "rgba(200,169,110,0.25)", y: -2 }}>
              <div style={{ position: "absolute", top: 12, right: 16, fontFamily: "monospace", fontSize: 36, fontWeight: 900, color: "rgba(200,169,110,0.08)", lineHeight: 1 }}>{item.step}</div>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
              <h3 style={{ color: "#c8a96e", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
              <p style={{ color: "rgba(245,240,234,0.45)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ color: "#f5f0ea", fontSize: 28, fontWeight: 800, marginBottom: 10 }}>Why Choose HAVI'S DESIGN?</h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Everything you need for your dream space</p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          {WHY_US.map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px 20px" }}
              whileHover={{ borderColor: "rgba(200,169,110,0.3)", y: -2 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
              <h3 style={{ color: "#c8a96e", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
              <p style={{ color: "rgba(245,240,234,0.5)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Booking Lookup */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ color: "#f5f0ea", fontSize: 28, fontWeight: 800, marginBottom: 10 }}>Track Your Booking</h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Already booked? Enter your Booking ID to view your meeting schedule</p>
        </motion.div>
        <BookingLookup />
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{ textAlign: "center", background: "linear-gradient(135deg,rgba(200,169,110,0.08),rgba(160,120,64,0.05))", border: "1px solid rgba(200,169,110,0.2)", borderRadius: 24, padding: "48px 32px" }}>
          <h3 style={{ color: "#f5f0ea", fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Ready to transform your space?</h3>
          <p style={{ color: "rgba(245,240,234,0.4)", marginBottom: 28, fontSize: 15 }}>Our first consultation is always free. No commitments.</p>
          <motion.button onClick={() => setIsModalOpen(true)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)", border: "none", borderRadius: 14, padding: "14px 40px", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 28px rgba(200,169,110,0.3)" }}>
            Get Started Today →
          </motion.button>
        </motion.div>
      </section>

      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
