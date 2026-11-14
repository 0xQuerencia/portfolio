export interface Project {
  name: string;
  description: string;
  /** Live site, if the project has one. */
  url?: string;
  /** Source repository. */
  repo: string;
}

export const projects: readonly Project[] = [
  {
    name: "x",
    description: "Hex, but it also does stuff. Dictation for Linux.",
    url: "https://x.querencia.art",
    repo: "https://github.com/0xQuerencia/x",
  },
  {
    name: "aether",
    description: "My Quickshell island for Hyprland.",
    url: "https://0xquerencia.github.io/aether/",
    repo: "https://github.com/0xQuerencia/aether",
  },
  {
    name: "pixie",
    description: "A Slack support bot for Hack Club programs.",
    url: "https://pixie.support",
    repo: "https://github.com/0xQuerencia/pixie",
  },
  {
    name: "pixl",
    description: "Ship real projects inside a 2D world, earn Pixels, unlock real prizes.",
    url: "https://pixl.hackclub.com",
    repo: "https://github.com/hackclub/pixl",
  },
  {
    name: "ripple",
    description: "Cause and effect simulation. Answers your WHAT IF questions.",
    url: "https://ripple.querencia.art",
    repo: "https://github.com/0xQuerencia/ripple",
  },
  {
    name: "portfolio",
    description: "This site lol",
    url: "https://querencia.art",
    repo: "https://github.com/0xQuerencia/portfolio",
  },
];
