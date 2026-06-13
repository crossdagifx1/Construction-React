import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowUpRight, FiMenu, FiX, FiPhone } from "react-icons/fi";
import { FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import { useSiteData } from "../context/SiteDataContext";
import logo from "../assets/HAVI LOGO.png";

const navItems = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Services", to: "/#services" },
  { label: "Work", to: "/portfolio" },
  { label: "Listings", to: "/listings" },
  { label: "Blog", to: "/blog" },
  { label: "Contact", to: "/contact" },
];

const Header = () => {
  const { data } = useSiteData();
  const contact = data.settings.contact || {};
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // Solid header everywhere except the top of the home hero.
  const solid = scrolled || !isHome;

  return (
    <motion.header
      initial={{ y: -90 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      {/* Main nav row */}
      <div
        className={`transition-all duration-500 ease-smooth ${
          solid
            ? "bg-paper/85 backdrop-blur-md border-b border-line py-3"
            : "bg-transparent py-5"
        }`}
      >
      <nav className="shell flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={logo}
            alt="HAVI'S DESIGN"
            className="h-11 w-11 rounded-full object-cover transition-transform duration-500 group-hover:rotate-[20deg]"
          />
          <span className="hidden leading-none sm:block">
            <span className="block font-display text-lg tracking-tightest">
              HAVI'S DESIGN
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-stone">
              Interior & Finishing
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-9 lg:flex">
          {navItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="link-underline text-sm font-medium text-ink/80 transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5">
          {/* Phone (large screens) */}
          <a
            href={contact.phoneHref || `tel:${contact.phone}`}
            className="hidden items-center gap-2 text-sm font-medium text-ink/80 transition-colors hover:text-accent xl:flex"
          >
            <FiPhone size={15} />
            <span>{contact.phone}</span>
          </a>

          {/* Socials (large screens) */}
          <div className="hidden items-center gap-2 xl:flex">
            {contact.instagram && (
              <a href={contact.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink/70 transition-all duration-300 hover:border-[#E1306C] hover:text-[#E1306C]">
                <FaInstagram size={14} />
              </a>
            )}
            {contact.tiktok && (
              <a href={contact.tiktok} target="_blank" rel="noopener noreferrer" title="TikTok" className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink/70 transition-all duration-300 hover:border-ink hover:text-ink">
                <FaTiktok size={14} />
              </a>
            )}
            {contact.youtube && (
              <a href={contact.youtube} target="_blank" rel="noopener noreferrer" title="YouTube" className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink/70 transition-all duration-300 hover:border-[#FF0000] hover:text-[#FF0000]">
                <FaYoutube size={14} />
              </a>
            )}
          </div>

          {/* Phone quick-call (mobile) */}
          <a
            href={contact.phoneHref || `tel:${contact.phone}`}
            aria-label="Call us"
            className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink md:hidden"
          >
            <FiPhone size={18} />
          </a>

          <Link
            to="/contact"
            className="group hidden items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-all duration-500 ease-smooth hover:bg-accent-deep md:inline-flex"
          >
            Reach us
            <FiArrowUpRight className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line bg-paper/95 backdrop-blur-md lg:hidden"
          >
            <ul className="shell flex flex-col py-4">
              {navItems.map((item, i) => (
                <motion.li
                  key={item.to}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="border-b border-line/70 last:border-0"
                >
                  <Link
                    to={item.to}
                    className="block py-4 text-left font-display text-2xl tracking-tightest"
                  >
                    {item.label}
                  </Link>
                </motion.li>
              ))}

              {/* Phone + socials in the mobile menu */}
              <li className="mt-3 flex flex-col gap-4 pt-5">
                <a
                  href={contact.phoneHref || `tel:${contact.phone}`}
                  className="flex items-center gap-3 font-display text-xl tracking-tightest"
                >
                  <FiPhone size={18} /> {contact.phone}
                </a>
                <div className="flex items-center gap-3">
                  {contact.instagram && (
                    <a href={contact.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink/70 transition-colors hover:border-[#E1306C] hover:text-[#E1306C]">
                      <FaInstagram size={16} />
                    </a>
                  )}
                  {contact.tiktok && (
                    <a href={contact.tiktok} target="_blank" rel="noopener noreferrer" title="TikTok" className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink/70 transition-colors hover:border-ink hover:text-ink">
                      <FaTiktok size={16} />
                    </a>
                  )}
                  {contact.youtube && (
                    <a href={contact.youtube} target="_blank" rel="noopener noreferrer" title="YouTube" className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink/70 transition-colors hover:border-[#FF0000] hover:text-[#FF0000]">
                      <FaYoutube size={16} />
                    </a>
                  )}
                </div>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
