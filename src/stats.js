// ── STATS ENGINE ──
import { todayStr, addDays } from './dates.js';
import { BADGES } from './constants.js';
import { state } from './state.js';

export function computeStats(data) {
  const today = todayStr();
  const entries = data.entries;
  const days = Object.keys(entries).sort();
  let wins = 0, fails = 0, currentStreak = 0, best = 0, run = 0;

  // current streak: walk back from today (or yesterday if today not yet logged)
  let cursor = entries[today] ? today : addDays(today, -1);
  while (entries[cursor]) {
    if (entries[cursor].result === 'yes') { currentStreak++; cursor = addDays(cursor, -1); }
    else break;
  }

  // personal best
  for (const d of days) {
    if (entries[d].result === 'yes') {
      run++;
      best = Math.max(best, run);
    } else { run = 0; }
    if (entries[d].result === 'yes') wins++;
    else fails++;
  }

  const total = wins + fails;
  const rate = total ? Math.round((wins / total) * 100) + '%' : '—';
  return { currentStreak, best, wins, fails, rate };
}

// Derives the start date of the current consecutive 'yes' run from entries.
// Used as the run ID so badge counts work correctly whether entries are added
// via logDay or via the calendar modal (saveModal).
export function getCurrentRunStartDate() {
  const today = todayStr();
  const entries = state.appData.entries;
  let cursor = (entries[today] && entries[today].result === 'yes') ? today : addDays(today, -1);
  if (!entries[cursor] || entries[cursor].result !== 'yes') return null;
  while (true) {
    const prev = addDays(cursor, -1);
    if (entries[prev] && entries[prev].result === 'yes') { cursor = prev; } else { break; }
  }
  return cursor;
}

export function getNextMilestone(s) {
  if (!state.appData.earnedBadges) return null;
  const next = BADGES.find(b => b.streak > s.currentStreak && !state.appData.earnedBadges[b.id]);
  if (!next) return null;
  return { days: next.streak - s.currentStreak, name: next.name, target: next.streak };
}
