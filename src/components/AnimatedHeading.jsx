import { motion } from "framer-motion";
import { clipUp } from "../sections/animation";

/**
 * Splits text into words and reveals each with a clip-up motion.
 * Wrap accented words in {curly} braces to render them in the gold accent.
 */
const AnimatedHeading = ({ text, className = "", once = true, amount = 0.5 }) => {
  const words = text.split(" ");

  return (
    <motion.h2
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      transition={{ staggerChildren: 0.07 }}
      className={className}
      aria-label={text.replace(/[{}]/g, "")}
    >
      {words.map((word, i) => {
        const accented = word.startsWith("{") && word.endsWith("}");
        const clean = word.replace(/[{}]/g, "");
        return (
          <span
            key={i}
            className="inline-block overflow-hidden align-bottom"
            aria-hidden="true"
          >
            <motion.span
              variants={clipUp}
              className={`inline-block ${
                accented ? "italic text-accent" : ""
              }`}
            >
              {clean}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        );
      })}
    </motion.h2>
  );
};

export default AnimatedHeading;
