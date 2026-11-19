import { useEffect, useState } from "react";
import {
  deriveLabProjects,
  GITHUB_USER,
  LAB_WINDOW_DAYS,
  type GitHubActivity,
  type GitHubRepository,
  type LabProject,
} from "./labs";

const REFRESH_MS = 30 * 60 * 1000;
const STORAGE_KEY = "0xque:labs:v1";

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

  return (
    <div className="labs">
      <div className="labs-heading">
        <div>
          <h2 id="labs-title" className="label">labs</h2>
          <p className="labs-intro">stuff i've been working on lately, straight from github.</p>
        </div>
        <a
          className="labs-profile"
          href={`https://github.com/${GITHUB_USER}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          github ↗
        </a>
      </div>
      <p className="labs-source" aria-live="polite">
        {state.status === "loading" && "checking recent public activity…"}
        {state.status === "error" && "github activity is unavailable right now."}
        {state.status === "ready" && (
          <>
            public activity from the last {LAB_WINDOW_DAYS} days · synced{" "}
            <time dateTime={new Date(state.snapshot.fetchedAt).toISOString()}>
              {new Date(state.snapshot.fetchedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </time>
            {state.stale ? " · showing cached results" : ""}
            {!state.snapshot.eventsAvailable ? " · based on repo updates" : ""}
          </>
        )}
      </p>
      {state.status === "ready" && state.snapshot.items.length > 0 && (
        <ul className="labs-grid">
          {state.snapshot.items.map((project) => (
            <li className="lab-card" key={project.repoUrl}>
              <div className="lab-card-top">
                <h3>{project.name}</h3>
                <span className="lab-recency">
                  <time dateTime={project.lastActivity}>{relativeDate(project.lastActivity)}</time>
                </span>
              </div>
              <p className="lab-description">
                {project.description || "no description yet."}
              </p>
              <div className="lab-meta">
                {project.language && <span>{project.language}</span>}
                <span>
                  {project.hasPersonalActivity
                    ? `${project.activityCount} public action${project.activityCount === 1 ? "" : "s"}`
                    : "repo updated"}
                </span>
              </div>
              <div className="actions">
                <a className="btn btn--dark btn--sm" href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                  code ↗
                </a>
                {project.homepage && (
                  <a className="btn btn--fill btn--sm" href={project.homepage} target="_blank" rel="noopener noreferrer">
                    site ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {state.status === "ready" && state.snapshot.items.length === 0 && (
        <p className="labs-empty">
          no public repo updates in the last {LAB_WINDOW_DAYS} days. see github for the full archive.
        </p>
      )}
      {state.status === "error" && (
        <p className="labs-empty">
          you can still browse my projects on{" "}
          <a href={`https://github.com/${GITHUB_USER}?tab=repositories`} target="_blank" rel="noopener noreferrer">
            github ↗
          </a>
        </p>
      )}
      <p className="labs-note">
        inferred from public pushes and coding events. recent activity doesn't always mean a project is actively in development.
      </p>
    </div>
  );
}
