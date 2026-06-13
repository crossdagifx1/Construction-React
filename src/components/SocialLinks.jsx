import { FaTiktok, FaInstagram, FaYoutube, FaWhatsapp } from "react-icons/fa6";
import { FiPhone } from "react-icons/fi";
import { useSiteData } from "../context/SiteDataContext";

const digits = (s = "") => s.replace(/[^0-9]/g, "");

/**
 * Renders HAVI'S DESIGN social + contact icons from the contact settings.
 * variant: "light" (default, on paper) | "dark" (on ink backgrounds).
 */
const SocialLinks = ({ variant = "light", size = 18, className = "" }) => {
  const { data } = useSiteData();
  const c = data.settings.contact || {};

  const links = [
    c.tiktok && { Icon: FaTiktok, href: c.tiktok, label: "TikTok" },
    c.instagram && { Icon: FaInstagram, href: c.instagram, label: "Instagram" },
    c.youtube && { Icon: FaYoutube, href: c.youtube, label: "YouTube" },
    c.phone && {
      Icon: FaWhatsapp,
      href: `https://wa.me/${digits(c.phone)}`,
      label: "WhatsApp",
    },
    c.phone && {
      Icon: FiPhone,
      href: c.phoneHref || `tel:${digits(c.phone)}`,
      label: "Call",
    },
  ].filter(Boolean);

  const base =
    variant === "dark"
      ? "border-paper/20 text-paper/80 hover:bg-paper hover:text-ink"
      : "border-line text-ink hover:bg-ink hover:text-paper";

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {links.map(({ Icon, href, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className={`grid h-11 w-11 place-items-center rounded-full border transition-all duration-300 ease-smooth hover:-translate-y-0.5 ${base}`}
        >
          <Icon size={size} />
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
