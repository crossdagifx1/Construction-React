import { useState } from "react";
import { motion } from "framer-motion";
import { FiPhone, FiMail, FiMapPin, FiArrowUpRight } from "react-icons/fi";
import Reveal from "../components/Reveal";
import AnimatedHeading from "../components/AnimatedHeading";
import { fadeUp, stagger } from "./animation";
import { useSiteData } from "../context/SiteDataContext";
import { api } from "../lib/api";

const Contact = () => {
  const { data } = useSiteData();
  const c = data.settings.contact;

  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  const details = [
    { icon: FiPhone, label: "Call", value: c.phone, href: c.phoneHref || `tel:${c.phone}` },
    { icon: FiMail, label: "Email", value: c.email, href: `mailto:${c.email}` },
    { icon: FiMapPin, label: "Studio", value: c.address, href: null },
  ];

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await api.submitContact(form);
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", message: "" });
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="bg-sand py-24 lg:py-32">
      <div className="shell grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col justify-center">
          <Reveal variants={fadeUp}>
            <span className="eyebrow mb-6">{c.eyebrow}</span>
          </Reveal>
          <AnimatedHeading
            text={c.heading}
            className="display text-4xl sm:text-5xl lg:text-[3.4rem]"
          />
          <Reveal variants={fadeUp} delay={0.1}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-stone">
              {c.blurb}
            </p>
          </Reveal>

          <Reveal variants={stagger} className="mt-12 flex flex-col gap-5">
            {details.map((d) => {
              const Icon = d.icon;
              const inner = (
                <>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line bg-paper text-ink transition-colors duration-500 group-hover:bg-ink group-hover:text-paper">
                    <Icon size={20} />
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-widest text-stone">
                      {d.label}
                    </span>
                    <span className="font-display text-xl tracking-tightest">
                      {d.value}
                    </span>
                  </span>
                </>
              );
              return (
                <motion.div key={d.label} variants={fadeUp}>
                  {d.href ? (
                    <a href={d.href} className="group flex items-center gap-4">
                      {inner}
                    </a>
                  ) : (
                    <div className="group flex items-center gap-4">{inner}</div>
                  )}
                </motion.div>
              );
            })}
          </Reveal>
        </div>

        <Reveal variants={fadeUp} delay={0.1}>
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-line bg-paper p-8 shadow-[0_30px_70px_-50px_rgba(0,0,0,0.5)] lg:p-10"
          >
            <div className="flex flex-col gap-5">
              <Field label="Full name" type="text" placeholder="Jane Doe" value={form.name} onChange={set("name")} />
              <Field label="Email" type="email" placeholder="jane@email.com" value={form.email} onChange={set("email")} />
              <Field label="Phone" type="tel" placeholder="+251 ..." required={false} value={form.phone} onChange={set("phone")} />
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest text-stone">
                  Project details
                </label>
                <textarea
                  rows="4"
                  required
                  value={form.message}
                  onChange={set("message")}
                  placeholder="Tell us about the space and what you have in mind..."
                  className="resize-none rounded-xl border border-line bg-paper px-4 py-3 text-ink outline-none transition-colors duration-300 placeholder:text-stone/60 focus:border-accent"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === "sending" || status === "sent"}
                className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 text-sm font-medium text-paper transition-colors duration-500 hover:bg-accent-deep disabled:opacity-70"
              >
                {status === "sent"
                  ? "Thank you — we'll be in touch"
                  : status === "sending"
                  ? "Sending…"
                  : "Send enquiry"}
                {status === "idle" && (
                  <FiArrowUpRight className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                )}
              </button>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
};

const Field = ({ label, type, placeholder, required = true, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs uppercase tracking-widest text-stone">{label}</label>
    <input
      type={type}
      required={required}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="rounded-xl border border-line bg-paper px-4 py-3 text-ink outline-none transition-colors duration-300 placeholder:text-stone/60 focus:border-accent"
    />
  </div>
);

export default Contact;
