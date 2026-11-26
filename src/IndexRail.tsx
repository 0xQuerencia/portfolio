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
  const [active, setActive] = useState(0);

  function trackPosition() {
    const track = rail.current;
    if (!track) return;
    const position = rulerPosition(stopsFor(track), track.scrollLeft);
    ruler.current?.style.setProperty("--position", String(position));
    setActive(Math.round(position));
  }

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

    followHash();
    const observer = new ResizeObserver(trackPosition);
    observer.observe(track);
    window.addEventListener("hashchange", followHash);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", followHash);
    };
  }, [chapters]);

  function goTo(index: number) {
    const track = rail.current;
    if (!track || !chapters[index]) return;
    const hash = "#" + chapters[index].id;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    track.scrollLeft = stopsFor(track)[index];
    trackPosition();
  }

  function beginScrub(event: PointerEvent<HTMLElement>) {
    if (!event.isPrimary || event.button !== 0) return;
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
    if (scrub.current?.pointerId === event.pointerId) scrub.current = null;
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
        onPointerDown={beginScrub} onPointerMove={moveScrub}
        onPointerUp={endScrub} onPointerCancel={endScrub} onLostPointerCapture={endScrub}
        onClickCapture={(event) => {
          if (!suppressClick.current || event.detail === 0) return;
          suppressClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}>
        {chapters.map(({ id, label }, index) => (
          <a key={id} className="ruler-stop" href={`#${id}`} draggable={false}
            aria-current={active === index ? "location" : undefined}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              goTo(index);
            }}
            onKeyDown={(event) => navigate(event, index, true)}>
            <span>{label}</span>
          </a>
        ))}
      </nav>
      <main className="strip" ref={rail} onScroll={trackPosition} tabIndex={0}
        aria-label="Horizontal portfolio"
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
