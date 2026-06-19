import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { FiArrowDown, FiArrowUpRight } from "react-icons/fi";
import { clipUp, EASE } from "./animation";
import { useSiteData } from "../context/SiteDataContext";

const Hero = () => {
  const ref = useRef(null);
  const { data } = useSiteData();
  const hero = data.settings.hero;
  const contact = data.settings.contact || {};

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const markY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const lines = [hero.titleLine1, hero.titleLine2];

  return (
    <section
      id="hero"
      ref={ref}
      className="relative min-h-[100svh] overflow-hidden bg-paper pt-28 lg:pt-0"
    >
      <motion.span
        style={{ y: markY }}
        aria-hidden
        className="pointer-events-none absolute -right-6 top-[14%] z-0 select-none font-display text-[26vw] leading-none text-ink/[0.04] lg:text-[20vw]"
      >
        design
      </motion.span>

      <div className="shell relative z-10 grid min-h-[100svh] grid-cols-1 items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7 lg:pr-8">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: EASE }}
            className="eyebrow mb-7"
          >
            {hero.eyebrow}
          </motion.span>

          <h1 className="display text-[14vw] leading-[0.95] sm:text-7xl lg:text-[5.6rem]">
            {lines.map((line, i) => (
              <span key={i} className="block overflow-hidden">
                <motion.span
                  initial="hidden"
                  animate="visible"
                  variants={clipUp}
                  transition={{ delay: 0.3 + i * 0.12, duration: 1, ease: EASE }}
                  className="block"
                >
                  {line}
                </motion.span>
              </span>
            ))}
            <span className="block overflow-hidden">
              <motion.span
                initial="hidden"
                animate="visible"
                variants={clipUp}
                transition={{ delay: 0.54, duration: 1, ease: EASE }}
                className="block italic text-accent"
              >
                {hero.titleAccent}
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.9, ease: EASE }}
            className="mt-8 max-w-md text-lg leading-relaxed text-stone"
          >
            {hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.9, ease: EASE }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/portfolio"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 text-sm font-medium text-paper transition-colors duration-500 hover:bg-accent-deep"
            >
              View our work
              <FiArrowUpRight className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link to="/contact" className="link-underline text-sm font-medium text-ink">
              Start a project
            </Link>
          </motion.div>

          {/* Styled Developer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.25, duration: 0.9 }}
            className="mt-8 flex flex-wrap items-center gap-2.5 text-[10px] uppercase tracking-wider text-stone/50"
          >
            <span>
              Crafted by{" "}
              <a
                href="https://gnexuset.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-ink/75 hover:text-accent transition-colors duration-300"
              >
                gnexuset.com
              </a>
            </span>
            <span>|</span>
            <a href="tel:+251995270894" className="hover:text-ink transition-colors duration-300">
              Call
            </a>
            <span>•</span>
            <a
              href="https://wa.me/251995270894"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors duration-300"
            >
              WhatsApp
            </a>
            <span>•</span>
            <a
              href="https://t.me/crossdagi"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors duration-300"
            >
              Telegram
            </a>
          </motion.div>
        </div>

        <div className="relative lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1.2, ease: EASE }}
            className="relative mx-auto flex max-w-md items-end justify-center"
          >
            <div className="absolute bottom-0 h-[78%] w-full rounded-t-[140px] bg-sand" />
            <motion.img
              style={{ y: imgY }}
              src={hero.image}
              alt="HAVI'S DESIGN project lead on site"
              className="relative z-10 max-h-[82svh] w-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.18)]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.9, ease: EASE }}
            className="absolute bottom-6 left-0 z-20 rounded-2xl border border-line bg-paper/90 px-5 py-4 shadow-xl backdrop-blur"
          >
            <p className="font-display text-3xl tracking-tightest">
              {hero.statValue}
            </p>
            <p className="text-xs uppercase tracking-widest text-stone">
              {hero.statLabel}
            </p>
          </motion.div>
        </div>
      </div>

      <motion.button
        style={{ opacity: fade }}
        onClick={() =>
          document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })
        }
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-widest text-stone lg:flex"
        aria-label="Scroll down"
      >
        Scroll
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        >
          <FiArrowDown />
        </motion.span>
      </motion.button>
    </section>
  );
};

export default Hero;
