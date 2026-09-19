# Hyperframes Composition Brief: nextjs-template

## Objective

Create a short launch-style brag video for nextjs-template — a Next.js 15 starter with auth, admin, audit logs, and feature flags already wired up.

## Output

- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1280x720
- Duration: 19 seconds

## Source Material

- Project root: `/Users/xavierk./Desktop/code/nextjs-template/`
- Primary files read: `app/page.tsx`, `app/page-data.json`, `app/(auth)/login/page.tsx`, `app/dashboard/page.tsx`, `app/globals.css`
- Product name: nextjs-template
- Tagline / strongest claim: "The boilerplate, without the boilerplate look."
- Key UI or visual moment to recreate: The "what's inside" WindowChrome card listing 6 features; the AuthShell two-column sign-in layout; the dashboard two-column card grid
- Copy that must appear verbatim:
  - "Already done."
  - "The boilerplate, without the boilerplate look."
  - "Auth, admin and audit — already wired up."
  - "nextjs-template · open source"
  - "Ten screens. One system."

## Creative Direction

- Tone preset: `default`
- Creative direction: "The developer starter that already did its homework"
- Interpretation: Warm, clean, minimal wry energy. Comfortable pacing — not rushed. The product's own copy does the work. Nothing is oversold. Monochromatic palette, confident typography.
- Angle: Every developer has rebuilt auth from scratch. This starter already paid that tax. The hook names the pain; the reveal is that it's already solved.
- Hook: Four muted gray words appear one by one: "auth." / "sessions." / "roles." / "migrations." — then they clear, and "Already done." slams in large and black.
- Outro / punchline: "The boilerplate, without the boilerplate look." then `nextjs-template · open source` on a clean white background
- Avoid:
  - Generic SaaS language ("streamline your workflow", "empower your team")
  - Abstract filler visuals (gradient washes, floating blobs)
  - Unrelated visual redesign — the palette is intentionally achromatic (white/near-black/gray)

## Visual Identity

- Background: `oklch(1 0 0)` → #ffffff (pure white)
- Text: `oklch(0.145 0 0)` → #1c1c1c (near-black)
- Muted text: `oklch(0.556 0 0)` → #6b6b6b
- Accent/border: `oklch(0.922 0 0)` → #ebebeb (used for card borders and dividers)
- Display font: "Geist Sans", system-ui, sans-serif
- Body font: "Geist Sans", system-ui, sans-serif
- Visual references from the project:
  - WindowChrome card with thin border and internal dividers
  - Pill badge labels (e.g. "v0.5.1 · open source", "What's included")
  - Two-column dashboard grid with profile card + account details card
  - AuthShell two-column layout (headline + bullets left, form right)

## Storyboard

Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook — 3s — four muted words one by one, then "Already done." slams in
2. Feature Card — 4s — the "what's inside" card with 6 items appearing sequentially
3. Sign-in Flow — 4s — AuthShell layout: headline + 3 bullets left, sign-in form right
4. Dashboard — 4s — "Welcome back" header, two-col card grid, "Ten screens. One system." badge
5. Outro — 4s — "The boilerplate, without the boilerplate look." + "nextjs-template · open source" on white

## Audio

- Audio role: warm upbeat corporate bed; music carries energy while text/UI drive the story
- Audio arc: fade in with hook, hold steady through feature and flow scenes, fade out through outro as bell SFX lands on punchline
- Music: `assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3`
- Music treatment: start at 0s, volume 0.30 (fade from 0 over first 1s), fade to 0 beginning at track time ~17.5s over 1.5s; let final `impactBell_heavy_000` ring over the fade
- Music cue guidance: bundled preset at `assets/music/cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json`; strong cues at 16.02s and 17.02s; target punchline first-line slam at **16.02s** (// beat-locked) and sub-label reveal at **17.02s** (// beat-locked); beat grid at 120 BPM for sequential card/item reveals
- Audio-reactive treatment: subtle; use music RMS/bass to make the feature card border or card background warmth breathe gently; no waveform visuals, no strobing, nothing that hurts readability
- Audio-coupled moments:
  - Scene 1 hook words: `interface/drop_001` or `drop_002` on each word arrival (4 cues, volume 0.55)
  - Scene 1 "Already done." slam: `impact/impactSoft_medium_000` at full settle (volume 0.75)
  - Scene 2 feature card items: `casino/card-place-*` cycling for each of 6 items (volume 0.60)
  - Scene 3 sign-in arrival: `interface/drop_002` (volume 0.60)
  - Scene 4 card stagger: `interface/drop_001` × 2 for left/right cards (volume 0.55); `casino/chip-lay-1` for badge pop-in (volume 0.60)
  - Scene 5 punchline: `impact/impactBell_heavy_000` beat-locked at 16.02s (volume 0.80)
  - Scene 5 sub-label: `impact/impactSoft_medium_000` at 17.02s (volume 0.65)
- SFX selection guidance: match the motion — drop sounds for gentle element arrivals, card-place sounds for feature list items, bell for the cinematic punchline moment; keep the palette consistent and professional
- SFX analysis guidance: `assets/sfx/sfx-analysis.md` if present; prefer low HF-risk files throughout
- Exact SFX choice: Hyperframes should choose final filenames, timestamps, density, and volume based on the implemented animation
- Audio files: music and selected SFX already copied into `brag-output/composition/assets/`

## Hyperframes Instructions

Load the composition-building Hyperframes domain skills — `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, and `hyperframes-cli`. /brag is its own workflow: do not enter the hyperframes entry-point intent interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI moment from the project (the "what's inside" feature card is mandatory; the AuthShell or dashboard is preferred)
- Keep all text readable at the final render size — copy legibility over pacing
- Keep total duration 19 seconds
- Include the music and SFX layer as described
- Beat-lock the Scene 5 punchline text slam to the strong cue at 16.02s in the track timeline
- Beat-lock the Scene 5 sub-label to the strong cue at 17.02s
- Snap Scene 2 feature card items to the beat grid (~3.02s start, 0.5s intervals)
- Use subtle audio-reactive treatment (RMS → card border/background warmth breathing)
- Run `hyperframes check` before render
