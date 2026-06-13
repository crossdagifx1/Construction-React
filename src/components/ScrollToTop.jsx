import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Resets scroll on route change, but preserves in-page #anchor navigation.
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [pathname, hash]);
  return null;
};

export default ScrollToTop;
