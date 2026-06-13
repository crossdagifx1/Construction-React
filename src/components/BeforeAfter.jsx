import { useCallback, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/**
 * Draggable before/after image comparison.
 * The "after" image fills the frame; the "before" image is revealed on the left
 * up to the divider, which the user drags (mouse or touch).
 */
const BeforeAfter = ({ before, after, className = "" }) => {
  const ref = useRef(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  }, []);

  const onDown = (e) => {
    dragging.current = true;
    setFromClientX(e.clientX ?? e.touches?.[0]?.clientX);
  };
  const onMove = (e) => {
    if (!dragging.current) return;
    setFromClientX(e.clientX ?? e.touches?.[0]?.clientX);
  };
  const stop = () => (dragging.current = false);

  // If we only have one image, just show it (no slider).
  if (!before || !after) {
    return (
      <div className={`overflow-hidden rounded-3xl ${className}`}>
        <img src={after || before} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`relative select-none overflow-hidden rounded-3xl ${className}`}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={onDown}
      onTouchMove={onMove}
      onTouchEnd={stop}
      role="slider"
      aria-valuenow={Math.round(pos)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Before and after comparison"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 4));
        if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 4));
      }}
    >
      {/* After (base layer) */}
      <img
        src={after}
        alt="After"
        draggable={false}
        className="block aspect-[16/10] w-full object-cover"
      />
      <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-xs uppercase tracking-widest text-paper backdrop-blur">
        After
      </span>

      {/* Before (clipped to the left of the divider) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img
          src={before}
          alt="Before"
          draggable={false}
          className="block aspect-[16/10] h-full w-full object-cover"
        />
        <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-paper/80 px-3 py-1 text-xs uppercase tracking-widest text-ink backdrop-blur">
          Before
        </span>
      </div>

      {/* Divider + handle */}
      <div
        className="absolute inset-y-0 flex items-center"
        style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
      >
        <div className="h-full w-0.5 bg-paper shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" />
        <div className="absolute left-1/2 grid h-11 w-11 -translate-x-1/2 cursor-ew-resize place-items-center rounded-full bg-paper text-ink shadow-lg">
          <FiChevronLeft size={14} className="-mr-0.5" />
          <FiChevronRight size={14} className="absolute right-1.5" />
        </div>
      </div>
    </div>
  );
};

export default BeforeAfter;
