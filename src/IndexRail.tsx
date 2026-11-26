import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type Chapter = { id: string; label: string; content: ReactNode };

export default function IndexRail({ chapters }: { chapters: Chapter[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const ruler = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

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
  }

  function trackPosition() {
    const track = rail.current;
    const stride = (track?.children[1] as HTMLElement | undefined)?.offsetLeft;
    if (!track || !stride) return;
    const position = Math.min(chapters.length - 1, Math.max(0, track.scrollLeft / stride));
    ruler.current?.style.setProperty("--position", String(position));
    setActive(Math.round(position));
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
      <nav className="ruler" ref={ruler} aria-label="Portfolio chapters">
        {chapters.map(({ id, label }, index) => (
          <a key={id} className="ruler-stop" href={`#${id}`}
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
