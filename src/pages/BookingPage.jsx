import { useState } from "react";
import { motion } from "framer-motion";
import BookingModal from "../components/booking/BookingModal";

const WHY_US = [
  { icon: "🏆", title: "10+ Years Experience", desc: "Trusted by hundreds of clients across Addis Ababa" },
  { icon: "🎨", title: "Custom Designs", desc: "Every project is uniquely tailored to your vision" },
  { icon: "⚡", title: "On-Time Delivery", desc: "We respect your time and deliver on schedule" },
  { icon: "💎", title: "Premium Materials", desc: "Only the finest materials for lasting quality" },
  { icon: "🤝", title: "Free Consultation", desc: "Your first session is completely free" },
  { icon: "🔧", title: "After-Service Support", desc: "We're here for you even after project completion" },
];

export default function BookingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0f0e0d 0%, #151210 50%, #0f0e0d 100%)" }}>
      {/* Hero Section */}
      <section style={{ padding: "100px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600, height: 400,
          background: "radial-gradient(ellipse, rgba(200,169,110,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)",
            borderRadius: 24, padding: "6px 16px", fontSize: 12, color: "#c8a96e",
            fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 24,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            Free Consultation Available
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 900,
            color: "#f5f0ea", lineHeight: 1.1, marginBottom: 20,
            letterSpacing: "-1px",
          }}>
            Book Your<br />
            <span style={{ background: "linear-gradient(135deg, #c8a96e, #f0d080)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Dream Design
            </span>
          </h1>

          <p style={{
            fontSize: 18, color: "rgba(245,240,234,0.55)", maxWidth: 520,
            margin: "0 auto 40px", lineHeight: 1.7,
          }}>
            Schedule a free consultation with our expert designers. Tell us your vision — we'll make it a reality.
          </p>

          <motion.button
            onClick={() => setIsModalOpen(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: "linear-gradient(135deg, #c8a96e 0%, #a07840 100%)",
              border: "none", borderRadius: 16, padding: "16px 44px",
              color: "#fff", fontSize: 17, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 8px 32px rgba(200,169,110,0.35)",
            }}
          >
            📅 Book a Free Consultation
          </motion.button>

          <div style={{ marginTop: 16, color: "rgba(245,240,234,0.3)", fontSize: 13 }}>
            No credit card required • 100% free initial session
          </div>
        </motion.div>
      </section>

      {/* Why Choose Us */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <h2 style={{ color: "#f5f0ea", fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Why Choose HAVI'S DESIGN?</h2>
          <p style={{ color: "rgba(245,240,234,0.4)", fontSize: 15 }}>Everything you need for your dream space</p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {WHY_US.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: "24px 20px",
                transition: "border-color 0.2s",
              }}
              whileHover={{ borderColor: "rgba(200,169,110,0.3)", y: -2 }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
              <h3 style={{ color: "#c8a96e", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
              <p style={{ color: "rgba(245,240,234,0.5)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA again */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            marginTop: 60, textAlign: "center",
            background: "linear-gradient(135deg, rgba(200,169,110,0.08), rgba(160,120,64,0.05))",
            border: "1px solid rgba(200,169,110,0.2)",
            borderRadius: 24, padding: "48px 32px",
          }}
        >
          <h3 style={{ color: "#f5f0ea", fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Ready to transform your space?</h3>
          <p style={{ color: "rgba(245,240,234,0.4)", marginBottom: 28, fontSize: 15 }}>Our first consultation is always free. No commitments.</p>
          <motion.button
            onClick={() => setIsModalOpen(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              border: "none", borderRadius: 14, padding: "14px 40px",
              color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 8px 28px rgba(200,169,110,0.3)",
            }}
          >
            Get Started Today →
          </motion.button>
        </motion.div>
      </section>

      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
