import { useLayoutEffect, useRef, useState } from "react";
import { Ascii } from "ascii.rest/react";
import * as earthrise from "ascii.rest/pieces/earthrise";
import { projects } from "./data";
import Labs from "./Labs";
import GitHubHeatmap from "./GitHubHeatmap";
import PixlPreview from "./PixlPreview";
import { useHorizontalScroll } from "./useHorizontalScroll";

const PANEL_COUNT = 5;
// Panel indexes, in track order.
const HOME = 0;
const ABOUT = 1;
const PROJECTS = 2;
const LABS = 3;
const CONTACT = 4;

const PROMPT_PATHS = ["~", "~/about", "~/projects", "~/labs", "~/contact"] as const;

const PROJECT_SCREENSHOTS: Record<string, string> = {
  pixie: "Pixie website with a pixel-art night scene and setup page",
  x: "X website showing the dictation app and desktop interface",
  ripple: "Ripple website with pixel characters and its what-if tagline",
};


const PROJECT_TAGS: Record<string, readonly string[]> = {
  pixl: ["YSWS"],
  aether: ["Hyprland", "Quickshell"],
  x: ["Linux", "dictation"],
  pixie: ["Slack", "bot"],
  ripple: ["simulation"],
};

// Drawn icons, one stroke weight, in currentColor.
const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const MailIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <path d="M17.5 6.5h.01" />
  </svg>
);

export default function App() {
  const { outerRef, trackRef, goTo, active } = useHorizontalScroll(PANEL_COUNT);
  const navLinksRef = useRef<HTMLUListElement>(null);
  const [navUnderline, setNavUnderline] = useState<{ x: number; y: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const list = navLinksRef.current;
    if (!list) return;

    const updateUnderline = () => {
      const link = list.querySelectorAll<HTMLAnchorElement>("a")[active];
      if (!link) return;
      const container = list.getBoundingClientRect();
      const target = link.getBoundingClientRect();
      setNavUnderline({
        x: target.left - container.left,
        y: target.bottom - container.top - 7,
        width: target.width,
      });
    };

    updateUnderline();
    const observer = new ResizeObserver(updateUnderline);
    observer.observe(list);
    list.querySelectorAll("a").forEach((link) => observer.observe(link));
    window.addEventListener("resize", updateUnderline);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateUnderline);
    };
  }, [active]);

  const navLink = (label: string, index: number) => {
    const isActive = index === active;
    return (
    <li>
      <a
        href={`#${label}`}
        className={isActive ? "active" : undefined}
        aria-current={isActive ? "page" : undefined}
        onClick={(e) => {
          e.preventDefault();
          goTo(index);
        }}
      >
        {label}
      </a>
    </li>
    );
  };

  return (
    <main>
      {/* Fixed backdrop: the earthrise piece from ascii.rest (MIT) stays put while the panels slide. */}
      <div className="backdrop" aria-hidden="true">
        <Ascii piece={earthrise} label="" />
      </div>
      <div className="veil" aria-hidden="true" />
      <div className="edge-fade" aria-hidden="true" />

      <nav className="nav" aria-label="Main">
        <span className="prompt">
          0xque@home:<span className="prompt-path" key={active}>{PROMPT_PATHS[active] ?? "~"}</span>
        </span>
        <ul className="nav-links" ref={navLinksRef}>
          {navLink("home", HOME)}
          {navLink("about", ABOUT)}
          {navLink("projects", PROJECTS)}
          {navLink("labs", LABS)}
          {navLink("contact", CONTACT)}
          <li
            className="nav-underline"
            aria-hidden="true"
            style={navUnderline ? {
              width: navUnderline.width,
              transform: `translate3d(${navUnderline.x}px, ${navUnderline.y}px, 0)`,
              opacity: 1,
            } : undefined}
          />
        </ul>
      </nav>

      <div className="h-outer" ref={outerRef}>
        <div className="h-sticky">
          <div className="h-track" ref={trackRef}>
            <section className="panel hero" aria-label="Home">
              <h1 className="hello">
                hello, world.
                <br />
                i'm <span className="accent">0xque</span>
              </h1>
              <p className="tagline">I'd rather build it than pay for it.</p>
              <div className="btns">
                <button type="button" className="btn btn--primary" onClick={() => goTo(PROJECTS)}>
                  view projects <span className="btn-arrow" aria-hidden="true">→</span>
                </button>
                <button type="button" className="btn" onClick={() => goTo(ABOUT)}>
                  about me
                </button>
              </div>
            </section>

            <section className="panel" aria-labelledby="about-title">
              <div className="about">
                <h2 id="about-title" className="label">about me</h2>
                <p>
                  Hey there, I'm Ricky, also known online as <span className="hl">0xQuerencia</span>.
                </p>
                <p>
                  I enjoy messing around with linux, building dev tools, ricing, and automation cuz I am lazy asf.
                </p>
                <p>
                  And I mostly build whatever idea comes up in my mind at 3 am on a random tuesday.
                </p>
                <GitHubHeatmap />
              </div>
            </section>

            <section className="panel" aria-labelledby="projects-title">
              <div className="projects">
                <h2 id="projects-title" className="label">projects</h2>
                <ul className="project-bento">
                  {projects.map((project) => (
                    <li className={`project-card project-card--${project.name}`} key={project.name}>
                      <div className="project-card-content">
                        <h3>{project.name}</h3>
                        <p>{project.description}</p>
                        {PROJECT_TAGS[project.name] && (
                          <div className="project-tags">
                            {PROJECT_TAGS[project.name].map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="project-actions">
                          {project.url && (
                            <a className="btn project-open-site" href={project.url} target="_blank" rel="noopener noreferrer">
                              Open site <span className="btn-arrow" aria-hidden="true">↗</span>
                            </a>
                          )}
                          <a className="btn project-view-code" href={project.repo} target="_blank" rel="noopener noreferrer">
                            View code <span className="btn-arrow" aria-hidden="true">↗</span>
                          </a>
                        </div>
                      </div>
                      {project.name === "pixl" && <PixlPreview />}
                      {PROJECT_SCREENSHOTS[project.name] && (
                        <div className={`project-screenshot project-screenshot--${project.name}`}>
                          <img
                            src={project.name === "ripple" ? "/previews/ripple-v2.webp" : `/previews/${project.name}.webp`}
                            alt={PROJECT_SCREENSHOTS[project.name]}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="panel panel--labs" id="labs" aria-labelledby="labs-title">
              <Labs />
            </section>

            <section className="panel contact" id="contact" aria-labelledby="contact-title">
              <div className="contact-inner">
                <h2 id="contact-title" className="contact-title">contact</h2>
                <ul className="contact-links">
                  <li>
                    <a href="mailto:me@querencia.art">
                      <MailIcon />
                      me@querencia.art
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com/0xQuerencia" target="_blank" rel="noopener noreferrer">
                      <GithubIcon />
                      github
                    </a>
                  </li>
                  <li>
                    <a href="https://instagram.com/querencia.wiz" target="_blank" rel="noopener noreferrer">
                      <InstagramIcon />
                      instagram
                    </a>
                  </li>
                </ul>
              </div>
              <footer className="foot">
                <p className="credit">
                  Background: earthrise by <a href="https://github.com/bas3line/ascii" target="_blank" rel="noopener noreferrer">ascii.rest</a>,
                  MIT licensed.
                </p>
              </footer>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
