import { useEffect, useRef, useState } from "react";

const email = "me@querencia.art";

type CopyStatus = "idle" | "copied" | "failed";

function Contact() {
  const address = useRef<HTMLAnchorElement>(null);
  const resetTimer = useRef<number>(undefined);
  const copying = useRef(false);
  const [status, setStatus] = useState<CopyStatus>("idle");

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  async function copyEmail() {
    if (copying.current) return;
    copying.current = true;
    window.clearTimeout(resetTimer.current);
    setStatus("idle");

    try {
      await navigator.clipboard.writeText(email);
      setStatus("copied");
      resetTimer.current = window.setTimeout(() => setStatus("idle"), 2800);
    } catch {
      const selection = window.getSelection();
      if (selection && address.current) {
        const range = document.createRange();
        range.selectNodeContents(address.current);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setStatus("failed");
    } finally {
      copying.current = false;
    }
  }

  return (
    <section className="contact" id="contact" aria-labelledby="contact-heading" tabIndex={-1}>
      <h2 className="section-title" id="contact-heading">Contact</h2>
      <div className="contact-actions">
        <a className="email" href={`mailto:${email}`} ref={address}>{email}</a>
        <button
          className="copy"
          type="button"
          onClick={copyEmail}
          data-status={status}
          aria-label={status === "copied" ? "Copied. Copy email again" : "Copy email"}
        >
          <span aria-hidden="true">Copy email</span>
          <span aria-hidden="true">Copied</span>
        </button>
      </div>
      <p className="copy-status" role="status">
        {status === "copied" && <span className="sr-only">Email address copied.</span>}
        {status === "failed" && "Clipboard unavailable. You can copy the address manually."}
      </p>
      <a className="github" href="https://github.com/0xQuerencia">GitHub</a>
    </section>
  );
}

export default function App() {
  return (
    <div className="page" id="top">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <a className="wordmark" href="#top">querencia.art</a>
        <nav aria-label="Main">
          <ul>
            <li><a href="#work">work</a></li>
            <li><a href="#experiments">experiments</a></li>
            <li><a href="#about">about</a></li>
            <li><a href="#contact">contact</a></li>
          </ul>
        </nav>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="intro" aria-labelledby="intro-heading">
          <h1 id="intro-heading">
            <span>hey, i’m ricky.</span>
            <span>i build things i wish existed.</span>
          </h1>
          <p>I'd rather build it than pay for it.</p>
        </section>

        <section className="work-index" id="work" aria-labelledby="work-heading" tabIndex={-1}>
          <h2 className="section-title" id="work-heading">Selected Work</h2>
          <article className="work" id="pixie" tabIndex={-1}>
            <h3>Pixie</h3>
            <div>
              <p>I built a Slack support bot for Hack Club programs.</p>
              <ul className="project-links" aria-label="Pixie links">
                <li><a href="https://pixie.support">Open Pixie</a></li>
                <li><a href="https://github.com/0xQuerencia/pixie">View source</a></li>
              </ul>
            </div>
          </article>
          <article className="work" id="pixl" tabIndex={-1}>
            <h3>Pixl</h3>
            <div>
              <p>I contributed to Hack Club’s pixel-themed You Ship, We Ship program, including fixes for how projects earn pixel credits.</p>
              <ul className="project-links" aria-label="Pixl links">
                <li><a href="https://pixl.hackclub.com">Open Pixl</a></li>
                <li><a href="https://github.com/hackclub/pixl">View source</a></li>
              </ul>
            </div>
          </article>
          <article className="work" id="ripple" tabIndex={-1}>
            <h3>Ripple</h3>
            <div>
              <p>I made a tool for exploring what-if questions by tracing chains of cause and effect.</p>
              <ul className="project-links" aria-label="Ripple links">
                <li><a href="https://ripple.querencia.art">Open Ripple</a></li>
                <li><a href="https://github.com/0xQuerencia/ripple">View source</a></li>
              </ul>
            </div>
          </article>
        </section>

        <section className="experiments" id="experiments" aria-labelledby="experiments-heading" tabIndex={-1}>
          <h2 className="section-title" id="experiments-heading">Experiments</h2>
          <p>I wanted a copy button that gives feedback without moving the page. <a href="#contact">Try it below</a>.</p>
        </section>

        <section className="about" id="about" aria-labelledby="about-heading" tabIndex={-1}>
          <h2 className="section-title" id="about-heading">About</h2>
          <p>I’m Ricky Parmar, a student developer from India. I like tinkering with Linux, desktop workflows, and small tools for problems I run into.</p>
        </section>

        <Contact />
      </main>
    </div>
  );
}
