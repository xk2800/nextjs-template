# Brag Plan: nextjs-template

## What is this app?

A Next.js 15 starter with auth (Better-Auth + Google OAuth), admin area, audit logs, feature flags, and Drizzle/Postgres — everything already wired so you ship your product instead of your auth stack.

## The angle

Every developer has lost a day (or a week) to the same five files: sign-in, sessions, roles, migrations, admin panel. This template has already paid that tax. The hook is the recognition — you've been here before. The reveal is that someone already fixed it. Clean, minimal, monochrome. No hype.

## Hook (first 2-3 seconds)

Two words slam in one at a time, stacking up in muted gray:
"auth." → "sessions." → "roles." → "migrations."
Then a hard pause — white space — and one clean black line: **"Already done."**

## Key moments (the middle)

1. The "what's inside" feature list card: six items appear one by one — Next.js 15, shadcn/ui, Better-Auth + Google, Postgres via Drizzle, Admin & impersonation, Feature flags. Clean card, real project copy.
2. The sign-in shell: "Auth, admin and audit — already wired up." with the three bullets below it (Google OAuth, revokable sessions, audit logging). A sign-in form sits beside it. This is the actual screen, not a mockup.
3. The dashboard: "Welcome back, [name]" — profile card and account details in a two-column grid. Real layout. Real copy.

## Outro / punchline

"The boilerplate, without the boilerplate look."
Then, smaller: `nextjs-template · open source`
Long hold. Clean fade out.

## User flow worth showing

Entry → sign-in screen (AuthShell with bullets + form) → dashboard (profile card + account details grid)

## Tone

- Preset: `default`
- Creative direction: "The developer starter that already did its homework"
- Interpretation: Warm, clean, slightly wry. Pacing is comfortable — not rushed. Typography is confident and minimal. The product's own copy does the work; nothing is oversold.

## Format: landscape — 1280x720
## Duration: 19 seconds

## Visual identity (from the project)

- Background: `oklch(1 0 0)` → #ffffff (pure white)
- Text: `oklch(0.145 0 0)` → near-black #1c1c1c
- Muted/secondary text: `oklch(0.556 0 0)` → #6b6b6b
- Card: white with border `oklch(0.922 0 0)` → #ebebeb border
- Accent: none — design is intentionally achromatic/monochrome
- Display font: Geist Sans (or system-ui fallback)
- Body font: Geist Sans
- Strongest visual element: The "what's inside" WindowChrome card with the feature item list; the AuthShell two-column layout

## Share copy (draft)

Built a Next.js template with auth, admin, audit logs, and feature flags already wired up. The boilerplate, without the boilerplate look.

## Audio direction

- Role: warm upbeat bed — music is present but secondary; the video is text/UI driven
- Music: `happy-beats-business-moves-vol-1-by-ende-dot-app.mp3`
- Music treatment: fade in from 0 at 0.3 volume, run through the video, subtle fade to 0 starting at 17.5s, let the final SFX ring over silence
- Music cue guidance: bundled preset at `assets/music/cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json`; strong cues cluster at 16.02s, 17.02s, 18.02s — target punchline text slam at **16.02s** (beat-locked), final product name at **17.02s** (beat-locked); beat grid at 120 BPM (~0.5s per beat)
- Audio-reactive treatment: subtle; use music RMS/bass to let the feature card border and background warmth breathe slightly — no waveform visuals, no strobing
- SFX posture: sparse / moderate; professional restraint; motion-matched
- Audio-coupled moments:
  - Hook: each muted word appearing — soft `interface/drop_001` or `interface/drop_002` per word (4 total, low volume 0.6)
  - "Already done." reveal — one clean `impactSoft_medium_000` at full settle (0.75)
  - Feature card items: each of the 6 items arriving — `casino/card-place-1` through `card-place-4` cycling (0.65)
  - Sign-in screen arrival — `interface/drop_002` (0.65)
  - Dashboard arrival — `interface/drop_001` (0.60)
  - Punchline text slam — `impactBell_heavy_000` beat-locked at 16.02s (0.80)
  - Product name/outro — `impactSoft_medium_000` at 17.02s (0.65)
- Restraint rule: no stacked SFX, no loud punches — this is clean and professional; the music bed carries energy

---

## Storyboard

### Scene 1 — Hook — 3s (0:00 – 0:03)

Four gray words appear sequentially, each slamming in from opacity 0 and slightly below:
- "auth." at 0.2s
- "sessions." at 0.7s
- "roles." at 1.2s
- "migrations." at 1.7s

Each word is small (18px), muted gray (`#6b6b6b`), monospace feel, centered.
At 2.2s: all four words fade out (0.2s crossfade).
At 2.4s: **"Already done."** slams in — large (52px), near-black, Geist Sans bold, centered. Holds through scene end.

Sequential/interaction: yes — 4 words appear one by one at 0.5s intervals, then clear for the payoff line
Audio intent: build a familiar tension, then release it cleanly
Audio-coupled idea: `interface/drop_001` at 0.2s, 0.7s, 1.2s, 1.7s (volume 0.55); `impactSoft_medium_000` at 2.4s (volume 0.75)
Music: warm upbeat bed, fade in from 0 to 0.30 over first 1s
Transition mood: hard cut → Scene 2

---

### Scene 2 — Feature Card — 4s (0:03 – 0:07)

White background. A card centered horizontally, left-aligned, with a thin border and the `WindowChrome` header label "what's inside".

Six feature items appear one by one, each sliding in from opacity 0 with a subtle upward motion:
1. ☰ Next.js 15 + Tailwind — 0.2s
2. 🎨 shadcn/ui components — 0.7s
3. 🔑 Better-Auth + Google — 1.2s
4. 🗄 Postgres via Drizzle — 1.7s
5. 🛡 Admin & impersonation — 2.2s
6. 🚩 Feature flags — 2.7s

Each item: icon (small, gray), then bold label text. Separated by a thin line. Card is ~340px wide.

At 3.5s: hold with all 6 visible.

Sequential/interaction: yes — 6 feature items appear one by one at 0.5s intervals
Audio intent: each item arrival feels like a satisfying delivery
Audio-coupled idea: `casino/card-place-1` through `card-place-4` cycling for each item (volume 0.60)
Music: bed continues at 0.30
Transition mood: clean slide → Scene 3

---

### Scene 3 — Sign-in Flow — 4s (0:07 – 0:11)

Two-column layout (AuthShell):
- Left column: large bold text "Auth, admin and audit — already wired up." (from the actual login page); below it, 3 bullets:
  - "Google OAuth and email sign-in out of the box"
  - "Database-backed sessions you can revoke per device"
  - "Audit logging and admin impersonation built in"
- Right column: a clean sign-in card — title "Log in", an email field, password field, "Continue" button, divider "or", "Continue with Google" button

All elements fade/slide in together at 0.3s. The bullets appear sequentially 0.5s apart.

Sequential/interaction: yes — 3 bullets arrive 0.5s apart after the headline settles
Audio intent: reassuring — this is the boring part that's already handled
Audio-coupled idea: `interface/drop_002` on scene enter (volume 0.60); subtle `interface/drop_001` per bullet (volume 0.50)
Music: bed continues at 0.30
Transition mood: clean slide → Scene 4

---

### Scene 4 — Dashboard — 4s (0:11 – 0:15)

Dashboard layout:
- Header: "Dashboard" (h1) + "Welcome back, Alex" (gray subtitle)
- Below: two cards side by side — Profile Card (name, email, role badge "user") and Account Details Card
- Below that: Sessions card header visible (teasing full layout)

All slides/fades in at 0.3s. Two-col card grid pops in with a brief stagger (left 0.3s, right 0.6s).

A small label tag animates in at 1.5s: "Ten screens. One system." — pill badge style, same as the landing page.

Sequential/interaction: yes — two cards arrive with a stagger; label badge pops in at 1.5s
Audio intent: satisfying — you have a full product, not just a form
Audio-coupled idea: `interface/drop_001` at 0.3s (left card) and 0.6s (right card) (volume 0.55); `casino/chip-lay-1` at 1.5s for the badge pop-in (volume 0.60)
Music: bed continues at 0.30
Transition mood: hard cut → Scene 5

---

### Scene 5 — Outro — 4s (0:15 – 0:19)

Pure white background. Clean, centered. Text only.

At 0.1s: the punchline slams in — **"The boilerplate,"** (large, bold, near-black)
At 0.5s: **"without the boilerplate look."** appears below it (same weight)
→ This text reveal beat-locked to strong cue at **16.02s** in track timeline

At 1.2s: smaller text appears below: `nextjs-template · open source`
→ Beat-locked to strong cue at **17.02s** in track timeline

Hold through 3.8s. Music fades to 0 by 3.5s. Final bell ring hangs.

Sequential/interaction: yes — two-line punchline appears in two beats, then the sub-label
Audio intent: clean landing — confident, not loud
Audio-coupled idea: `impactBell_heavy_000` at scene start ~0.05s before the first line (volume 0.80); `impactSoft_medium_000` at 1.2s for the sub-label (volume 0.65)
Music: fade to 0 over 1.5s starting at 17.5s in track timeline
Transition mood: fade out

---

**Music mood for this video:** upbeat corporate, clean and energetic but not aggressive
**Audio summary:** warm music bed fades in with the hook, carries the feature card and flow scenes at steady 0.30, then fades out through the outro as the bell hit lands on the punchline at 16.02s.

## Music cue guidance

- Track: `happy-beats-business-moves-vol-1-by-ende-dot-app.mp3` at 120.19 BPM
- Bundled preset: `assets/music/cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json`
- Beat-locked moments:
  - Punchline first line → strong cue at **16.02s** (±0.15s)
  - Sub-label reveal → strong cue at **17.02s** (±0.15s)
- Beat-grid windows for sequential reveals:
  - Hook words: 0.5s spacing — not beat-aligned (track is quiet there); use natural timing
  - Feature card items: beat grid starts around 3.02s; items at 3.2, 3.7, 4.2, 4.7, 5.2, 5.7s — snap within ±0.10s of nearest beat
  - Sign-in bullets: beat grid around 7–9s; bullets at ~7.5, 8.0, 8.5s — snap within ±0.10s
- Restraint note: the video is clean and professional; don't align more than these 2 beat-locked moments plus the sequential grids
