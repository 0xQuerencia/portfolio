import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

type Chapter = { id: string; label: string; content: ReactNode };

export default function IndexRail({ chapters }: { chapters: Chapter[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const ruler = useRef<HTMLElement>(null);
  const scrub = useRef<{ pointerId: number; originX: number; started: boolean } | null>(null);
  const suppressClick = useRef(false);
  const announcementTimer = useRef<number>(undefined);
  const [active, setActive] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => () => window.clearTimeout(announcementTimer.current), []);

  useEffect(() => {
    function followHash() {
      const hash = window.location.hash.slice(1);
      const aliases: Record<string, string> = { work: "pixie", about: "contact", top: "intro" };
      const index = chapters.findIndex(({ id }) => id === (aliases[hash] ?? hash));
      const panel = rail.current?.children[index] as HTMLElement | undefined;
      if (panel) rail.current?.scrollTo({ left: panel.offsetLeft, behavior: "instant" });
    }

    followHash();
    window.addEventListener("hashchange", followHash);
    return () => window.removeEventListener("hashchange", followHash);
  }, [chapters]);

  function goTo(index: number) {
    const panel = rail.current?.children[index] as HTMLElement | undefined;
    if (!panel) return;
    const hash = "#" + chapters[index].id;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    rail.current?.scrollTo({ left: panel.offsetLeft });
    setAnnouncement(chapters[index].label);
  }

  function trackPosition() {
    const track = rail.current;
    const stride = (track?.children[1] as HTMLElement | undefined)?.offsetLeft;
    if (!track || !stride) return;
    const position = Math.min(chapters.length - 1, Math.max(0, track.scrollLeft / stride));
    ruler.current?.style.setProperty("--position", String(position));
    const nearest = Math.round(position);
    setActive(nearest);
    window.clearTimeout(announcementTimer.current);
    announcementTimer.current = window.setTimeout(() => setAnnouncement(chapters[nearest].label), 180);
  }

  function beginScrub(event: PointerEvent<HTMLElement>) {
    suppressClick.current = false;
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    scrub.current = { pointerId: event.pointerId, originX: event.clientX, started: false };
  }

  function moveScrub(event: PointerEvent<HTMLElement>) {
    const gesture = scrub.current;
    const track = rail.current;
    const stride = (track?.children[1] as HTMLElement | undefined)?.offsetLeft;
    if (!gesture || gesture.pointerId !== event.pointerId || !track || !stride) return;
    if (!(event.buttons & 1)) {
      endScrub(event);
      return;
    }
    if (!gesture.started) {
      if (Math.abs(event.clientX - gesture.originX) < 5) return;
      gesture.started = true;
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      track.dataset.scrubbing = "true";
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = ((event.clientX - bounds.left) / bounds.width) * chapters.length - 0.5;
    track.scrollLeft = Math.max(0, Math.min(chapters.length - 1, position)) * stride;
  }

  function endScrub(event: PointerEvent<HTMLElement>) {
    const gesture = scrub.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    scrub.current = null;
    const track = rail.current;
    const stride = (track?.children[1] as HTMLElement | undefined)?.offsetLeft;
    if (!gesture.started || !track || !stride) return;
    const nearest = Math.min(chapters.length - 1, Math.max(0, Math.round(track.scrollLeft / stride)));
    delete track.dataset.scrubbing;
    goTo(nearest);
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
    if (moveFocus) ruler.current?.querySelectorAll("a")[next]?.focus();
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
      <p className="sr-only" role="status">{announcement}</p>
      <main className="strip" ref={rail} onScroll={trackPosition} tabIndex={0}
        aria-label="Horizontal portfolio"
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
