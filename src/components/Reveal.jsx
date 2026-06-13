import { motion } from "framer-motion";
import { fadeUp } from "../sections/animation";

/**
 * Scroll-triggered reveal wrapper. Defaults to a soft fade-up, reveals once.
 * Pass `variants` to override and `delay` to offset the start.
 */
const Reveal = ({
  children,
  variants = fadeUp,
  delay = 0,
  className = "",
  as = "div",
  amount = 0.3,
  ...rest
}) => {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={variants}
      transition={{ delay }}
      className={className}
      {...rest}
    >
      {children}
    </MotionTag>
  );
};

export default Reveal;
