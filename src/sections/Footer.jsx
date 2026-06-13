import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowUp, FiArrowUpRight } from "react-icons/fi";
import Reveal from "../components/Reveal";
import AnimatedHeading from "../components/AnimatedHeading";
import { fadeUp } from "./animation";
import { useSiteData } from "../context/SiteDataContext";
import logo from "../assets/HAVI LOGO.png";

const nav = [
  { label: "About", to: "/about" },
  { label: "Services", to: "/#services" },
  { label: "Work", to: "/portfolio" },
  { label: "Contact", to: "/contact" },
];

const Footer = () => {
  const { data } = useSiteData();
  const c = data.settings.contact;
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <footer className="bg-ink text-paper">
      <div className="shell border-b border-paper/10 py-20 text-center lg:py-28">
        <Reveal variants={fadeUp}>
          <span className="eyebrow mb-6 justify-center text-accent">
            Ready when you are
          </span>
        </Reveal>
        <AnimatedHeading
          text="Let's design something {timeless.}"
          className="display justify-center text-center text-5xl text-paper sm:text-6xl lg:text-7xl"
        />
        <Reveal variants={fadeUp} delay={0.1}>
          <Link
            to="/contact"
            className="group mt-10 inline-flex items-center gap-2 rounded-full bg-paper px-9 py-4 text-sm font-medium text-ink transition-colors duration-500 hover:bg-accent"
          >
            Start a project
            <FiArrowUpRight className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </Reveal>
      </div>

      <div className="shell flex flex-col gap-12 py-14 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-sm">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="HAVI'S DESIGN"
              className="h-12 w-12 rounded-full bg-paper object-cover p-0.5"
            />
            <span className="font-display text-xl tracking-tightest">
              HAVI'S DESIGN
            </span>
          </Link>
          <p className="mt-5 leading-relaxed text-paper/60">
            A premier interior design and finishing firm — transforming spaces
            into functional, aesthetic and timeless environments.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-widest text-paper/40">Explore</p>
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="link-underline w-fit text-paper/80 transition-colors hover:text-paper"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-widest text-paper/40">
            Get in touch
          </p>
          <a
            href={c.phoneHref || `tel:${c.phone}`}
            className="link-underline w-fit text-paper/80 hover:text-paper"
          >
            {c.phone}
          </a>
          <a
            href={`mailto:${c.email}`}
            className="link-underline w-fit text-paper/80 hover:text-paper"
          >
            {c.email}
          </a>
          <span className="text-paper/60">{c.address}</span>
        </div>
      </div>

      <div className="shell flex flex-col items-center justify-between gap-3 border-t border-paper/10 py-7 text-sm text-paper/50 sm:flex-row">
        <p>&copy; {new Date().getFullYear()} HAVI'S DESIGN. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-paper/40">
          <span>Developed by <a href="https://gnexuset.com" target="_blank" rel="noopener noreferrer" className="text-paper/60 hover:text-accent font-medium underline underline-offset-2 decoration-paper/20">gnexuset.com</a></span>
          <span>|</span>
          <a href="tel:+251995270894" className="hover:text-paper transition-colors">Call</a>
          <span>•</span>
          <a href="https://wa.me/251995270894" target="_blank" rel="noopener noreferrer" className="hover:text-paper transition-colors">WA</a>
          <span>•</span>
          <a href="https://t.me/crossdagi" target="_blank" rel="noopener noreferrer" className="hover:text-paper transition-colors">Telegram</a>
        </div>
        <Link to="/admin/login" className="transition-colors hover:text-paper/80">
          Admin
        </Link>
      </div>

      <AnimatePresence>
        {show && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-7 right-7 z-40 grid h-12 w-12 place-items-center rounded-full bg-accent text-ink shadow-lg transition-colors duration-300 hover:bg-paper"
            aria-label="Back to top"
          >
            <FiArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
};

export default Footer;
