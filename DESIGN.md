# Quiet Index

## Direction

Follow the approved Quiet Index mockup: a warm paper background, typeset introduction, a ruled work index, and short sections for experiments, about, and contact. The page is an index of Ricky's work and a way to reach him.

## Color

Paper `#f5f2ed`, ink `#191817`, muted ink `#54514e`, rule `#bfbab3`, control border `#817b74`, cobalt `#193ed5`. Use cobalt for inline actions and keyboard focus. Keep ordinary underlines on inline links.

## Typography

DM Sans with a system fallback. Hero 34–50px with close tracking and a manual break after the greeting. Motto 21–27px. Work title 25px, body 17–19px, navigation and utility links 15–16px.

## Layout

The document owns vertical scrolling. The header, work entry, and contact share a centered 720px measure with fluid 24–32px gutters. Inset the wide hero by 40px; align it to the page edge on narrow screens. Stack mobile navigation and place the project description below its name. Use individual, generously sized text links.

## Primitives

The page uses native anchors, hairlines between work entries, and a single outlined button. The section hashes work with the browser's native fragment navigation. Each hash destination can receive focus.

## Motion and accessibility

The email address and Copy email button act independently. Overlay the button labels in a grid to reserve the widest label. At rest show Copy email, on success show Copied, and on failure highlight the address for manual copying and show instructions in a reserved status row. Announce the result in a polite live region. Use a 100ms press transition and a 140ms label fade with immediate state changes for reduced motion. Use a visible 2px focus outline.
