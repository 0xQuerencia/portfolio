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
  const [selectedRepoUrl, setSelectedRepoUrl] = useState<string | null>(null);

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
  const selected = items.find((item) => item.repoUrl === selectedRepoUrl) ?? items[0];
  const selectedNumber = selected ? items.findIndex((item) => item.repoUrl === selected.repoUrl) + 1 : 0;
  const allReposUrl = "https://github.com/" + GITHUB_USER + "?tab=repositories";

  return (
    <div className="labs">
      <header className="labs-heading">
        <div>
          <p className="labs-overline">/ workspace / github</p>
          <h2 id="labs-title" className="label">labs<span className="labs-cursor">_</span></h2>
          <p className="labs-intro">a little window into what i've been building lately.</p>
        </div>
        <div className="labs-status">
          <span className="labs-status-dot" aria-hidden="true" />
          <span>public activity <span className="labs-status-muted">/ past {LAB_WINDOW_DAYS} days</span></span>
        </div>
      </header>

      <section className="labs-board" aria-label="Recent GitHub projects">
        <div className="labs-board-bar">
          <span><span className="labs-prompt-arrow" aria-hidden="true">›</span> recent work</span>
          <span className="labs-board-counter">
            {state.status === "ready" ? String(items.length).padStart(2, "0") + " repositories" : "github sync"}
          </span>
        </div>

        {state.status === "loading" && (
          <div className="labs-placeholder" role="status">
            <span className="labs-placeholder-prompt">›</span>
            checking public github activity…
          </div>
        )}

        {state.status === "error" && (
          <div className="labs-placeholder" role="status">
            <span className="labs-placeholder-prompt">!</span>
            <span>github activity isn't available right now. <a href={allReposUrl} target="_blank" rel="noopener noreferrer">browse repositories ↗</a></span>
          </div>
        )}

        {state.status === "ready" && items.length === 0 && (
          <div className="labs-placeholder">
            <span className="labs-placeholder-prompt">›</span>
            <span>no public repo updates in the last {LAB_WINDOW_DAYS} days. <a href={allReposUrl} target="_blank" rel="noopener noreferrer">see github ↗</a></span>
          </div>
        )}

        {selected && (
          <>
            <div className="labs-repo-index" aria-label="Select a recent repository">
              {items.map((project, index) => {
                const isSelected = project.repoUrl === selected.repoUrl;
                return (
                  <button
                    type="button"
                    key={project.repoUrl}
                    className={isSelected ? "labs-repo-tab is-selected" : "labs-repo-tab"}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedRepoUrl(project.repoUrl)}
                  >
                    <span className="labs-repo-number">0{index + 1}</span>
                    <span className="labs-repo-name">{project.name}</span>
                    <span className="labs-repo-recent">{relativeDate(project.lastActivity)}</span>
                  </button>
                );
              })}
            </div>

            <div className="labs-selected" aria-live="polite">
              <div className="labs-selected-main">
                <div className="labs-selected-meta">
                  <span>selected / 0{selectedNumber}</span>
                  <span>last updated <time dateTime={selected.lastActivity}>{relativeDate(selected.lastActivity)}</time></span>
                </div>

                <p className="labs-selected-path">~/labs/</p>
                <h3>{selected.name}</h3>
                <p className="labs-selected-description">{selected.description || "no description yet."}</p>

                <div className="labs-selected-actions">
                  <a className="labs-action-primary" href={selected.repoUrl} target="_blank" rel="noopener noreferrer">
                    view repository <span aria-hidden="true">↗</span>
                  </a>
                  {selected.homepage && (
                    <a className="labs-action-secondary" href={selected.homepage} target="_blank" rel="noopener noreferrer">
                      visit site <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              </div>

              <aside className="labs-repo-details" aria-label="Repository details">
                <p className="labs-details-heading">/ repo details</p>
                <dl>
                  <div>
                    <dt>language</dt>
                    <dd>{selected.language || "not specified"}</dd>
                  </div>
                  <div>
                    <dt>last activity</dt>
                    <dd><time dateTime={selected.lastActivity}>{relativeDate(selected.lastActivity)}</time></dd>
                  </div>
                  <div>
                    <dt>activity signal</dt>
                    <dd>{selected.hasPersonalActivity ? "public coding events" : "repository update"}</dd>
                  </div>
                </dl>
                <p className="labs-details-note">recent activity is a signal, not a declared work status.</p>
              </aside>
            </div>
          </>
        )}

        <div className="labs-board-bottom">
          <span>automatically picked from public github activity</span>
          <a href={allReposUrl} target="_blank" rel="noopener noreferrer">all repositories <span aria-hidden="true">↗</span></a>
        </div>
      </section>

      {state.status === "ready" && (
        <p className="labs-source" aria-live="polite">
          {items.length} of up to {LAB_MAX_PROJECTS} repos · last {LAB_WINDOW_DAYS} days · checked{" "}
          <time dateTime={new Date(state.snapshot.fetchedAt).toISOString()}>
            {new Date(state.snapshot.fetchedAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
          {state.stale ? " · showing cached results" : ""}
          {!state.snapshot.eventsAvailable ? " · repo updates only" : ""}
        </p>
      )}
    </div>
  );
}
