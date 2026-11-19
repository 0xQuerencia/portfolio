# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Four audiences, confirmed by the owner ("all of the above"):

- Recruiters and hiring managers, judging whether to hire or work with Ricky.
- Hackathon and Hack Club peers, who want to see what has shipped.
- Open-source developers, interested in the tools and code.
- Friends and general visitors, who know Ricky or found the link.

## Product Purpose

Personal portfolio for Ricky Parmar (GitHub: 0xQuerencia). It introduces the owner, shows featured projects from pinned GitHub repos, and links out to them.

Success, as the owner put it: visitors explore the projects, follow the GitHub, or get in touch. No single call to action is required.

## Positioning

The owner's own line: "I'd rather build it than pay for it." The site presents self-built tools and projects instead of paid products.

## Operating Context

- Read on desktop and phone, by people arriving from links shared in hackathon, Hack Club and open-source circles.
- The owner is a student developer and maker from India, focused on Linux, developer tools, desktop environments, automation, AI, and software-hardware work.

## Capabilities and Constraints

- Single-page site: home, about, featured projects, Labs, and contact. The sections scroll sideways on desktop and stack vertically on mobile. The terminal prompt follows the active section.
- Featured projects remain curated in `src/data.ts`. Labs fetches public GitHub repositories and public coding events in the browser, displaying unarchived, non-fork repositories with activity in the previous 30 days, most recent first. Successful results are cached locally for 30 minutes and the section degrades gracefully if GitHub becomes unavailable. Repo pushes alone do not prove who worked on the code.
- Background is the earthrise piece from ascii.rest (MIT), rendered as a fixed layer.
- Heading and navigation typography uses Pixelify Sans; paragraph and card copy use JetBrains Mono.

## Brand Commitments

- Name: Ricky Parmar. Handle: 0xQuerencia.
- Motto: "I'd rather build it than pay for it." (the owner's words, to be kept as written)
- Voice: first person and plain. Speak in the owner's own words rather than corporate phrasing.

## Evidence on Hand

- `src/data.ts`: six pinned repos with their descriptions and links. Two have live sites: pixie.support and pixl.hackclub.com.
- Contact email: me@querencia.art, published on the site in the "Get in touch" panel at the owner's request.
- Absent, and not to be invented: photo, resume, testimonials, case studies, metrics, employer, school.

## Product Principles

- Shipped work is the evidence. Projects come before biography.
- Use the owner's own words; do not write marketing copy in their name.
- Claim only what is on hand. No invented employers, testimonials, or numbers.
- One site for four audiences: no paywall, no gate, and no audience-specific pages.
