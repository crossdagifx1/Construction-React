import { useState } from "react";
import { motion } from "framer-motion";
import BookingModal from "../components/booking/BookingModal";
import { useBooking } from "../components/booking/useBooking";
import { 
  FiAward, FiCompass, FiZap, FiSliders, FiUsers, FiSettings, 
  FiSearch, FiClock, FiPhone, FiCheckCircle, FiXCircle, 
  FiCalendar, FiFileText, FiPhoneCall, FiChevronRight 
} from "react-icons/fi";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  paper:  "#F6F3ED",
  sand:   "#EFE9DF",
  line:   "#E2DCD0",
  ink:    "#121110",
  stone:  "#6F6A62",
  accent: "#B98A4B",
  deep:   "#8C6635",
};

const WHY_US = [
  { icon: <FiAward size={24} />, title: "10+ Years Experience", desc: "Trusted by hundreds of clients across Addis Ababa" },
  { icon: <FiCompass size={24} />, title: "Custom Designs",       desc: "Every project is uniquely tailored to your vision" },
  { icon: <FiZap size={24} />, title: "On-Time Delivery",     desc: "We respect your time and deliver on schedule" },
  { icon: <FiSliders size={24} />, title: "Premium Materials",    desc: "Only the finest materials for lasting quality" },
  { icon: <FiUsers size={24} />, title: "Free Consultation",    desc: "Your first session is completely free" },
  { icon: <FiSettings size={24} />, title: "After-Service Support",desc: "We're here for you even after project completion" },
];

const STEPS = [
  { step: "01", icon: <FiCalendar size={24} />, title: "Pick a Date & Time",    desc: "Choose from available calendar slots — Mon–Sat, 9AM to 5PM." },
  { step: "02", icon: <FiFileText size={24} />, title: "Tell Us Your Vision",   desc: "Share project details, budget, and goals so we can prepare." },
  { step: "03", icon: <FiPhoneCall size={24} />, title: "We Call to Confirm",    desc: "Our team calls within 2 hours to verify and answer questions." },
  { step: "04", icon: <FiCheckCircle size={24} />, title: "Get Your Booking ID",   desc: "After verification, use your ID to view the full meeting schedule." },
];

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

const STATUS_CFG = {
  pending:   { color: "#92400e", bg: "#fef3c7", border: "#fde68a", label: "Awaiting Verification", icon: <FiClock size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> },
  verified:  { color: "#1e40af", bg: "#dbeafe", border: "#bfdbfe", label: "Verified",               icon: <FiPhone size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> },
  confirmed: { color: "#166534", bg: "#dcfce7", border: "#bbf7d0", label: "Confirmed",              icon: <FiCheckCircle size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> },
  completed: { color: "#6b21a8", bg: "#f3e8ff", border: "#e9d5ff", label: "Completed",              icon: <FiAward size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> },
  cancelled: { color: "#991b1b", bg: "#fee2e2", border: "#fecaca", label: "Cancelled",              icon: <FiXCircle size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> },
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

// ── Booking Lookup Section ────────────────────────────────────────────────────
function BookingLookup() {
  const { lookupBooking, looking, lookupResult, error } = useBooking();
  const [ref, setRef] = useState("");
  const [localError, setLocalError] = useState(null);

  const handleLookup = async () => {
    if (!ref.trim()) return;
    setLocalError(null);
    try { await lookupBooking(ref); }
    catch (e) { setLocalError(e.message); }
  };

  const inputStyle = {
    padding: "13px 16px", borderRadius: 10, fontSize: 14,
    background: T.paper, border: `1px solid ${T.line}`,
    color: T.ink, outline: "none", letterSpacing: 3,
    fontFamily: "monospace", fontWeight: 700,
    fontSmooth: "antialiased",
  };

  return (
    <div style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: 20, padding: "40px 32px", maxWidth: 580, margin: "0 auto", boxShadow: "0 4px 24px rgba(18,17,16,0.07)" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 34, marginBottom: 10, color: T.accent, display: "flex", justifyContent: "center" }}>
          <FiSearch />
        </div>
        <h3 style={{ color: T.ink, fontWeight: 800, fontSize: 20, margin: "0 0 8px", fontFamily: "Fraunces, Georgia, serif" }}>Find Your Booking</h3>
        <p style={{ color: T.stone, fontSize: 13, margin: 0, lineHeight: 1.7 }}>Enter the Booking ID you received after phone verification to view your full meeting schedule.</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input value={ref} onChange={e => setRef(e.target.value.toUpperCase())} placeholder="e.g. HV-3K9XP" style={{ ...inputStyle, flex: 1 }} onKeyDown={e => e.key === "Enter" && handleLookup()} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={handleLookup} disabled={!ref.trim() || looking}
          style={{ background: T.accent, border: "none", borderRadius: 10, padding: "13px 22px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0, opacity: !ref.trim() ? 0.6 : 1 }}>
          {looking ? "…" : "View"}
        </motion.button>
      </div>

      {(localError || error) && (
        <div style={{ color: "#991b1b", fontSize: 12, padding: "10px 14px", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 10 }}>{localError || error}</div>
      )}

      {lookupResult && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ marginTop: 20 }}>
          {/* Ref header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: T.sand, border: `1px solid ${T.line}`, borderRadius: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: T.stone, textTransform: "uppercase", letterSpacing: 1 }}>Booking Reference</div>
              <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 18, color: T.accent, letterSpacing: 3 }}>{lookupResult.bookingRef}</div>
            </div>
            {(() => {
              const cfg = STATUS_CFG[lookupResult.status] || STATUS_CFG.pending;
              return (
                <span style={{ display: "inline-flex", alignItems: "center", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>
                  {cfg.icon} {cfg.label}
                </span>
              );
            })()}
          </div>

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[
              { label: "Client Name",  value: lookupResult.name },
              { label: "Meeting Type", value: MEETING_LABELS[lookupResult.meetingType] || lookupResult.meetingType },
              { label: "Date",         value: fmtDate(lookupResult.date) },
              { label: "Time",         value: lookupResult.timeSlot },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: T.sand, border: `1px solid ${T.line}`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: T.stone, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>{label}</div>
                <div style={{ color: T.ink, fontWeight: 600, fontSize: 13 }}>{value}</div>
              </div>
            ))}
          </div>

          {lookupResult.meetingLink && (
            <div style={{ background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#1e40af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Meeting Link</div>
              <a href={lookupResult.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#1e40af", fontSize: 13, wordBreak: "break-all" }}>{lookupResult.meetingLink}</a>
            </div>
          )}

          {lookupResult.siteAddress && lookupResult.meetingType === "site_visit" && (
            <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#166534", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Meeting Location</div>
              <div style={{ color: "#14532d", fontSize: 13 }}>{lookupResult.siteAddress}</div>
            </div>
          )}

          {lookupResult.confirmedNote && (
            <div style={{ background: `${T.accent}0f`, border: `1px solid ${T.accent}33`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Instructions from HAVI'S DESIGN</div>
              <div style={{ color: T.ink, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-line" }}>{lookupResult.confirmedNote}</div>
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

  const eyebrow = { display: "inline-flex", alignItems: "center", gap: 10, fontSize: 10, color: T.stone, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 };
  const eyebrowLine = { display: "inline-block", width: 32, height: 1, background: T.accent };
  const sectionTitle = { fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, color: T.ink, letterSpacing: "-0.04em", lineHeight: 1.05 };

  return (
    <div style={{ background: T.paper, minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <section style={{ padding: "100px 24px 80px", textAlign: "center", position: "relative", borderBottom: `1px solid ${T.line}` }}>
        {/* Subtle grain texture effect */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(185,138,75,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={eyebrow}>
            <span style={eyebrowLine} />
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
            Free Consultation Available
            <span style={eyebrowLine} />
          </div>

          <h1 style={{ ...sectionTitle, fontSize: "clamp(40px,6vw,72px)", marginBottom: 24 }}>
            Book Your<br />
            <em style={{ color: T.accent, fontStyle: "italic" }}>Dream Design</em>
          </h1>

          <p style={{ fontSize: 17, color: T.stone, maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.75 }}>
            Schedule a free consultation with our expert designers. Tell us your vision — we'll make it a reality.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <motion.button onClick={() => setIsModalOpen(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ background: T.ink, border: "none", borderRadius: 12, padding: "15px 40px", color: T.paper, fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3 }}>
              Book a Free Consultation
            </motion.button>
            <motion.button onClick={() => document.getElementById("booking-lookup").scrollIntoView({ behavior: "smooth" })} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ background: "transparent", border: `1.5px solid ${T.line}`, borderRadius: 12, padding: "15px 28px", color: T.stone, fontSize: 15, cursor: "pointer" }}>
              Track My Booking
            </motion.button>
          </div>

          <div style={{ marginTop: 16, color: T.stone, fontSize: 12, opacity: 0.65 }}>
            No credit card required · 100% free initial session
          </div>
        </motion.div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={eyebrow}><span style={eyebrowLine} /> How It Works <span style={eyebrowLine} /></div>
          <h2 style={{ ...sectionTitle, fontSize: "clamp(28px,4vw,44px)" }}>A simple 4-step process</h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 2, border: `1px solid ${T.line}`, borderRadius: 16, overflow: "hidden" }}>
          {STEPS.map((item, i) => (
            <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ background: i % 2 === 0 ? T.paper : T.sand, padding: "32px 24px", borderRight: i < STEPS.length - 1 ? `1px solid ${T.line}` : "none", position: "relative" }}>
              <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 42, fontWeight: 300, color: `${T.accent}22`, lineHeight: 1, marginBottom: 14 }}>{item.step}</div>
              <div style={{ fontSize: 24, marginBottom: 10, color: T.accent }}>{item.icon}</div>
              <h3 style={{ color: T.ink, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
              <p style={{ color: T.stone, fontSize: 13, lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section style={{ background: T.sand, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={eyebrow}><span style={eyebrowLine} /> Why Choose Us <span style={eyebrowLine} /></div>
            <h2 style={{ ...sectionTitle, fontSize: "clamp(28px,4vw,44px)" }}>HAVI'S DESIGN Promise</h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 1, border: `1px solid ${T.line}`, borderRadius: 16, overflow: "hidden" }}>
            {WHY_US.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                whileHover={{ background: T.paper }}
                style={{ background: T.sand, padding: "28px 24px", borderRight: (i + 1) % 3 !== 0 ? `1px solid ${T.line}` : "none", borderBottom: i < WHY_US.length - 3 ? `1px solid ${T.line}` : "none", transition: "background 0.2s" }}>
                <div style={{ fontSize: 24, marginBottom: 10, color: T.accent }}>{item.icon}</div>
                <h3 style={{ color: T.ink, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
                <p style={{ color: T.stone, fontSize: 13, lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Booking Lookup ── */}
      <section id="booking-lookup" style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={eyebrow}><span style={eyebrowLine} /> Track Your Booking <span style={eyebrowLine} /></div>
          <h2 style={{ ...sectionTitle, fontSize: "clamp(28px,4vw,44px)", marginBottom: 12 }}>Find Your Meeting Schedule</h2>
          <p style={{ color: T.stone, fontSize: 14, margin: 0 }}>Already booked? Enter your Booking ID to view your full meeting details.</p>
        </motion.div>
        <BookingLookup />
      </section>

      {/* ── CTA ── */}
      <section style={{ background: T.ink, padding: "80px 24px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div style={{ fontSize: 10, color: `${T.accent}cc`, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>
            Ready to Begin?
          </div>
          <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, color: T.paper, fontSize: "clamp(28px,4vw,48px)", letterSpacing: "-0.04em", marginBottom: 16, lineHeight: 1.1 }}>
            Transform your space<br />
            <em style={{ color: T.accent, fontStyle: "italic" }}>starting today.</em>
          </h2>
          <p style={{ color: `${T.paper}80`, fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>Our first consultation is always free. No commitments, no pressure.</p>
          <motion.button onClick={() => setIsModalOpen(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{ background: T.accent, border: "none", borderRadius: 12, padding: "15px 44px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3, boxShadow: `0 8px 28px ${T.accent}44` }}>
            Get Started Today
          </motion.button>
        </motion.div>
      </section>

      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
