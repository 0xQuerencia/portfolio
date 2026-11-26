import { useRef, useState, type CSSProperties, type KeyboardEvent, type UIEvent } from "react";

const stops = ["Intro", "Pixie", "Pixl", "Experiments"];

export default function IndexRail() {
  const viewport = useRef<HTMLDivElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function goTo(index: number) {
    const rail = viewport.current;
    const panel = rail?.children[index] as HTMLElement | undefined;
    if (rail && panel) rail.scrollTo({ left: panel.offsetLeft });
  }

  function trackPosition(event: UIEvent<HTMLDivElement>) {
    const rail = event.currentTarget;
    const nearest = Array.from(rail.children).reduce((best, panel, index) => {
      const distance = Math.abs((panel as HTMLElement).offsetLeft - rail.scrollLeft);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Infinity });
    setActive(nearest.index);
  }

  function navigate(event: KeyboardEvent, index: number, moveFocus: boolean) {
    const directions: Record<string, number> = {
      ArrowLeft: Math.max(0, index - 1),
      ArrowRight: Math.min(stops.length - 1, index + 1),
      Home: 0,
      End: stops.length - 1,
    };
    const next = directions[event.key];
    if (typeof next !== "number") return;
    event.preventDefault();
    goTo(next);
    if (moveFocus) (controls.current?.children[next] as HTMLButtonElement | undefined)?.focus();
  }

  return (
    <section className="index-rail" aria-label="Index Rail">
      <div className="rail-controls" ref={controls} style={{ "--stop": active } as CSSProperties} role="group" aria-label="Choose an index panel">
        {stops.map((name, index) => (
          <button key={name} type="button" aria-controls={`rail-panel-${index}`}
            aria-current={active === index ? "true" : undefined}
            onClick={() => goTo(index)} onKeyDown={(event) => navigate(event, index, true)}>
            <span>{name}</span>
          </button>
        ))}
      </div>
      <div className="rail-viewport" ref={viewport} onScroll={trackPosition} tabIndex={0}
        role="group" aria-label="Index panels"
        onKeyDown={(event) => {
          if (event.target === event.currentTarget) navigate(event, active, false);
        }}>
        <section className="intro rail-panel" id="rail-panel-0" aria-labelledby="intro-heading">
          <h1 id="intro-heading">
            <span>hey, i’m ricky.</span>
            <span>i build things i wish existed.</span>
          </h1>
          <p>I'd rather build it than pay for it.</p>
        </section>
        <section className="rail-panel rail-feature" id="rail-panel-1" aria-labelledby="rail-pixie">
          <h2 id="rail-pixie">Pixie</h2>
          <p>Slack support for Hack Club programs.</p>
          <a href="#pixie">See Pixie in Selected Work</a>
        </section>
        <section className="rail-panel rail-feature rail-pixl" id="rail-panel-2" aria-labelledby="rail-pixl">
          <h2 id="rail-pixl">Pixl</h2>
          <p>I contributed to Hack Club’s pixel-themed You Ship, We Ship program.</p>
          <a href="#pixl">See Pixl in Selected Work</a>
        </section>
        <section className="rail-panel rail-feature rail-experiments" id="rail-panel-3" aria-labelledby="rail-experiments">
          <h2 id="rail-experiments">Experiments</h2>
          <p>A copy button that gives feedback in place.</p>
          <a href="#experiments">Try the experiment</a>
        </section>
      </div>
    </section>
  );
}
