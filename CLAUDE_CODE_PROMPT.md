# Ground — Refactor, Rebrand & Feature Pass Prompt for Claude Code

You are working on a PWA habit tracker located at `C:\Users\nache_rl1pdne\Desktop\streak-app\` (folder name kept for now; will be renamed later when convenient). The app's current product name is "Streak" and is being rebranded to **Ground** as part of this work. The app is functional but has accumulated dead code, has UX issues that hurt retention for "do daily" users, and needs privacy + monetization scaffolding for an upcoming App Store release. This prompt covers five phases of work in one pass. Do them in order. Run the verification checklist at the end before considering the work done.

**The new brand:** Ground. Tagline: *"Stay grounded."* Secondary tagline (for onboarding and seasonal campaigns): *"Plant. Nourish. Grow."* App Store subtitle: *"Daily Discipline Tracker"*.

The metaphor is layered. *Ground* is where you stand each day — the foundation, the place you return to even after slipping. The visual identity is a sprout emerging from a ground line: Alma 32's seed-of-faith parable meets Matthew 7's house-on-the-rock. Daily check-ins are the nourishment; missed days don't kill the sprout, they just don't grow it that day. It maps onto every audience (sobriety, exercise, scripture reading, family challenges, recovery), and the privacy positioning works on two levels: the ground beneath you isn't visible to anyone, and a seed planted in the heart is yours alone.

The word "streak" as a *common noun* (meaning the user's current consecutive-day count) stays everywhere in the UI. It's the brand name "Streak" that's being replaced with "Ground."

---

## Project Context (read before touching anything)

**Stack:** Single `index.html` (~2,720 lines, inline HTML/CSS/JS). No build step, no npm, no framework. `localStorage` persistence under key `streak_app_v1`. PWA support via `OneSignalSDKWorker.js` (which also handles cache). Push notifications via OneSignal. Daily reminder backend via Cloudflare Worker (`cloudflare-worker.js`).

**The single-goal, one-tap philosophy is sacred.** Don't break it. One active goal at a time. Two big check-in buttons. Calendar shows history of that one goal. Don't introduce multi-goal support in this pass.

**Things that are good — leave alone:**
- The streak ring SVG and animation on the dashboard
- The badge system, badge celebration screen, badge migration logic (`migrateBadgeCounts`, `getCurrentRunStartDate`, `checkBadgesForStreak`)
- The confetti renderer (`launchConfetti`)
- The toast system
- The onboarding flow structure (we'll add to it, not replace it)
- The modal infrastructure
- Goal renaming inline edit flow
- Export/import functions
- The CSS variables and dark-mode design system
- iOS standalone-mode detection and the iOS add-to-home-screen banner
- OneSignal init code and auto-opt-in behavior
- The `_visibilityBound` guard pattern

**Things you must NOT do:**
- Do not add a build step, npm, package.json, Vite, webpack, or TypeScript
- Do not introduce a backend, accounts, or cloud sync
- Do not change the OneSignal App ID
- Do not change the Cloudflare Worker cron schedule
- Do not remove badges, confetti, or celebrations
- Do not change the dark color scheme or font choices
- Do not change the storage key (`streak_app_v1`) — handle data migration in place

We *are* splitting `index.html` into ES modules in Phase 0 below, but this is a structural split using native browser modules — no build step, no bundler.

---

## PHASE 0 — Module split (do this first, in a separate commit)

Goal: extract the single 2,720-line `index.html` into a clean ES-module structure with **zero behavior changes**. This is a pure refactor. If anything works differently after Phase 0 than before, it's a regression.

### 0.1 Target file structure

```
streak-app/
  index.html              # markup only + a single <script type="module" src="src/main.js"></script>
  styles.css              # everything currently inside <style>
  manifest.json
  cloudflare-worker.js
  OneSignalSDKWorker.js
  OneSignalSDKUpdaterWorker.js
  streak-logo.png         # renamed in Phase 1
  streak-thumbnail.png    # renamed in Phase 1
  README.md
  CLAUDE_CODE_PROMPT.md
  src/
    main.js               # boot + init (the existing IIFE at the bottom of the file)
    constants.js          # MILESTONES, MILESTONE_MSGS, BADGES, STORAGE_KEY
    data.js               # loadData, saveData, createFreshState, migrations
    dates.js              # todayStr, parseDate, formatMonthYear, formatDisplayDate, dayOfWeek, addDays
    stats.js              # computeStats, getCurrentRunStartDate, getNextMilestone
    state.js              # appData export + helper getters/setters, mode helpers
    router.js             # showScreen
    checkin.js            # logDay, editTodayInline (the FIXED version), getMotivationLine
    modal.js              # openModal, closeModal, selectModalResult, saveModal, updateModalResultBtns
    confirm.js            # showConfirm, closeConfirm, confirmOk, closeConfirmOnOverlay
    badges.js             # checkBadgesForStreak, renderBadges, showBadgeCelebration, closeBadgeCelebration, playBadgeSound, migrateBadgeCounts
    celebrate.js          # showMilestoneBanner, closeMilestone, launchConfetti
    toast.js              # showToast
    notifs.js             # all reminder code: initNotifBanners, autoEnable, formatReminderTime, migrateReminders, renderReminderSettings, toggle/add/update/delete reminder, _waitForOneSignal, _fireReminders, checkReminder, checkMissedReminders, isIOS, isInStandaloneMode, banner handlers
    export.js             # exportData, importData, resetApp
    goal.js               # renameGoal, startGoalEdit, saveGoalInline, handleGoalKey
    render/
      dashboard.js        # renderDashboard
      calendar.js         # renderCalendar (the screen, not the calendar widget — same module handles cal nav too)
      stats.js            # renderStats
      settings.js         # renderModeSettings, setSettingsMode (and the privacy/pro UI added in Phase 3)
```

### 0.2 Rules for the split

- Use `export` / `import` with ES module syntax. The script tag in `index.html` is `<script type="module" src="src/main.js"></script>`. No bundler. No transpilation. Modern browsers handle this natively, including iOS Safari 12+.
- Inline `onclick="foo()"` handlers in the markup will break with modules (modules don't expose to global scope). Replace them with `addEventListener` calls in the appropriate render or event-binding module. Do this systematically — don't leave any inline handlers.
- Module imports should be relative and include the `.js` extension (`import { foo } from './data.js'`) — required for native modules.
- The OneSignal global (`window._os`) and the inline OneSignal init script in `<head>` stay where they are — they're third-party SDK code and don't need module-ifying.
- `appData` is module-level state. Export it as a getter from `state.js`, or pass it explicitly to functions. Whichever is cleaner; do NOT make it a `window` global.
- CSS goes to `styles.css` verbatim. Update `<link rel="stylesheet" href="styles.css">` in the `<head>`.
- The `(function init() { ... })()` IIFE at the bottom becomes the top-level code in `main.js`.

### 0.3 Verify parity before moving on

Before starting Phase 0.5, manually verify:
- App boots fresh (no localStorage) and onboarding works exactly as before
- App boots with existing data and renders dashboard exactly as before
- All four nav screens render: Today, History, Stats, Badges, Settings
- Check-in (yes / no) works and updates streak, stats, calendar
- Calendar prev/next navigation works
- Modal open/save/cancel works
- Goal rename (both inline and settings) works
- Reminder toggle works (presets and custom)
- Export and import roundtrip works
- No console errors anywhere
- No `onclick=` attributes remain in the markup

Only then proceed to Phase 0.5.

---

## PHASE 0.5 — Rebrand: Streak → Ground (do this after the split, before hygiene)

Goal: rename the product from "Streak" to "Ground" across every user-facing string and every asset. **Zero behavior changes.** This is purely a rebrand commit, separate from Phase 0 and Phase 1.

### 0.5.1 What is being renamed

- The **product name** "Streak" → "Ground" (proper noun, brand)
- The **page title**, manifest, apple-mobile-web-app-title, README header
- Asset filenames (logos and thumbnails)
- The OneSignalSDKWorker cache name (`streak-v6` → `ground-v1`)
- All toast/banner copy that references the brand by name
- Comments at the top of `cloudflare-worker.js`

### 0.5.2 What is NOT being renamed (important — read carefully)

- The CSS class names (`.streak-display`, `.streak-ring-svg`, `.streak-number`, `.streak-target`, `.streak-motivation`, `.streak-milestone-label`, `.streak-label`, etc.) — these refer to the noun "streak" (the user's consecutive-day count), which is a normal English word the app still uses. Leave these alone.
- The data-shape field names referring to streaks (`currentStreak`, `best`, etc. as returned from `computeStats`)
- The `STORAGE_KEY` constant value `'streak_app_v1'` — changing this would orphan all existing user data. **Keep this exact string.** Internal code can rename the *constant identifier* if you want, but the *value* must remain `'streak_app_v1'`.
- The UI copy where "streak" is used as a noun ("Current Streak", "Personal Best Streak", "Streak Reset", "X days to beat your best", etc.). These describe what the user has, not the brand.
- The folder path on disk (`C:\Users\nache_rl1pdne\Desktop\streak-app\`). The user will rename it later.

### 0.5.3 String-by-string changes

In `index.html`:
- `<title>Streak — Daily Discipline Tracker</title>` → `<title>Ground — Daily Discipline Tracker</title>`
- `<meta name="apple-mobile-web-app-title" content="Streak" />` → `<meta ... content="Ground" />`
- Onboarding title `<div class="onboard-title">STREAK</div>` → `<div class="onboard-title">GROUND</div>` (keep the all-caps display treatment that's already in the CSS)
- Onboarding subtitle (currently "Pick one discipline. Track it daily.<br>Watch the streak grow.") → "Pick one discipline. Track it daily.<br>Stay grounded."
- Image `alt="STREAK"` → `alt="Ground"`
- Toast messages that say "Streak" by name (search for the string `'Streak'` in JS) → update to "Ground" where the brand is meant; leave "streak" alone where the noun is meant
- The notification constructor `new Notification('Streak Reminder', ...)` → `new Notification('Ground', ...)`

In `manifest.json`:
- `"name": "Streak — Daily Discipline Tracker"` → `"name": "Ground — Daily Discipline Tracker"`
- `"short_name": "Streak"` → `"short_name": "Ground"`
- `"description": "Track your daily discipline streak"` → `"description": "Daily discipline. Stay grounded."`
- Update icon path to the new asset filename (see 0.5.4)
- Split the icon entry into two: one with `"purpose": "any"` and one with `"purpose": "maskable"` referencing the same file. (Combined `"any maskable"` is deprecated.)

In `OneSignalSDKWorker.js`:
- `const CACHE = 'streak-v6';` → `const CACHE = 'ground-v1';`
- Update the `c.addAll([...])` entry to reference the new logo filename
- Top comment if any: update brand mention

In `cloudflare-worker.js`:
- Top comment block "Streak App — Daily Reminder Worker" → "Ground — Daily Reminder Worker"
- (Notification body copy is being softened in Phase 2.9; don't touch the body strings here.)

In `README.md`:
- Defer until Phase 4 (full rewrite). Don't patch it now.

### 0.5.4 Asset cleanup and reference updates

The new Ground-branded asset files have already been provided in the project root (PNGs only — no SVGs):

- `ground_logo.png` — horizontal wordmark with sprout, lime on transparent (use anywhere the brand mark appears)
- `ground_logo_2x.png` — high-density version of the wordmark logo for retina displays
- `ground_thumbnail.png` — square app icon, lime sprout on dark `#0a0a0a` background (this is the manifest icon and the splash image)
- `ground_icon.png` — sprout mark alone on transparent background (use anywhere the icon appears outside the dark app surface)
- `ground_icon_180.png` — 180×180 apple-touch-icon (transparent)
- `ground_icon_192.png` — 192×192 PWA icon (transparent)
- `ground_icon_1024.png` — 1024×1024 App Store-ready (transparent)

**Plus the 4-stage growth progression** (used in Phase 2 to replace the streak ring with a growing sprout visual; see 2.11):

- `ground_stage_1.png` — Day 0: the seed is planted (vertical leaf-pod with center slit, about to split open)
- `ground_stage_2.png` — Day 1–6: first growth emerging (a small curl/hook breaking the surface)
- `ground_stage_3.png` — Day 7–29: leaves emerging (mini version of the full sprout)
- `ground_stage_4.png` — Day 30+: full sprout (same image as `ground_icon.png`)

Your job here is:

1. **Delete the old Streak-branded image files** from the project root:
   - `streak-logo.png`
   - `streak-thumbnail.png`
   - (Plus any leftover `STREAK *.png` files if any remain.)

2. **Update every reference** in `index.html`, `manifest.json`, and `OneSignalSDKWorker.js`:
   - `streak-logo.png` → `ground_logo.png`
   - `streak-thumbnail.png` → `ground_thumbnail.png`
   - The `<link rel="apple-touch-icon">` in `index.html` should point to `ground_icon_180.png` for proper iOS home-screen rendering.

3. **Update `manifest.json` icon entries** to use multiple sizes now that we have them:
   ```json
   "icons": [
     { "src": "ground_icon_192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
     { "src": "ground_thumbnail.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
     { "src": "ground_thumbnail.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
   ]
   ```

After this section, the only `streak-*.png` files in the project root should not exist; all image references should point to the appropriate `ground_*` file.

### 0.5.5 Verify

Before proceeding to Phase 1:
- The word "Streak" (capital S, as a brand) appears nowhere in `index.html`, `manifest.json`, `OneSignalSDKWorker.js`, or `cloudflare-worker.js`. (Use a search to confirm.)
- The lowercase noun "streak" still appears where it should — referring to the user's consecutive-day count.
- The old `STREAK *.png` filenames don't exist on disk and aren't referenced anywhere.
- `STORAGE_KEY` value is unchanged.
- App boots and behaves identically to post-Phase-0. New title shows in the browser tab. Manifest reads correctly.
- iOS home screen install (if you have a test device) shows "Ground" under the icon.
- This is a single commit titled something like "rebrand: Streak → Ground."

---

## PHASE 1 — Hygiene

Goal: remove dead code, fix real bugs, clean up assets. Surgical and reversible.

### 1.1 Delete dead files
- Delete `sw.js` from the repo. It's actively unregistered at boot (the cleanup block in the original `init()` IIFE that loops over `navigator.serviceWorker.getRegistrations()` and unregisters any non-OneSignal worker). It serves no purpose. The live service worker is `OneSignalSDKWorker.js`.
- (Old logo cleanup and asset renames were handled in Phase 0.5. Verify there are no leftover `STREAK *.png` files in the repo before continuing.)

### 1.2 Verify Phase 0.5 cleanup is complete
- No file named `STREAK logo.png`, `STREAK logo v2.png`, `STREAK logo v3.png`, `STREAK logo v4.png`, or `STREAK Thumbnail.png` exists on disk.
- Every reference in `index.html`, `manifest.json`, and `OneSignalSDKWorker.js` points to `ground_logo.png` or `ground_thumbnail.png`.

### 1.3 Remove the boot-time sw.js unregister block
In `src/main.js`, there's a block that unregisters any service worker that isn't OneSignalSDKWorker.js. Since `sw.js` is now deleted, simplify the service-worker registration to just register OneSignalSDKWorker.js without the cleanup logic. Keep the fallback `.catch(() => {})`.

### 1.4 Remove dead variable
In `computeStats` (now in `src/stats.js`), `let prevResult = null;` is declared but never used. Delete it.

### 1.5 Start using the `version` field for real
The `version: 1` field on `appData` is set but never read. Bump it to `version: 2` going forward and add a simple migration check in `bootApp` so future schema changes have a hook. For this pass, the migration step should:
- If loaded data has `version: 1` (or undefined), set `goalType: 'daily'` (preserves existing user experience), `weeklyTarget: 5`, `freezesEarned: 0`, `freezesUsed: 0`, `isPro: false`, then save with `version: 2`.
- The migration must be idempotent.

### 1.6 Fix the editTodayInline data-loss bug
Current `editTodayInline()` (now in `src/checkin.js`) deletes today's entry, losing the original `loggedAt` timestamp and any note. Replace it with an "Edit Today" flow that opens the existing day-edit modal pre-filled with today's data. The modal already handles save correctly.

### 1.7 Guard calendar nav listeners against double-binding
Apply the same pattern used for `_visibilityBound` to the `cal-prev` / `cal-next` listeners in `bindEvents`. Use `bindEvents._calNavBound` as the guard flag.

### 1.8 Remove unused CSS classes
Grep for `text-center` usage in `index.html`. If unused, delete the CSS rule. Do not remove `.hidden` — it's used.

### 1.9 README is stale — full rewrite (Phase 4 below)
README claims `sw.js` is the service worker and describes a single-file architecture. Both are now misleading. Don't touch it yet — it gets rewritten in Phase 4.

---

## PHASE 2 — UX fixes (the retention pass)

Goal: make the app feel kind to users who miss days. A busy mom tracking "lift 20 min" should feel encouraged when she opens it, not shamed.

### 2.1 Add a new dimension: goal *type* (different from goal *mode*)

The existing `goalMode: 'do' | 'avoid'` only changes button labels. We're adding an orthogonal dimension:

```js
goalType: 'daily' | 'weekly_target'   // NEW
weeklyTarget: 5                        // NEW — only used when goalType === 'weekly_target'
```

**Daily mode** is the existing behavior — every day matters, missing a day breaks the streak. Best for `avoid`-style goals (sobriety, no porn, no junk food) and for `do`-style goals where the user wants strictness.

**Weekly target mode** is new — the user picks how many days per week they want to hit (3, 4, 5, or 6). The streak counter measures *weeks where the target was hit*, not consecutive days. Missing 1–2 days in a week is fine.

### 2.2 Onboarding additions

After the existing goal text input and `do/avoid` toggle, add a third question:

```
HOW OFTEN?

[ Every day ]   [ Some days a week ]
```

If "Some days a week" is selected, reveal a row of buttons for 3 / 4 / 5 / 6 days. Default to 5.

Save `goalType` and `weeklyTarget` in `createFreshState`. Existing user data should default to `goalType: 'daily'` via migration (see 1.5).

### 2.3 Settings: allow switching goal type later

Add a "Schedule" section to settings, below "Goal Mode," mirroring the same UI as onboarding. Updating it should re-render the dashboard. Allow switching freely — historic entries don't need to be re-interpreted.

### 2.4 Refactor `computeStats` to be type-aware

When `goalType === 'daily'`:
- Existing behavior unchanged.

When `goalType === 'weekly_target'`:
- A "week" runs Monday–Sunday (locale-independent).
- For each week with logged data, compare yes-day count to `weeklyTarget`. Week is a "hit" if `yesCount >= weeklyTarget`.
- `currentStreak` = number of consecutive hit weeks ending in the current or previous week.
- `best` = longest run of consecutive hit weeks.
- `wins` and `rate` continue to count individual yes-days (so daily check-in still feels rewarding).

Return shape stays the same so renderers don't have to branch heavily; add an extra field `weeksHit` for the weekly view.

### 2.5 Calendar colors — kill the red

Currently `.cal-cell.no` paints missed days red (`var(--fail)`). Change it to a neutral muted style:
- Background: `var(--surface)` (same as default)
- Border: dashed, `var(--muted)`
- Text: `var(--muted)`

In other words, a missed day should look identical to an unlogged day — both are simply "blank." The successful days remain green. This is the single biggest visual change.

Same treatment for `.chart-bar.no` in the 30-day chart: use `var(--muted)` instead of `var(--fail)`.

Remove `#ff4d4d` (the fail color) from the confetti palette in `launchConfetti`.

The `--fail` CSS variable stays defined but should no longer be applied to history visualizations. It's fine to keep on the in-the-moment check-in "No" button.

### 2.6 Rename / soften the "Misses" stat

In the stats screen, change the `stat-fails` card:
- Label: "Off days" (not "Misses")
- Value color: `var(--text)` or `var(--muted)`, **not** `var(--fail)`
- De-emphasize: smaller font, lower visual hierarchy

Add a new prominent card: **"Wins this month"** — show the count of yes-days in the current calendar month. Color: `var(--success)`. This becomes the co-primary metric alongside current streak so users always have a growing number to feel good about.

### 2.7 Dashboard motivation copy — extend `getMotivationLine`

Update `getMotivationLine(s)` to be type-aware and softer on return after misses. Suggested copy:

For `daily` mode:
- Brand new: "Every streak starts with Day 1. Let's go."
- Streak broken, returning: "Welcome back. Today's the day."
- Streak of 1: "Day 1 done. One more tomorrow."
- 2-6 days: `"${days} days in. Build it up."`
- 7: "One full week. Real progress."
- 14: "Two weeks. You're locked in."
- 21: "21 days. Habit territory."
- 30+: `"${days} days. This is who you are now."`

For `weekly_target` mode (current streak counts weeks):
- 0 weeks: "Let's get this week's target."
- 1 week: "One week hit. Keep going."
- 2-3 weeks: `"${weeks} weeks of hitting your target."`
- 4+ weeks: `"${weeks} weeks straight. You found your rhythm."`

**Never** show "Streak broken," "X days since last check-in," or negative miss-counts anywhere. If `currentStreak === 0` and history exists, lead with the comeback framing, not the loss.

### 2.8 Welcome-back banner for returning users

When the app loads and the user's last entry is more than 1 day ago (and current streak is 0), show a one-time dismissible banner on the dashboard at the top:

> **Welcome back.**
> Take today. The past is past.

Style it like the existing `#notif-banner` but with `--text` colors, not the accent green. Dismiss-only; don't auto-hide.

### 2.9 Softer reminder copy — both channels

**In `cloudflare-worker.js`:**

Replace the current notification copy with something kinder:
```js
// Morning
headings: { en: 'Good morning' },
contents: { en: 'Take today when you have a minute.' },

// Evening
headings: { en: 'Quick check-in' },
contents: { en: 'How did today go?' },
```

No "stay strong," no "your streak is counting on you," no fire emojis in the body. Generic, supportive, non-pressuring.

**In `index.html` `_fireReminders`:**

The current messages include the goal name in the body — this is both a privacy leak (covered in Phase 3) and pressure-heavy. Replace with generic:
```js
const messages = {
  morning: 'Good morning. Take today when you have a minute.',
  evening: 'Quick check-in when you have a minute.',
};
```

No `${appData.goal}` interpolation anywhere in notification bodies.

### 2.10 Streak freezes — weekly_target mode only

Add freeze tracking to data shape:
```js
freezesEarned: 0,
freezesUsed: 0,
```

Logic (only applies when `goalType === 'weekly_target'`):
- Every 7 successful yes-days earns 1 freeze (track via `Math.floor(totalWins / 7)` vs `freezesEarned`).
- Cap stored freezes at 2 (do not increment beyond `freezesUsed + 2`).
- When evaluating whether a week was a "hit," if the user fell short by 1 day, **automatically** apply a freeze if available: increment `freezesUsed`, mark that week as hit anyway.
- Show a small snowflake "❄️" indicator on weeks where a freeze was used (calendar header for that week).
- Settings should show: "Streak freezes: 1 stored" (or whatever the count is).

For `daily` mode, freezes are deliberately NOT available. People tracking sobriety shouldn't get to skip days.

### 2.11 The sprout-progression visual (replaces the streak ring on the dashboard)

The brand identity is built around a 4-stage growth progression (SEED → START → BUILD → GROW). Use it as the dashboard's hero visual instead of the existing circular streak ring. The user *sees* their sprout grow as their streak grows — daily, visible, dopamine-positive, and crucially: it never "breaks." A missed day means the sprout just doesn't advance that day. No shame loop.

**Stage thresholds** (use `currentStreak` from `computeStats`):
- `currentStreak === 0` → `ground_stage_1.png` (the seed is planted; today is when you nourish it)
- `currentStreak >= 1 && currentStreak <= 6` → `ground_stage_2.png` (first growth)
- `currentStreak >= 7 && currentStreak <= 29` → `ground_stage_3.png` (leaves emerging)
- `currentStreak >= 30` → `ground_stage_4.png` (full sprout)

**Implementation notes:**
- Render the stage via an `<img>` tag pointing to one of the four `ground_stage_*.png` files. The OneSignalSDKWorker cache will pick them up on first load and serve them offline thereafter.
- The stage image fills the same space the streak ring currently occupies (`.streak-ring-wrap`). Keep the streak number ("47") overlaid in the center or just below the sprout — that's still the primary number.
- When the user crosses a stage threshold via a successful check-in, trigger a small celebration: confetti (the existing `launchConfetti` works) plus a one-shot transition between the old and new stage image (swap the `<img src="…">` with a 400-500ms cross-fade via CSS opacity transition; nothing elaborate).
- For `weekly_target` mode, use the same thresholds but count *weeks hit* instead of days. The progression caps at "GROW" after 4 hit weeks (week 30+ in daily mode, 4+ weeks in weekly mode).

**Don't remove the existing badge system** — it stays as a separate rewards layer. Badges fire at the legacy milestones (3, 7, 14, 21, 30, 50, 100 days). The sprout progression is the *ambient* visual reward; badges are the *moment* reward.

**Optional onboarding flourish:** in the onboarding flow, after the user enters their goal and picks daily/weekly, show a quick 4-frame animation of the sprout progression (SEED → START → BUILD → GROW) cycling once over ~3 seconds, with the text "Plant. Nourish. Grow." underneath. Sets the brand promise without a heavy explainer.

---

## PHASE 3 — Privacy + Pro scaffolding

Goal: lay the groundwork for "the privacy-first challenge tracker" positioning and gate the right features behind a `isPro` flag (real IAP comes later during the Capacitor wrap, not in this pass).

### 3.1 New data fields

In `createFreshState` and the migration:
```js
isPro: false,
biometricLockEnabled: false,
hideGoalName: false,
displayGoalName: '',  // user-chosen label that replaces the real goal in the UI when hideGoalName is true
discreetNotifications: true,  // already enforced by 2.9; this is the user-visible toggle
```

### 3.2 Privacy settings section

Add a new section in Settings titled "Privacy":
- **Lock app with Face ID / fingerprint** — toggle. When enabled, the app requires biometric (or PIN fallback) auth on every fresh launch. Implementation: WebAuthn API for PWA. If WebAuthn isn't available, fall back to a 4-digit PIN stored as a SHA-256 hash in localStorage. This is best-effort in PWA mode; real native biometric comes with Capacitor.
- **Hide goal name in app** — toggle. When on, show a separate text input "Show this name instead:" with placeholder "My Goal." The topbar and all visible goal references should use `displayGoalName` instead of `appData.goal`. Internal data stays unchanged.
- **Discreet notifications** — toggle. Default ON. (No-op for now since notification bodies already don't contain the goal; the toggle just exists as a user-visible promise.)

### 3.3 Background blur

Add a CSS class `.app-blurred`:
```css
.app-blurred { filter: blur(20px); }
```

In the existing `visibilitychange` listener (in `bindEvents`), when `document.visibilityState === 'hidden'`, add `.app-blurred` to `#app`. When visible again, remove it. This prevents the iOS app-switcher screenshot from showing readable content.

Don't gate this behind a setting — make it default behavior. It's a free win.

### 3.4 Lock screen overlay (when biometric is enabled)

Build a simple full-screen overlay shown on app boot when `biometricLockEnabled === true`. Shows the app logo and a single button: "Unlock with Face ID" (or "Enter PIN"). On success, hide the overlay and render the app. On failure, stay locked.

Implementation notes for Claude Code:
- WebAuthn registration: prompt once when the toggle is flipped on, store the credential ID in localStorage.
- WebAuthn authentication: on each subsequent boot, use the stored credential ID.
- PIN fallback: 4 digits, hashed with SHA-256 (use `crypto.subtle.digest`). Compare hashed input against stored hash.
- This is intentionally lightweight. The real lock comes with Capacitor's native biometric plugin later.

### 3.5 Pro flag and dev-tools toggle

`isPro` already added in 3.1. Add a hidden way to toggle it for testing:
- Settings → tap the "Streak" wordmark in the topbar 7 times in a row within 3 seconds → flips `isPro` and shows a toast confirming.
- This is for testing only. Will be replaced by real IAP receipt verification during Capacitor wrap.

### 3.6 Pro gates

Each of these features should check `appData.isPro` and either render normally or show a paywall card with a "Get Pro" CTA. The CTA does nothing for now (clicking it shows a toast: "Pro launching soon").

Gated features:
- **Calendar navigation older than 30 days** — when user clicks prev-month and would scroll past 30 days ago, show paywall card instead of the calendar grid.
- **JSON export** — paywall on click.
- **JSON import** — also gate (so the export/import set stays paired).
- **Custom reminders** (the "+ Add Reminder" button) — gate. Free tier gets the two presets only.
- **Streak freezes beyond 1 stored** — free tier caps at 1 stored freeze; Pro at 2.

NOT gated (free forever):
- Daily check-in
- Current streak + personal best
- Last 7 days strip
- Today + last 30 days calendar
- 30-day trend chart and all current stats cards
- Weekly target mode and freezes (up to 1)
- All privacy features (biometric, hide goal name, discreet notifications)
- All reminders from the two presets (morning + evening)
- All milestone celebrations and confetti
- Goal renaming
- Dark theme
- Reflection notes

### 3.7 Pro upgrade prompts — three trigger points only

Build a single reusable `showProPrompt(trigger)` function that displays a centered modal with copy keyed to the trigger:

1. **7-day milestone** — first time user hits a 7-day streak after the milestone banner closes:
   > "You've made it a week. Lock in your progress and unlock full history, exports, and custom reminders with Streak Pro."
   > [ Maybe later ] [ Get Pro ]

2. **Calendar scroll past 30 days** — see 3.6.

3. **Export attempt** — see 3.6.

Do NOT add upgrade prompts on launch, on the dashboard, on check-in, or anywhere in the daily loop. The free tier should be lovable; Pro is for the people who are already in deep.

### 3.8 Onboarding placeholder hygiene

The goal input placeholder currently says `"e.g. No junk food"`. Add a couple of additional rotating examples (rotate every 3 seconds while the input is empty): "e.g. Lift 20 min", "e.g. Read scripture", "e.g. No social media", "e.g. Drink water". Subtle, but signals versatility.

Don't pre-fill any sensitive label. The placeholder is fine; the actual value is always user input.

---

## PHASE 4 — README rewrite

Replace `README.md` entirely. The current one is stale. New README should accurately describe:

- What the app is and the single-goal philosophy
- Current architecture: ES-module structure under `src/`, native browser modules with no build step, `OneSignalSDKWorker.js` as the live PWA service worker, Cloudflare Worker for daily reminders
- Include the file structure diagram (the one from Phase 0.1) so future maintainers know where everything lives
- The two modes (do/avoid) and two types (daily/weekly_target) — explained as user-facing concepts
- Privacy features: biometric lock, hide goal name, discreet notifications, background blur
- Data shape (current, version 2) with all the new fields
- How to run locally
- How to extend (cloud sync hook points, Capacitor wrap path)
- Design system tokens
- Maintenance notes — list the moving parts (OneSignal App ID, Cloudflare env vars, cache version in OneSignalSDKWorker.js)
- Known limitations (PWA biometric is best-effort; iOS push requires Add to Home Screen; one goal at a time)

Keep it concise — under 300 lines. Drop the "Features" status table; everything's done.

---

## Verification Checklist

Run through these manually after the changes. If any fail, fix before declaring done.

### Phase 0
- [ ] `index.html` contains markup only and a single `<script type="module" src="src/main.js"></script>` plus the OneSignal SDK script tag in `<head>`
- [ ] No `onclick=` attributes remain anywhere in the markup
- [ ] `styles.css` exists at the project root and contains all the original CSS
- [ ] All modules in `src/` use `import` / `export` with explicit `.js` extensions
- [ ] App boots cleanly with no console errors on a fresh load
- [ ] App boots cleanly with existing v1 localStorage data
- [ ] All five nav screens render correctly: Today, History, Stats, Badges, Settings
- [ ] Check-in, modal edit, calendar nav, goal rename, reminder toggle, export, import all work identically to pre-split
- [ ] No `window.someFn = ...` global assignments (modules don't leak to global scope)
- [ ] Phase 0 is its own commit, distinct from Phase 1+ changes

### Phase 0.5
- [ ] Browser tab title reads "Ground — Daily Discipline Tracker"
- [ ] iOS home screen icon label reads "Ground" (verify by installing PWA on a phone)
- [ ] Onboarding screen big headline says "GROUND"
- [ ] Onboarding subtitle says "Stay grounded."
- [ ] `manifest.json` has `"name": "Ground — Daily Discipline Tracker"` and `"short_name": "Ground"`
- [ ] `manifest.json` icon entries are split into "any" and "maskable" (not combined)
- [ ] `OneSignalSDKWorker.js` CACHE constant is `'ground-v1'`
- [ ] Searching `index.html` for the capital-S string `"Streak"` returns no brand-name uses (lowercase "streak" as the user's day-count is fine)
- [ ] `STORAGE_KEY` value is still `'streak_app_v1'` (unchanged — preserves existing user data)
- [ ] Existing user with v1 localStorage data still sees their full history after the rebrand
- [ ] Notification title says "Ground" not "Streak Reminder"
- [ ] All CSS class names with "streak" in them are still intact (e.g., `.streak-display`, `.streak-ring-svg`)

### Phase 1

### Phase 1
- [ ] `sw.js` is deleted from the folder
- [ ] No file references `STREAK logo v4.png` or `STREAK Thumbnail.png` anywhere
- [ ] `ground_logo.png` and `ground_thumbnail.png` exist and are referenced correctly
- [ ] App still loads and renders correctly
- [ ] Editing today via the "Tap to edit today's log" link opens the modal pre-filled (not deletes the entry)
- [ ] `prevResult` doesn't appear in `computeStats` anymore
- [ ] Migrating an existing v1 dataset (open the app with old data in localStorage) bumps to v2 without losing entries

### Phase 2
- [ ] Onboarding asks for goal, mode (do/avoid), and frequency (daily / N-of-7)
- [ ] Settings has a "Schedule" section that lets the user change goal type + weekly target
- [ ] Logging 5 yes-days across a Mon-Sun in weekly_target mode (target=5) results in a 1-week streak
- [ ] Skipping 2 days in the same week (with target=5) still results in a streak hit
- [ ] Missing days on the calendar are gray/dashed, never red
- [ ] The 30-day chart shows missed days in muted gray, never red
- [ ] "Off days" stat card is muted color, not red
- [ ] "Wins this month" card is prominent and green
- [ ] Returning to the app after a 3+ day gap shows the welcome-back banner
- [ ] Notification bodies (both Cloudflare Worker and in-app) never include the goal name
- [ ] Streak freezes work in weekly_target mode and don't exist in daily mode
- [ ] No copy anywhere says "Streak broken" or "X days since last check-in"
- [ ] Dashboard shows the sprout-progression visual (replaces the streak ring) and advances stage as `currentStreak` crosses 1, 7, and 30
- [ ] Crossing a stage threshold triggers a cross-fade between sprout images plus confetti
- [ ] Sprout never visually "regresses" mid-session for daily users (a missed day keeps the sprout at its current stage rather than dropping back to seed — only an actual streak reset to 0 returns it to seed)

### Phase 3
- [ ] Settings has a Privacy section with biometric, hide goal name, and discreet notifications toggles
- [ ] When biometric lock is enabled and the app boots, the lock screen shows first
- [ ] When hide goal name is on and a custom display name is set, the topbar shows the display name
- [ ] When the app loses focus (`visibilitychange`), the content blurs
- [ ] Tapping the Ground wordmark 7 times within 3 seconds toggles `isPro` and shows a toast
- [ ] When `isPro` is false, clicking export shows a Pro prompt
- [ ] When `isPro` is false, scrolling the calendar past 30 days ago shows a Pro prompt
- [ ] When `isPro` is true, both work normally
- [ ] First time hitting a 7-day streak shows the Pro upgrade prompt after the milestone banner closes

### Phase 4
- [ ] README.md no longer mentions `sw.js` as the service worker
- [ ] README accurately describes the current data shape with new fields
- [ ] README documents privacy features
- [ ] README is under 300 lines

---

## Definition of Done

1. All verification items pass.
2. No console errors on a fresh load.
3. No console errors when migrating from an existing v1 dataset.
4. The app still works as a PWA when installed to the iOS home screen.
5. The git diff is clean — no commented-out blocks, no orphaned code.
6. Commit messages are descriptive. **Phase 0 must be its own commit before any Phase 0.5 work, and Phase 0.5 must be its own commit before any Phase 1+ work.** This gives clean rollback points if either the module split or the rebrand has hidden regressions.
7. One commit per phase is the floor; one per fix is fine. Don't combine Phase 0, Phase 0.5, or feature phases with each other.

If you hit an ambiguity not covered here, choose the option that:
1. Preserves the privacy-first positioning
2. Keeps the free tier generous
3. Doesn't break existing user data
4. Doesn't require a backend

In that order of priority.
