import Lenis from "lenis";
import { useCallback, useEffect, useRef, useState } from "react";

const NARROW_QUERY = "(max-width: 899px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Desktop: vertical scrolling drives a sideways track. The outer box is one viewport
 * tall per panel, the inner track is pinned, and its x-offset follows scroll progress.
 * Phone: the panels stack normally and the active panel is the one nearest the top.
 */
export function useHorizontalScroll(panelCount: number) {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [active, setActive] = useState(0);

  // Lenis smooths the real window scroll, so the scroll listener below keeps working unchanged.
  useEffect(() => {
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;
    const lenis = new Lenis({ autoRaf: true });
    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

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

      const scrollTo = (top: number) =>
        lenisRef.current ? lenisRef.current.scrollTo(top) : window.scrollTo({ top, behavior: "smooth" });

      if (window.matchMedia(NARROW_QUERY).matches) {
        const panel = track.children[index] as HTMLElement;
        scrollTo(panel.getBoundingClientRect().top + window.scrollY);
        return;
      }

      const range = outer.offsetHeight - window.innerHeight;
      const outerTop = outer.getBoundingClientRect().top + window.scrollY;
      scrollTo(outerTop + (range * index) / (panelCount - 1));
    },
    [panelCount],
  );

  return { outerRef, trackRef, goTo, active };
}
