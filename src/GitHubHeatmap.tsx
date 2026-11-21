import { useEffect, useState } from "react";

const GITHUB_USER = "0xQuerencia";
const API_URL = "https://github-contributions-api.jogruber.de/v4/" + GITHUB_USER + "?y=last";
const DAY_MS = 86_400_000;
const WEEK_MS = DAY_MS * 7;
const CELL = 10;
const STEP = 13;
const LEFT = 21;
const TOP = 24;
const COLORS = ["#1b2433", "#254a78", "#3270ae", "#4f9cff", "#a1cfff"];

type Contribution = { date: string; count: number; level: number };
type ContributionData = { days: Contribution[]; total: number };

function isContribution(value: unknown): value is Contribution {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Contribution>;
  return typeof item.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
    Number.isFinite(Date.parse(item.date + "T00:00:00Z")) &&
    typeof item.count === "number" && Number.isFinite(item.count) && item.count >= 0 &&
    typeof item.level === "number" && Number.isInteger(item.level) &&
    item.level >= 0 && item.level <= 4;
}

function readContributions(value: unknown): ContributionData {
  if (!value || typeof value !== "object") throw new Error("Invalid contribution response");
  const payload = value as { contributions?: unknown; total?: unknown };
  if (!Array.isArray(payload.contributions)) throw new Error("Missing contribution days");

  const days = payload.contributions.filter(isContribution)
    .sort((a: Contribution, b: Contribution) => a.date.localeCompare(b.date));
  if (days.length === 0) throw new Error("No contribution data");

  const rawTotal = payload.total;
  const reportedTotal = rawTotal && typeof rawTotal === "object" && "lastYear" in rawTotal
    ? rawTotal.lastYear
    : undefined;
  const total = typeof reportedTotal === "number" && Number.isFinite(reportedTotal)
    ? reportedTotal
    : days.reduce((sum: number, day: Contribution) => sum + day.count, 0);

  return { days, total };
}

function formatDay(date: string) {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

function calendarLayout(days: Contribution[], weeks: number) {
  const last = new Date(days[days.length - 1].date + "T00:00:00Z");
  const start = new Date(last.getTime());
  start.setUTCDate(last.getUTCDate() - last.getUTCDay() - (weeks - 1) * 7);
  const from = start.getTime();

  const cells = days.flatMap((day) => {
    const timestamp = Date.parse(day.date + "T00:00:00Z");
    const week = Math.floor((timestamp - from) / WEEK_MS);
    if (week < 0 || week >= weeks) return [];
    return [{ ...day, week, weekday: new Date(timestamp).getUTCDay() }];
  });

  const months: { x: number; label: string }[] = [];
  let previousMonth = "";
  for (let week = 0; week < weeks; week++) {
    const midpoint = new Date(from + (week * 7 + 3) * DAY_MS);
    const month = midpoint.toISOString().slice(0, 7);
    if (month !== previousMonth) {
      if (week <= weeks - 2) {
        months.push({
          x: LEFT + week * STEP,
          label: midpoint.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
        });
      }
      previousMonth = month;
    }
  }

  return { cells, months, width: LEFT + weeks * STEP + 3, height: TOP + 7 * STEP };
}

export default function GitHubHeatmap() {
  const [data, setData] = useState<ContributionData | null>(null);
  const [error, setError] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 620px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(API_URL, { signal: controller.signal });
        if (!response.ok) throw new Error("GitHub contributions unavailable");
        const json: unknown = await response.json();
        if (!controller.signal.aborted) setData(readContributions(json));
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  const chart = data ? calendarLayout(data.days, compact ? 26 : 53) : null;

  return (
    <section className="github-activity" aria-labelledby="github-activity-title">
      <div className="github-activity-heading">
        <h3 id="github-activity-title">github activity</h3>
        <a href={"https://github.com/" + GITHUB_USER} target="_blank" rel="noopener noreferrer">
          view profile <span aria-hidden="true">↗</span>
        </a>
      </div>
      {data && (
        <p className="github-activity-total">{data.total.toLocaleString()} contributions in the last 12 months</p>
      )}
      {!data && !error && <p className="github-activity-message" role="status">loading contributions...</p>}
      {error && (
        <p className="github-activity-message" role="status">
          couldn't load activity right now. check my github profile instead.
        </p>
      )}
      {chart && data && (
        <>
          <svg
            className="github-activity-chart"
            viewBox={"0 0 " + chart.width + " " + chart.height}
            role="img"
            aria-label={"GitHub contribution heatmap for the last " + (compact ? "26 weeks" : "12 months")}
          >
            <title>GitHub contributions for 0xQuerencia</title>
            {chart.months.map((month, index) => (
              <text key={index} x={month.x} y={12} className="github-activity-axis">
                {month.label}
              </text>
            ))}
            {([["Mon", 1], ["Wed", 3], ["Fri", 5]] as const).map(([label, row]) => (
              <text key={label} x={0} y={TOP + row * STEP + 8} className="github-activity-axis">
                {label}
              </text>
            ))}
            {chart.cells.map((day) => (
              <rect
                key={day.date}
                x={LEFT + day.week * STEP}
                y={TOP + day.weekday * STEP}
                width={CELL}
                height={CELL}
                rx={1.5}
                fill={COLORS[day.level]}
                className="github-activity-cell"
              >
                <title>
                  {day.count + (day.count === 1 ? " contribution" : " contributions") + " on " + formatDay(day.date)}
                </title>
              </rect>
            ))}
          </svg>
          <div className="github-activity-footer">
            <span>{compact ? "last 26 weeks" : "last 12 months"}</span>
            <div className="github-activity-legend" aria-label="Contribution intensity, from less to more">
              <span>less</span>
              {COLORS.map((color) => (
                <span key={color} className="github-activity-swatch" style={{ backgroundColor: color }} aria-hidden="true" />
              ))}
              <span>more</span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
