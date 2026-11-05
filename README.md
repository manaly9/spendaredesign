# Spenda

Local React + Vite website using CSS, GSAP, and its bundled ScrollTrigger plugin.
Node.js 20.19+ or 22.12+ is required. No environment variables are needed.

## Install and run

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173).
On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

```sh
npm run lint
npm run build
npm run preview
```

The production output is written to `dist/`. Preview serves that build locally.

## Structure

- `src/main.jsx`: React entry point.
- `src/App.jsx`: page composition.
- `src/sections/Hero/`: cinematic hero and scroll timeline.
- `src/styles/`: global styles and font configuration.
- `public/media/hero/`: derived web video and poster.
- `public/fonts/satoshi/`: place licensed Satoshi font files here.
- `scripts/`: development and validation helpers.

The seven original asset directories are preserved in place. The app serves only
selected derivatives from `public/`; reference screenshots are never backgrounds.
No hosted site or deployment is configured.

## Typography

Satoshi was not supplied. Add `public/fonts/satoshi/Satoshi-Variable.woff2` and
uncomment the font-face in `src/styles/fonts.css`. The temporary fallback is
Avenir Next, Segoe UI, then Arial. The logo is a temporary vector/text approximation
until an official Spenda logo is supplied.

## Hero implementation

Only the cinematic hero and an empty white transition endpoint are implemented.
The phone dashboard is intentionally deferred. All headings and navigation are
HTML; no reference screenshots are used as the website background.

`src/sections/Hero/useHeroTimeline.js` contains the reversible GSAP/ScrollTrigger
timeline. It uses the source video's actual purple sweep (2–3 seconds), white card
reveal (4–5 seconds), and final light burst (6.5–7.5 seconds). Desktop pinning spans
four viewport heights; mobile spans 3.5. The opening copy is visible before video
metadata loads. Reduced motion displays all three messages in normal document
flow with a static poster, without pinning or video scrubbing.

The original `videos/Spenda_card_product_animation.mp4` is unchanged. Its derivative,
`public/media/hero/spenda-card-scrub.mp4`, has no audio, fast-start metadata, and a
keyframe every six frames (0.25 seconds). It preserves the footage and resolution.
The original has a 7.5-second keyframe gap. Browser seeking performance still needs
verification once dependencies are installed.

To regenerate the derivative and poster with FFmpeg:

```sh
ffmpeg -i videos/Spenda_card_product_animation.mp4 -an -c:v libx264 -preset fast -crf 19 -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart public/media/hero/spenda-card-scrub.mp4
ffmpeg -i videos/Spenda_card_product_animation.mp4 -frames:v 1 -q:v 2 public/media/hero/spenda-card-poster.jpg
```

## Review checklist

- Scroll down through all three messages and the white endpoint, then back up.
- Check the card stays visible at desktop, tablet, and narrow mobile widths.
- Enable reduced motion and confirm all copy remains readable without pinning.
- Check browser console and network for errors and verify reverse video seeking.
- Our Products navigates to the hero states. Blog is an explicitly disabled
  placeholder; Download Now opens a dialog until approved store URLs are supplied.
- Replace the temporary logo and fallback typography with official assets.

Initial dependency installation was blocked in the agent environment by registry
network access (`registry.npmjs.org:443`); offline npm returned `ENOTCACHED`.
Run `npm install` locally first to generate `package-lock.json`, then use `npm ci`
for repeatable installs. Build, lint, and browser checks are pending installation.

## Phone dashboard (Section 2)

`src/sections/PhoneDashboard/PhoneDashboard.jsx` replaces the hero's empty white
endpoint. The completed hero timeline is unchanged. This reusable component uses
original imported phone, notification and video assets; Vite bundles them for production.
The desktop composition clips the lower phone, with staggered word, phone and card
entrances and gentle GSAP floats. On narrow screens cards sit beneath the cropped
phone to keep the demonstration readable. Reduced motion shows the composition
without entrance or floating animations.

The native muted, inline video player runs independently of GSAP. ScrollTrigger
`spenda-phone-demo` defines the active demonstration boundary; leaving it or hiding
the tab pauses playback. Position is preserved on return, and the available bank
transfer clip loops natively without reloading its source. A visible play button handles blocked autoplay.
Prepend the real crypto clip to `PHONE_DEMOS` when available, or supply a stable
`demos` array with `id`, `src`, and `label` entries. Completed clips automatically
advance to the next real clip. No virtual card showcase has been added.

Satoshi font files and a separate 3D Naira asset remain missing. The configured
font fallback is used and the Naira decoration is a low contrast CSS approximation.

Validation: lint and production build pass. Original asset SHA256 checks match.
Chrome checks confirmed 720x1600 playback, a 709px device cropped to 547px on desktop,
settled notifications, no desktop/mobile horizontal overflow, pause with unchanged
currentTime while away, resume from that time, repeated native loops, and readable
reduced-motion content. Local browser QA artifacts are ignored in `.qa/`.

The phone section overlaps 90% of the hero's trailing white viewport, eliminating
the long empty handoff. Its entrance starts at the end of the hero pin, after the
white flash, with the original entrance easing and composition unchanged. The
hero timeline itself is unchanged; reduced motion keeps normal document flow.

## Bank tile physics

The existing bank entrance remains GSAP-controlled. After landing, a separate
`.bank-tile-physics` layer follows Matter.js bodies. Bodies start asleep at the
original Figma coordinates; conservative contact shapes account for the deliberately
overlapping artwork. No image assets are modified. Mouse movement and touch apply
local impulses, while real body contacts transmit movement to neighboring tiles.
The simulation only runs while the pile is visible and the tab is active. Resizing
rebuilds its boundaries at the responsive arrangement. Reduced motion disables physics.

`Enable Tilt Interaction` is optional and is the only action that requests sensor
permissions. Acceleration including gravity takes priority over orientation, with
screen-axis mapping, neutral calibration, smoothing, a dead zone and bounded forces.
Denied permissions or missing readings leave ordinary mouse/touch interaction working.
`Reset Arrangement` gently returns the bodies to their reference positions.

To test on a phone, open a trusted HTTPS preview of the site, scroll to the bank
pile and let the entrance finish. Tap `Enable Tilt Interaction`, allow motion when
prompted, and slowly tilt left, right, forward and backward. Test both portrait and
landscape. Use `Reset Arrangement` to restore the pile. A plain HTTP LAN preview can
show the site, but sensor access generally requires HTTPS; localhost's secure-context
exception applies only on the device running the server.

Validation: `npm run test:bank-physics`, `npm run lint`, and `npm run build`.
The development build also exposes the following temporary console simulator:

```js
const test = document.querySelector('.bank-transfer').__bankPhysicsTest
test.setGravity(1, 0)   // right
test.setGravity(-1, 0)  // left
test.setGravity(0, -1)  // upside down
test.snapshot()        // bodies, collisions, gravity and running state
test.reset()
```

Browser QA used simulated sensor readings, including permission denial, inversion,
responsive rebuilds and visibility changes. No real sensor hardware was tested.

Matter.js 0.20.0 is installed from `vendor/matter-js-0.20.0.tgz`, containing the
official MIT-licensed release build. Registry access is blocked in this environment,
so the source build, upstream package metadata, license and provenance are retained
in `vendor/matter-js/`. The lockfile resolves the local package without registry access.

