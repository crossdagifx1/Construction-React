import { motion } from "framer-motion";
import { clipUp, EASE } from "../sections/animation";

// Consistent header band for the standalone pages (about, portfolio, contact).
const PageHero = ({ eyebrow, title, accent, subtitle }) => (
  <section className="bg-paper pt-36 pb-14 lg:pt-44 lg:pb-20">
    <div className="shell">
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="eyebrow mb-6"
      >
        {eyebrow}
      </motion.span>
      <h1 className="display text-5xl sm:text-6xl lg:text-[5rem]">
        <span className="block overflow-hidden">
          <motion.span
            initial="hidden"
            animate="visible"
            variants={clipUp}
            transition={{ duration: 1, ease: EASE }}
            className="block"
          >
            {title}
          </motion.span>
        </span>
        {accent && (
          <span className="block overflow-hidden">
            <motion.span
              initial="hidden"
              animate="visible"
              variants={clipUp}
              transition={{ delay: 0.12, duration: 1, ease: EASE }}
              className="block italic text-accent"
            >
              {accent}
            </motion.span>
          </span>
        )}
      </h1>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: EASE }}
          className="mt-7 max-w-xl text-lg leading-relaxed text-stone"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  </section>
);

export default PageHero;
