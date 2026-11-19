export const GITHUB_USER = "0xQuerencia";
export const LAB_WINDOW_DAYS = 14;
export const LAB_MAX_PROJECTS = 3;

const DAY = 24 * 60 * 60 * 1000;
const OWNER = GITHUB_USER.toLowerCase();

export interface GitHubRepository {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  owner: { login: string };
  fork: boolean;
  archived: boolean;
  disabled?: boolean;
  private?: boolean;
  pushed_at: string | null;
}

export interface GitHubActivity {
  type: string;
  created_at: string;
  repo: { name: string };
  payload?: { action?: string; ref_type?: string };
}

export interface LabProject {
  name: string;
  description: string | null;
  repoUrl: string;
  homepage: string | null;
  language: string | null;
  lastActivity: string;
  activityCount: number;
  hasPersonalActivity: boolean;
  activityScore: number;
}

function recentTimestamp(value: string | null | undefined, cutoff: number, now: number) {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp >= cutoff && timestamp <= now + DAY ? timestamp : 0;
}

function isCodingActivity(event: GitHubActivity) {
  if (event.type === "PushEvent" || event.type === "ReleaseEvent") return true;
  if (event.type === "CreateEvent") return event.payload?.ref_type !== "tag";
  if (event.type === "PullRequestEvent") {
    return ["opened", "reopened", "synchronize", "closed"].includes(event.payload?.action ?? "");
  }
  return false;
}

function safeHomepage(homepage: string | null) {
  if (!homepage) return null;
  try {
    const url = new URL(homepage);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Estimate recent work from public GitHub events and repository pushes.
 * A pushed_at timestamp alone does not prove who made the change.
 */
export function deriveLabProjects(
  repositories: readonly GitHubRepository[],
  events: readonly GitHubActivity[],
  now = Date.now(),
): LabProject[] {
  const cutoff = now - LAB_WINDOW_DAYS * DAY;
  const signals = new Map<string, { latest: number; count: number }>();

  for (const event of events) {
    if (!event.repo?.name || !isCodingActivity(event)) continue;
    const date = recentTimestamp(event.created_at, cutoff, now);
    if (!date) continue;
    const key = event.repo.name.toLowerCase();
    if (!key.startsWith(OWNER + "/")) continue;
    const previous = signals.get(key);
    signals.set(key, {
      latest: Math.max(previous?.latest ?? 0, date),
      count: (previous?.count ?? 0) + 1,
    });
  }

  return repositories
    .filter((repo) =>
      repo.owner?.login?.toLowerCase() === OWNER &&
      repo.name.toLowerCase() !== "portfolio" &&
      repo.name.toLowerCase() !== OWNER &&
      !repo.fork && !repo.archived && !repo.disabled && !repo.private
    )
    .map((repo) => {
      const event = signals.get(repo.full_name.toLowerCase());
      const push = recentTimestamp(repo.pushed_at, cutoff, now);
      const latest = Math.max(push, event?.latest ?? 0);
      if (!latest) return null;
      return {
        name: repo.name,
        description: repo.description,
        repoUrl: repo.html_url,
        homepage: safeHomepage(repo.homepage),
        language: repo.language,
        lastActivity: new Date(latest).toISOString(),
        activityCount: event?.count ?? 0,
        hasPersonalActivity: Boolean(event),
        activityScore:
          (event?.count ?? 0) * 6 +
          (push ? 2 : 0) +
          Math.max(0, LAB_WINDOW_DAYS - (now - latest) / DAY),
      } satisfies LabProject;
    })
    .filter((project): project is LabProject => project !== null)
    .sort((a, b) =>
      b.activityScore - a.activityScore ||
      Date.parse(b.lastActivity) - Date.parse(a.lastActivity)
    )
    .slice(0, LAB_MAX_PROJECTS);
}
