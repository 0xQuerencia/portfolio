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
    name: "pixl",
    description: "A gamified, pixelated You Ship, We Ship program.",
    url: "https://pixl.hackclub.com",
    repo: "https://github.com/hackclub/pixl",
  },
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
    name: "ripple",
    description: "Cause and effect simulation. Answers your WHAT IF questions.",
    url: "https://ripple.querencia.art",
    repo: "https://github.com/0xQuerencia/ripple",
  },
];
