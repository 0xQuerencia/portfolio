import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

type Chapter = { id: string; label: string; content: ReactNode };
type Scrub = { pointerId: number; originX: number; started: boolean };

function stopsFor(track: HTMLDivElement) {
  const limit = track.scrollWidth - track.clientWidth;
  return Array.from(track.children, panel => Math.min((panel as HTMLElement).offsetLeft, limit));
}

function rulerPosition(stops: number[], left: number) {
  for (let index = 1; index < stops.length; index++) {
    if (left <= stops[index]) {
      return index - 1 + Math.max(0, (left - stops[index - 1]) / Math.max(1, stops[index] - stops[index - 1]));
    }
  }
  return Math.max(0, stops.length - 1);
}

export default function IndexRail({ chapters }: { chapters: Chapter[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const ruler = useRef<HTMLElement>(null);
  const scrub = useRef<Scrub | null>(null);
  const suppressClick = useRef(false);
  const introEvaluated = useRef(false);
  const [reveal, setReveal] = useState(false);
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const selected = scrubbing ? active : preview ?? active;

  function trackPosition() {
    const track = rail.current;
    if (!track) return;
    const position = rulerPosition(stopsFor(track), track.scrollLeft);
    setActive(Math.round(position));
    const offset = position / Math.max(1, chapters.length - 1);
    ruler.current?.style.setProperty("--progress", String(offset));
  }

  useEffect(() => {
    if (introEvaluated.current) return;
    introEvaluated.current = true;
    if (window.location.hash || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (sessionStorage.getItem("querencia:opening")) return;
      sessionStorage.setItem("querencia:opening", "seen");
    } catch {
      // An unavailable session store should not block the experience.
    }
    setReveal(true);
  }, []);

  useEffect(() => {
    const track = rail.current;
    if (!track) return;
    function followHash() {
      const hash = window.location.hash.slice(1);
      const aliases: Record<string, string> = { work: "pixie", about: "contact", top: "intro" };
      const index = chapters.findIndex(({ id }) => id === (aliases[hash] ?? hash));
      if (index >= 0 && track) track.scrollLeft = stopsFor(track)[index];
      else if (!hash && track) track.scrollLeft = 0;
      trackPosition();
    }

    function moveOnWheel(event: WheelEvent) {
      if (!track || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey) return;
      setPreview(null);
      setReveal(false);
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;

      // A short viewport or long chapter can scroll vertically before advancing the strip.
      const chapter = (event.target as Element).closest<HTMLElement>(".chapter");
      if (chapter) {
        const remaining = chapter.scrollHeight - chapter.clientHeight - chapter.scrollTop;
        if (event.deltaY > 0 ? remaining > 1 : chapter.scrollTop > 1) return;
      }
      if (event.cancelable) event.preventDefault();
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? track.clientWidth : 1;
      track.scrollLeft += event.deltaY * unit;
    }

    followHash();
    track.addEventListener("wheel", moveOnWheel, { passive: false });
    const observer = new ResizeObserver(trackPosition);
    observer.observe(track);
    window.addEventListener("hashchange", followHash);
    return () => {
      observer.disconnect();
      track.removeEventListener("wheel", moveOnWheel);
      window.removeEventListener("hashchange", followHash);
    };
  }, [chapters]);

  function goTo(index: number) {
    const track = rail.current;
    if (!track || !chapters[index]) return;
    const hash = "#" + chapters[index].id;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    setReveal(false);
    track.scrollLeft = stopsFor(track)[index];
    trackPosition();
  }

  function beginScrub(event: PointerEvent<HTMLElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    setReveal(false);
    suppressClick.current = false;
    scrub.current = { pointerId: event.pointerId, originX: event.clientX, started: false };
  }

  function moveScrub(event: PointerEvent<HTMLElement>) {
    const gesture = scrub.current;
    const track = rail.current;
    if (!gesture || gesture.pointerId !== event.pointerId || !track) return;
    if (event.pointerType === "mouse" && !(event.buttons & 1)) {
      endScrub(event);
      return;
    }
    if (!gesture.started) {
      if (Math.abs(event.clientX - gesture.originX) < 5) return;
      gesture.started = true;
      suppressClick.current = true;
      setScrubbing(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const stops = stopsFor(track);
    const position = Math.max(0, Math.min(stops.length - 1, ((event.clientX - bounds.left) / bounds.width) * stops.length - 0.5));
    const lower = Math.floor(position);
    const upper = Math.min(stops.length - 1, lower + 1);
    track.scrollLeft = stops[lower] + (stops[upper] - stops[lower]) * (position - lower);
    trackPosition();
  }

  function endScrub(event: PointerEvent<HTMLElement>) {
    if (scrub.current?.pointerId !== event.pointerId) return;
    const gestureMoved = scrub.current.started;
    scrub.current = null;
    if (gestureMoved) {
      setScrubbing(false);
      setPreview(null);
    }
  }

  function navigate(event: KeyboardEvent, index: number, moveFocus: boolean) {
    const directions: Record<string, number> = {
      ArrowLeft: Math.max(0, index - 1),
      ArrowRight: Math.min(chapters.length - 1, index + 1),
      Home: 0,
      End: chapters.length - 1,
    };
    const next = directions[event.key];
    if (typeof next !== "number") return;
    event.preventDefault();
    goTo(next);
    if (moveFocus) ruler.current?.querySelectorAll("a")[next]?.focus({ preventScroll: true });
  }

  return (
    <>
      <nav className="ruler" ref={ruler} aria-label="Portfolio chapters"
        data-scrubbing={scrubbing || undefined}
        style={{ gridTemplateColumns: `repeat(${chapters.length}, var(--stop-width))` }}
        onPointerLeave={() => setPreview(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPreview(null);
        }}
        onPointerDown={beginScrub} onPointerMove={moveScrub}
        onPointerUp={endScrub} onPointerCancel={endScrub} onLostPointerCapture={endScrub}
        onClickCapture={(event) => {
          if (!suppressClick.current || event.detail === 0) return;
          suppressClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}>
        <div className="map-readout" aria-hidden="true">
          {chapters[selected].label}
        </div>
        <div className="map-viewfinder" aria-hidden="true" />
        {chapters.map(({ id, label }, index) => (
          <a key={id} className="ruler-stop" href={`#${id}`} draggable={false}
            aria-label={label}
            aria-current={active === index ? "location" : undefined}
            data-map-key={id}
            onPointerEnter={(event) => { if (event.pointerType === "mouse") setPreview(index); }}
            onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) setPreview(index); }}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              goTo(index);
            }}
            onKeyDown={(event) => navigate(event, index, true)}>
            <span className="map-landmark" aria-hidden="true"><i /><i /><i /></span>
          </a>
        ))}
      </nav>
      <main className="strip" ref={rail} onScroll={trackPosition} tabIndex={0}
        aria-label="Horizontal portfolio"
        data-reveal={reveal || undefined}
        onFocusCapture={() => setReveal(false)}
        onPointerDown={() => setReveal(false)}
        onAnimationEnd={(event) => {
          if (event.animationName === "index-unfold") setReveal(false);
        }}
        onClick={(event) => {
          if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
          const index = chapters.findIndex(({ id }) => link?.hash === "#" + id);
          if (index < 0) return;
          event.preventDefault();
          goTo(index);
          const heading = rail.current?.children[index]?.querySelector<HTMLElement>("h1, h2");
          if (heading) {
            heading.tabIndex = -1;
            heading.focus({ preventScroll: true });
          }
        }}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget) navigate(event, active, false);
        }}>
        {chapters.map(({ id, content }) => (
          <section key={id} className={`chapter chapter-${id}`} id={id} aria-labelledby={`title-${id}`}>
            <div className="chapter-content">{content}</div>
          </section>
        ))}
      </main>
    </>
  );
}
