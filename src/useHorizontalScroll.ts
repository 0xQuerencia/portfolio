import { useCallback, useEffect, useRef, useState } from "react";

const NARROW_QUERY = "(max-width: 899px)";

/**
 * Desktop: vertical scrolling drives a sideways track. The outer box is one viewport
 * tall per panel, the inner track is pinned, and its x-offset follows scroll progress.
 * Phone: the panels stack normally and the active panel is the one nearest the top.
 */
export function useHorizontalScroll(panelCount: number) {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const outer = outerRef.current;
    const track = trackRef.current;
    if (!outer || !track) return;
    const narrow = window.matchMedia(NARROW_QUERY);

    let lastIndex = 0;
    const update = () => {
      let index = 0;
      if (narrow.matches) {
        track.style.transform = "";
        Array.from(track.children).forEach((panel, i) => {
          if (panel.getBoundingClientRect().top <= window.innerHeight * 0.4) index = i;
        });
      } else {
        const range = outer.offsetHeight - window.innerHeight;
        const outerTop = -outer.getBoundingClientRect().top;
        const progress = range > 0 ? Math.min(1, Math.max(0, outerTop / range)) : 0;
        const maxShift = track.scrollWidth - window.innerWidth;
        track.style.transform = `translate3d(${-progress * maxShift}px, 0, 0)`;
        index = Math.round(progress * (panelCount - 1));
      }
      if (index !== lastIndex) {
        lastIndex = index;
        setActive(index);
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [panelCount]);

  const goTo = useCallback(
    (index: number) => {
      const outer = outerRef.current;
      const track = trackRef.current;
      if (!outer || !track) return;

      if (window.matchMedia(NARROW_QUERY).matches) {
        const panel = track.children[index] as HTMLElement;
        window.scrollTo({ top: panel.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
        return;
      }

      const range = outer.offsetHeight - window.innerHeight;
      const outerTop = outer.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: outerTop + (range * index) / (panelCount - 1), behavior: "smooth" });
    },
    [panelCount],
  );

  return { outerRef, trackRef, goTo, active };
}
