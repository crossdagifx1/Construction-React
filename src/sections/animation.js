// Shared Framer Motion variants — tuned for a calm, editorial reveal cadence.

const EASE = [0.22, 1, 0.36, 1];

export const fadeUp = {
  hidden: { y: 36, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.9, ease: EASE } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1, ease: EASE } },
};

export const zoomIn = {
  hidden: { scale: 0.92, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.9, ease: EASE } },
};

// Parent that staggers its children's reveal.
export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

// Word/line clip reveal for display headings.
export const clipUp = {
  hidden: { y: "110%" },
  visible: { y: 0, transition: { duration: 0.95, ease: EASE } },
};

// Backwards-compatible aliases (older code referenced these names).
export const slideUpVariants = fadeUp;
export const zoomInVariants = zoomIn;

export { EASE };
