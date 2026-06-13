import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

/** Counts up to `value` once it scrolls into view. */
const Counter = ({ value, suffix = "", duration = 1600 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf;
    let start;
    const step = (t) => {
      if (start === undefined) start = t;
      const progress = Math.min((t - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
};

export default Counter;
