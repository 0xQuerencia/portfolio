import IndexRail from "./IndexRail";
import { useEffect, useRef, useState } from "react";

const email = "me@querencia.art";

type CopyStatus = "idle" | "copied" | "failed";

function CopyEmail() {
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
    <div className="copy-specimen">
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
    </div>
  );
}

const chapters = [
  {
    id: "intro",
    label: "Intro",
    content: <>
      <div className="intro-copy">
        <p className="identity">0xque</p>
        <h1 id="title-intro">hey, i’m ricky.</h1>
        <p className="intro-line">i build things i wish existed.</p>
        <p className="motto">I'd rather build it than pay for it.</p>
      </div>
      <img className="readme-sky" src="/readme-sky.svg" width="157" height="145" alt="" />
    </>,
  },
  {
    id: "pixie",
    label: "Pixie",
    content: <>
      <h2 id="title-pixie">Pixie</h2>
      <p className="chapter-description">I built a Slack support bot for Hack Club programs.</p>
      <div className="links">
        <a href="https://pixie.support">Open Pixie</a>
        <a href="https://github.com/0xQuerencia/pixie">View source</a>
      </div>
    </>,
  },
  {
    id: "pixl",
    label: "Pixl",
    content: <>
      <h2 id="title-pixl">Pixl</h2>
      <div className="project-detail">
        <p className="chapter-description">I contributed to Hack Club’s pixel-themed You Ship, We Ship program, including fixes for how projects earn pixel credits.</p>
        <div className="links">
          <a href="https://pixl.hackclub.com">Open Pixl</a>
          <a href="https://github.com/hackclub/pixl">View source</a>
        </div>
      </div>
    </>,
  },
  {
    id: "ripple",
    label: "Ripple",
    content: <>
      <h2 id="title-ripple">Ripple</h2>
      <p className="chapter-description">I made a tool for exploring what-if questions by tracing chains of cause and effect.</p>
      <div className="links">
        <a href="https://ripple.querencia.art">Open Ripple</a>
        <a href="https://github.com/0xQuerencia/ripple">View source</a>
      </div>
    </>,
  },
  {
    id: "experiments",
    label: "Experiments",
    content: <>
      <h2 id="title-experiments">Experiments</h2>
      <p className="chapter-description">I wanted a copy button that gives feedback without moving the page.</p>
      <CopyEmail />
    </>,
  },
  {
    id: "contact",
    label: "About & Contact",
    content: <>
      <h2 id="title-contact">About &amp; Contact</h2>
      <p className="chapter-description">I’m Ricky Parmar, a student developer from India. I like tinkering with Linux, desktop workflows, and small tools for problems I run into.</p>
      <div className="links">
        <a href={`mailto:${email}`}>{email}</a>
        <a href="https://github.com/0xQuerencia">GitHub</a>
      </div>
    </>,
  },
];

export default function App() {
  return <IndexRail chapters={chapters} />;
}
