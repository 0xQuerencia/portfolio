import { useEffect, useState } from "react";
import {
  deriveLabProjects,
  GITHUB_USER,
  LAB_WINDOW_DAYS,
  LAB_MAX_PROJECTS,
  type GitHubActivity,
  type GitHubRepository,
  type LabProject,
} from "./labs";

const REFRESH_MS = 30 * 60 * 1000;
const STORAGE_KEY = "0xque:labs:v2";

interface Snapshot {
  items: LabProject[];
  fetchedAt: number;
  eventsAvailable: boolean;
}

type LabsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; snapshot: Snapshot; stale?: boolean };

function readCache(): Snapshot | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const snapshot = value as Snapshot;
    if (
      !Array.isArray(snapshot.items) ||
      typeof snapshot.fetchedAt !== "number" ||
      typeof snapshot.eventsAvailable !== "boolean" ||
      Date.now() - snapshot.fetchedAt > REFRESH_MS ||
      snapshot.fetchedAt > Date.now()
    ) return null;
    return snapshot;
  } catch {
    return null;
  }
}

function saveCache(snapshot: Snapshot) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // The live view works without browser storage.
  }
}

async function fetchGitHub(path: string, signal: AbortSignal): Promise<unknown[]> {
  const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/${path}`, {
    signal,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("Unexpected GitHub response");
  return data;
}

function relativeDate(value: string) {
  const days = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default function Labs() {
  const [state, setState] = useState<LabsState>(() => {
    const snapshot = readCache();
    return snapshot ? { status: "ready", snapshot } : { status: "loading" };
  });

  useEffect(() => {
    let cancelled = false;
    let controller: AbortController | null = null;

    const refresh = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const [repositories, eventsResult] = await Promise.all([
          fetchGitHub("repos?type=owner&sort=pushed&direction=desc&per_page=100", controller.signal),
          fetchGitHub("events/public?per_page=100", controller.signal)
            .then((events) => ({ events, available: true }))
            .catch((error: unknown) => {
              if (error instanceof Error && error.name === "AbortError") throw error;
              return { events: [] as unknown[], available: false };
            }),
        ]);
        if (cancelled) return;
        const snapshot: Snapshot = {
          items: deriveLabProjects(
            repositories as GitHubRepository[],
            eventsResult.events as GitHubActivity[],
          ),
          fetchedAt: Date.now(),
          eventsAvailable: eventsResult.available,
        };
        saveCache(snapshot);
        setState({ status: "ready", snapshot });
      } catch {
        if (cancelled || controller?.signal.aborted) return;
        setState((previous) =>
          previous.status === "ready"
            ? { ...previous, stale: true }
            : { status: "error" },
        );
      }
    };

    if (!readCache()) void refresh();
    const interval = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      controller?.abort();
    };
  }, []);

  const items = state.status === "ready" ? state.snapshot.items : [];
  const focus = items[0];
  const queue = items.slice(1);

  return (
    <div className="labs">
      <header className="labs-heading">
        <div>
          <p className="lab-kicker">/ workspace · public github activity</p>
          <h2 id="labs-title" className="label">labs<span className="lab-cursor">_</span></h2>
          <p className="labs-intro">what's on my desk lately.</p>
        </div>
        <div className="lab-status">
          <span className="lab-live-dot" aria-hidden="true" />
          <span>recent work</span>
        </div>
      </header>

      {state.status === "loading" && (
        <p className="labs-empty" role="status">checking my recent github activity…</p>
      )}
      {state.status === "error" && (
        <p className="labs-empty">
          github's not responding right now.{" "}
          <a href={`https://github.com/${GITHUB_USER}?tab=repositories`} target="_blank" rel="noopener noreferrer">
            browse repos ↗
          </a>
        </p>
      )}

      {focus && (
        <div className="lab-workspace" aria-label="What I'm working on">
          <article className="lab-focus">
            <div className="lab-focus-top">
              <span className="lab-eyebrow">01 / on the bench</span>
              <span className="lab-focus-indicator">● recent activity</span>
            </div>
            <p className="lab-path">~/labs/{focus.name}</p>
            <h3>{focus.name}</h3>
            <p className="lab-focus-description">{focus.description || "figuring this one out as i go."}</p>
            <div className="lab-focus-bottom">
              <div className="lab-focus-meta">
                {focus.language && <span>{focus.language}</span>}
                <span>
                  {focus.hasPersonalActivity ? "public coding activity" : "repo updated"} ·{" "}
                  <time dateTime={focus.lastActivity}>{relativeDate(focus.lastActivity)}</time>
                </span>
              </div>
              <a href={focus.repoUrl} target="_blank" rel="noopener noreferrer" className="lab-focus-link">
                view repo <span aria-hidden="true">↗</span>
              </a>
            </div>
          </article>
          <div className="lab-queue">
            <div className="lab-queue-heading">
              <span>also on the bench</span>
              <span>{String(queue.length).padStart(2, "0")} / {String(LAB_MAX_PROJECTS - 1).padStart(2, "0")}</span>
            </div>
            {queue.length ? (
              <ol className="lab-queue-list">
                {queue.map((project, index) => (
                  <li key={project.repoUrl}>
                    <a className="lab-queue-link" href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                      <span className="lab-queue-number">0{index + 2}</span>
                      <span className="lab-queue-main">
                        <strong>{project.name}</strong>
                        <span className="lab-queue-description">{project.description || "something in progress."}</span>
                        <span className="lab-queue-date">
                          {project.language ? `${project.language} · ` : ""}
                          <time dateTime={project.lastActivity}>{relativeDate(project.lastActivity)}</time>
                        </span>
                      </span>
                      <span className="lab-queue-arrow" aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="lab-queue-empty">room for the next idea.</p>
            )}
            <a
              className="lab-all-link"
              href={`https://github.com/${GITHUB_USER}?tab=repositories`}
              target="_blank"
              rel="noopener noreferrer"
            >
              all repositories <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      )}

      {state.status === "ready" && items.length === 0 && (
        <p className="labs-empty">
          nothing active in public repos over the last {LAB_WINDOW_DAYS} days.{" "}
          <a href={`https://github.com/${GITHUB_USER}`} target="_blank" rel="noopener noreferrer">
            see github ↗
          </a>
        </p>
      )}

      {state.status === "ready" && (
        <p className="labs-source" aria-live="polite">
          showing up to {LAB_MAX_PROJECTS} repositories · last {LAB_WINDOW_DAYS} days · checked{" "}
          <time dateTime={new Date(state.snapshot.fetchedAt).toISOString()}>
            {new Date(state.snapshot.fetchedAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
          {state.stale ? " · cached snapshot" : ""}
          {!state.snapshot.eventsAvailable ? " · repo updates only" : ""}
          <span className="lab-caveat"> · inferred from public activity, not a work-status declaration</span>
        </p>
      )}
    </div>
  );
}
