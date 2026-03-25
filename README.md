# Streak — Daily Discipline Tracker

A polished, zero-dependency PWA for tracking one daily discipline goal. Built as a single HTML file with embedded CSS and JavaScript.

---

## Quick Start

```bash
# No installation required. Open the file directly:
open index.html

# OR serve locally for full PWA support:
npx serve .         # Node.js
python3 -m http.server 8080
php -S localhost:8080
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

---

## Features

| Feature | Status |
|---|---|
| Daily yes/no check-in | ✅ |
| Current + personal best streak | ✅ |
| Success rate + win/fail totals | ✅ |
| Last 7 days mini-strip | ✅ |
| Full calendar history view | ✅ |
| Day editor (click any past day) | ✅ |
| Optional reflection notes | ✅ |
| Milestone celebrations (3/7/14/30/50/100) | ✅ |
| Confetti on personal bests | ✅ |
| Export / import JSON backup | ✅ |
| Rename goal | ✅ |
| 30-day trend chart | ✅ |
| Dark mode | ✅ (always) |
| Mobile-first responsive | ✅ |
| Local-first (no account needed) | ✅ |
| Reminder architecture | 🔜 (structure ready) |

---

## Architecture

### Stack Decision

**Single HTML file (Vanilla JS + CSS)**

Why not React/Vue/Svelte?
- Zero build step — open and run immediately
- No `npm install`, no bundler, no Node required
- Perfect for a daily-use personal tool
- Ships as one file you can email, host on Netlify drag-and-drop, or save to your phone
- The complexity doesn't warrant a framework

### Data Layer

All data lives in `localStorage` under the key `streak_app_v1`.

```js
// Data shape
{
  version: 1,
  goal: "No junk food",          // string
  startDate: "2024-01-15",       // YYYY-MM-DD
  entries: {
    "2024-01-15": {
      result: "yes" | "no",
      note: "Hard day but I stayed strong",
      loggedAt: "2024-01-15T21:00:00.000Z"
    }
  },
  reminderTime: null,            // future: "21:00"
  createdAt: "2024-01-15T..."
}
```

Export/import as JSON for backup and portability.

### File Structure

```
streak/
├── index.html     # Everything: markup, styles, logic
└── README.md
```

### Code Organization (inside index.html)

```
CSS
├── Variables & reset
├── Onboarding screen
├── Top bar + navigation
├── Dashboard screen
├── Calendar/History screen
├── Stats screen
├── Settings screen
├── Modal (day editor)
└── Toast + confetti

JavaScript
├── CONSTANTS    — milestones, messages config
├── DATA LAYER   — loadData, saveData, createFreshState
├── DATE UTILS   — todayStr, parseDate, formatters
├── STATS ENGINE — computeStats (streaks, rates)
├── APP STATE    — global state, calendar view date
├── ROUTER       — showScreen
├── RENDERERS    — renderDashboard, renderCalendar, renderStats, renderSettings
├── CHECK-IN     — logDay
├── MODAL        — openModal, closeModal, saveModal
├── CELEBRATIONS — showMilestoneBanner, launchConfetti
├── TOAST        — showToast
├── EXPORT/IMPORT
├── EVENT BINDING — bindEvents
└── BOOT + INIT
```

---

## Extending to SaaS

The data layer is intentionally isolated. To add cloud sync:

1. Replace `loadData()` / `saveData()` with API calls
2. Add auth (the `createFreshState` shape is user-agnostic)
3. The `entries` object maps cleanly to a DB table: `(user_id, date, result, note)`

To add push notifications (PWA):
1. Register a service worker
2. Store `reminderTime` in state (field is already there)
3. Use the Web Push API from the service worker

To support multiple goals:
1. Change storage key to an array of goal objects
2. Add a goal switcher in settings
3. Stats engine works per-goal without changes

---

## Design System

| Token | Value |
|---|---|
| `--bg` | `#0a0a0a` |
| `--accent` | `#e8f55a` (electric lime) |
| `--success` | `#4dff91` |
| `--fail` | `#ff4d4d` |
| Font display | Syne 800 |
| Font body | DM Sans 300/400/500 |
| Font mono | DM Mono |

---

## Psychology Principles Applied

- **Streak salience**: The current streak is the single biggest number on the dashboard
- **Personal best as target**: Always shows "X days to beat your record"
- **Non-catastrophic failure**: Fail messaging is honest but forward-facing, never shaming
- **Milestone system**: 3, 7, 14, 21, 30, 50, 100 — enough to keep motivation across all stages
- **Confetti sparingly**: Only fires on personal bests and milestone hits
- **One-tap interaction**: Yes/No is two large, thumb-friendly buttons
- **Reflection is optional**: Never creates friction for daily check-in

---

## Browser Support

Works in all modern browsers. Requires `localStorage` (available everywhere).
