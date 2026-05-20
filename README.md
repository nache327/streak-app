# Ground — Daily Discipline Tracker

**Stay grounded.** *Plant. Nourish. Grow.*

A privacy-first PWA habit tracker for one daily discipline. Native browser ES
modules, no build step, no backend, no account. Push reminders via OneSignal +
a Cloudflare Worker cron.

## Philosophy

One active goal. One question per day. Yes or no.

The discipline that matters most is the one you can answer with two big buttons.
Multi-goal support, social features, accountability partners — all deliberately
excluded. Ground is meant to be small enough to use forever.

The visual metaphor is a sprout emerging from a ground line. Daily check-ins
nourish it. A missed day doesn't kill the sprout — it just doesn't grow that
day. No shame loop.

## Running locally

```bash
# No install. No npm. Just serve the directory.
npx serve .          # Node
python3 -m http.server 8080
php -S localhost:8080
```

Open `http://localhost:8080`. Push notifications require HTTPS or localhost
(OneSignal SDK).

## Architecture

```
streak-app/                  # folder kept for backwards-compat; product is Ground
  index.html                 # markup only + <script type="module" src="src/main.js">
  styles.css                 # all styles
  manifest.json              # PWA manifest
  OneSignalSDKWorker.js      # live service worker (push handler + PWA cache)
  OneSignalSDKUpdaterWorker.js
  cloudflare-worker.js       # daily reminder cron (deploys to Cloudflare Workers)
  verify.html                # self-test page — hit /verify.html for all-green
  ground_logo.png            # wordmark + sprout, lime on transparent
  ground_logo_2x.png         # retina wordmark
  ground_icon[_180|_192|_1024].png  # sprout-only icons, transparent
  ground_thumbnail.png       # square icon with #0a0a0a baked bg (manifest)
  ground_stage_1..4.png      # sprout-progression stages (seed → grow)
  src/
    main.js                  # boot + static event binding + onboarding flourish
    constants.js             # MILESTONES, BADGES, STORAGE_KEY, getStageForStreak
    data.js                  # load / save / createFreshState / migrate (v2)
    dates.js                 # todayStr, addDays, weekStart, weekEnd, listWeeksCovering
    state.js                 # shared mutable state container
    stats.js                 # type-aware computeStats (daily | weekly_target)
    router.js                # showScreen
    checkin.js               # logDay, editTodayInline, getMotivationLine
    modal.js                 # day-edit modal
    confirm.js               # confirm modal
    badges.js                # badge celebration + tracking
    celebrate.js             # milestone banner + confetti
    toast.js
    notifs.js                # reminders (in-app + OneSignal push wiring)
    goal.js                  # goal rename (inline + settings)
    export.js                # JSON export / import / reset
    privacy.js               # PIN lock + biometric toggle
    pro.js                   # isPro, showProPrompt, dev-only 7-tap gesture
    render/
      dashboard.js           # renderDashboard + setSprout + currentSproutStage
      calendar.js
      stats.js
      settings.js            # mode + schedule + privacy sections
```

### Why ES modules with no build step

Native browser modules cover everything we need: scoped imports, no globals,
hot edits during dev. Skipping a bundler keeps the surface area small enough
to maintain alone, and the app installs as a PWA without any deploy pipeline.

### Persistence

All state lives in `localStorage` under `streak_app_v1` (key kept verbatim
across the Ground rebrand so existing user data isn't orphaned). Schema is
versioned (currently `version: 2`); `migrate()` in `data.js` upgrades older
payloads in place on load. Backups exported to JSON are migrated on re-import.

### Service worker

`OneSignalSDKWorker.js` is the only registered service worker. It imports the
OneSignal push handler and also serves the PWA cache. The current cache name
is `ground-v3` and it pre-caches `./`, the wordmark, and all four sprout
stage images so the progression works offline.

### Push reminders

Two channels:

1. **Cloudflare Worker** (`cloudflare-worker.js`) — cron `0 0 * * *` UTC sends
   a batched OneSignal notification at 8AM and another at 8PM in each user's
   local timezone (OneSignal handles per-user delivery time via
   `delivery_time_of_day` + `delayed_option: 'timezone'`). Tagged recipients
   only.
2. **In-app `Notification` API** (`notifs.js`) — fires while the tab is open,
   covering the locked-screen gap on Android / desktop.

Both channels use generic copy that never references the user's goal name.

## Modes and types

Independent dimensions:

- **Goal mode** — `do` | `avoid`. Cosmetic: changes the check-in button labels
  ("Did you do it today?" vs "Did you avoid it today?"). Set during onboarding,
  switchable in Settings.
- **Goal type** — `daily` | `weekly_target`. Determines how the streak is
  computed.

### Daily mode

Every day matters. The streak counts consecutive `yes` days. Best for
sobriety, no-junk-food, or any avoid-style goal where strictness is the point.

### Weekly target mode

Pick a target between 3 and 6 yes-days per Mon–Sun week. The streak counts
consecutive **weeks** that hit the target. Missing a day or two in a week is
fine. Adds **streak freezes**: every 7 yes-days earns 1 freeze (capped at 1
stored free / 2 stored pro), auto-applied to past weeks that fell exactly 1
day short. Frozen weeks are marked with a snowflake on the Monday cell.

## Sprout progression

The dashboard hero is a 4-stage sprout image that grows with the user's
current streak. The user *sees* their sprout grow as they show up — daily,
visible, dopamine-positive, and crucially: it never visually breaks.

| Stage | Daily | Weekly |
|---|---|---|
| 1 — SEED | `currentStreak === 0` | 0 weeks |
| 2 — START | 1–6 days | 1 week |
| 3 — BUILD | 7–29 days | 2–3 weeks |
| 4 — GROW | 30+ days | 4+ weeks |

Crossing a threshold triggers a 450ms cross-fade between stages plus confetti.
A missed day keeps the sprout at its current stage rather than dropping back
to seed; only an actual streak reset to 0 returns it to seed. The badge
system is a separate moment-reward layer (badges fire at 1/3/7/14/21/30/50/100
days unchanged).

The onboarding flow plays a 3-second sprout-stage cycle with the caption
"Plant. Nourish. Grow." right after the user taps Start Tracking — sets the
brand promise without a heavy explainer. Tap-to-skip.

## Privacy features

All free, all on-device. Designed for goals you'd rather not announce to a
glancing housemate.

- **PIN lock** — 4-digit PIN, SHA-256 hashed, required on every fresh launch.
  Toggle in Settings → Privacy. Native Face ID / fingerprint comes with the
  Capacitor wrap.
- **Hide goal name** — Show a label of your choice instead of the real goal
  text anywhere it would appear in the UI. Internal data is unchanged so
  export still works.
- **Discreet notifications** — Notification bodies never include the goal
  name. (Already enforced; the toggle is the user-visible promise.)
- **Background blur** — Default-on. Content blurs on `visibilitychange` /
  `pagehide` so the iOS app-switcher thumbnail doesn't show readable text.

## Data shape (v2)

```js
{
  version: 2,
  goal: "No junk food",
  goalMode: "do" | "avoid",
  goalType: "daily" | "weekly_target",
  weeklyTarget: 5,                 // 3..6, only used in weekly_target mode
  startDate: "YYYY-MM-DD",
  entries: {
    "YYYY-MM-DD": { result: "yes" | "no", note: "", loggedAt: ISO },
  },
  earnedBadges: {},
  badgeCounts: {},
  badgeCountedRun: {},
  reminders: [
    { id: "morning", time: "08:00", enabled: bool, preset: true },
    { id: "evening", time: "20:00", enabled: bool, preset: true },
    // + zero or more custom reminders (Pro)
  ],
  freezesEarned: 0,                // weekly_target only
  freezesUsed: 0,
  weeklyFreezesByWeek: { "YYYY-MM-DD": true, ... },  // Monday-keyed
  isPro: false,
  biometricLockEnabled: false,
  hideGoalName: false,
  displayGoalName: "",
  discreetNotifications: true,
  createdAt: ISO,
}
```

## Pro tier

Real IAP receipt verification ships with the Capacitor wrap. For now `isPro`
is a local boolean. Dev gesture to toggle: tap the **GROUND** wordmark in the
topbar 7 times within 3 seconds.

**Gated** (free shows a Pro prompt):

- Calendar months ending more than 30 days ago
- JSON export and import
- Adding custom reminders (free has the two presets only)
- A second stored streak freeze (free caps at 1)

**Free forever**: daily check-in, current/best streak, 7-day strip, last
30 days calendar, 30-day trend chart, all stats cards, both modes and both
types, one stored freeze, the full 4-stage sprout progression, all privacy
features, both preset reminders, milestones / badges / confetti, goal
renaming, dark theme, reflection notes.

## Design system

| Token       | Value     |
|-------------|-----------|
| `--bg`      | `#0a0a0a` |
| `--surface` | `#141414` |
| `--text`    | `#f0f0f0` |
| `--sub`     | `#888`    |
| `--muted`   | `#444`    |
| `--accent`  | `#e8f55a` (electric lime — Ground brand color) |
| `--success` | `#4dff91` |
| `--fail`    | `#ff4d4d` (in-the-moment "No" only — never in history views) |

Fonts: **Syne 800** display (wordmark, headlines, big numbers), **DM Sans**
body, **DM Mono** for inline numbers and dates.

## Extending

### Cloud sync

The data layer is isolated. To add sync, replace `loadData()` / `saveData()`
in `src/data.js` with API calls. The `entries` shape maps cleanly to a DB
table: `(user_id, date, result, note)`. Add auth, then bootApp behind a
fetch instead of a localStorage read.

### Capacitor wrap

`src/privacy.js` exposes `toggleBiometricLock(enable)` and `gateOnLock()` as
the bind points. Swap the PIN implementation for `@capacitor/biometric` in
the native build. Same for `isPro` in `src/pro.js` — replace the local flag
with receipt-verified state from `@capacitor/app-store` or RevenueCat.

### Adding screens

1. Add a `<div id="screen-foo" class="screen">` in `index.html`.
2. Add a `<button class="nav-btn" data-screen="foo">` in the nav.
3. Wire a render call in `src/router.js`.

## Maintenance notes

Moving parts that live outside this repo:

- **OneSignal App ID** — `aaaa6422-7202-4d6e-8010-618cb66ac95e`, hard-coded
  in `index.html`. Rotating this requires re-tagging existing subscribers.
- **OneSignal REST API Key** — Cloudflare Worker env var
  `ONESIGNAL_REST_API_KEY`. Keep secret.
- **Cloudflare Worker** — deploy `cloudflare-worker.js` with cron trigger
  `0 0 * * *` (midnight UTC). Env: `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`.
- **PWA cache version** — bump `CACHE = 'ground-v3'` in
  `OneSignalSDKWorker.js` whenever a release should bust client caches.

## Self-tests

`/verify.html` imports the live modules and runs assertions on:

- v1→v2 migration shape and idempotency
- Date math (week boundaries, addDays)
- `createFreshState` shape
- Daily `computeStats` (wins/fails, currentStreak, best, rate, streak reset)
- Weekly `computeStats` (target hit, freezes earned/applied, free/pro caps)
- `winsThisMonth`

Hit it on any device after deploying to confirm the model layer is green.

## Known limitations

- One goal at a time — by design, not a roadmap item.
- PWA biometric is best-effort (PIN-based). Real Face ID / fingerprint
  requires the Capacitor wrap.
- iOS push notifications require the user to "Add to Home Screen" first.
  An in-app banner walks them through it.
- Reminders fire reliably from the Cloudflare Worker. The in-app
  `Notification` API only fires while a tab is open — useful as a fallback,
  not a primary channel.
- Service worker cache is install-time; new shell assets land after a reload.

## License — Private. No license granted.
