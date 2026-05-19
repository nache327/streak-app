// ── STATS ENGINE ──
import { todayStr, addDays, weekStart, listWeeksCovering } from './dates.js';
import { BADGES } from './constants.js';
import { state } from './state.js';
import { saveData } from './data.js';

// Returns an object identical in shape across goal types so renderers
// can stay simple. Extra fields populated only when goalType === 'weekly_target':
//   weeksHit, weeklyFreezesByWeek (Set of week-start strings)
export function computeStats(data) {
  const goalType = data.goalType || 'daily';
  if (goalType === 'weekly_target') return computeWeeklyStats(data);
  return computeDailyStats(data);
}

function computeDailyStats(data) {
  const today = todayStr();
  const entries = data.entries;
  const days = Object.keys(entries).sort();
  let wins = 0, fails = 0, currentStreak = 0, best = 0, run = 0;

  let cursor = entries[today] ? today : addDays(today, -1);
  while (entries[cursor]) {
    if (entries[cursor].result === 'yes') { currentStreak++; cursor = addDays(cursor, -1); }
    else break;
  }

  for (const d of days) {
    if (entries[d].result === 'yes') {
      run++;
      best = Math.max(best, run);
      wins++;
    } else {
      run = 0;
      fails++;
    }
  }

  const total = wins + fails;
  const rate = total ? Math.round((wins / total) * 100) + '%' : '—';
  return { currentStreak, best, wins, fails, rate, goalType: 'daily' };
}

// Weekly target mode: streak = consecutive Mon-Sun weeks that hit the target.
// `wins` and `fails` still count individual yes/no days so the existing daily
// check-in mechanics feel rewarding. Freezes only apply here (capped per spec).
function computeWeeklyStats(data) {
  const today = todayStr();
  const entries = data.entries;
  const target = data.weeklyTarget || 5;
  const days = Object.keys(entries).sort();
  let wins = 0, fails = 0;
  for (const d of days) {
    if (entries[d].result === 'yes') wins++;
    else fails++;
  }

  // Award freezes lazily — Math.floor(wins / 7) earned total, cap stored at 2.
  const proCap = data.isPro ? 2 : 1;
  const earnedTotal = Math.floor(wins / 7);
  if (earnedTotal > data.freezesEarned) {
    const available = Math.max(0, (data.freezesEarned - data.freezesUsed));
    const room = Math.max(0, proCap - available);
    const grant = Math.min(earnedTotal - data.freezesEarned, room);
    if (grant > 0) {
      data.freezesEarned += grant;
      saveData(data);
    } else if (earnedTotal !== data.freezesEarned) {
      // Bring the counter to a steady value when no room remains, so we don't
      // re-attempt grants every render.
      data.freezesEarned = Math.max(data.freezesEarned, data.freezesUsed + proCap);
      saveData(data);
    }
  }

  // Compute per-week yes counts.
  const weekKeys = days.length ? listWeeksCovering(days) : [];
  const weekYesCount = Object.create(null);
  for (const w of weekKeys) weekYesCount[w] = 0;
  for (const d of days) {
    if (entries[d].result === 'yes') weekYesCount[weekStart(d)]++;
  }

  // Evaluate hits, applying freezes if user fell 1 short.
  // We mutate `data` for freezesUsed because applying a freeze is a real
  // consumption — record which weeks consumed one (persisted so it's stable).
  // Iterate newest-first so freezes preferentially protect the most recent
  // weeks (which matter most for the current streak).
  if (!data.weeklyFreezesByWeek) data.weeklyFreezesByWeek = {};
  let freezesAvailable = data.freezesEarned - data.freezesUsed;
  const weekHit = Object.create(null);
  const thisWeek = weekStart(today);
  let dataChanged = false;
  for (let i = weekKeys.length - 1; i >= 0; i--) {
    const w = weekKeys[i];
    const yc = weekYesCount[w];
    const naturallyHit = yc >= target;
    const wasFrozen = !!data.weeklyFreezesByWeek[w];
    let hit = naturallyHit || wasFrozen;

    if (!hit && yc === target - 1 && freezesAvailable > 0 && w !== thisWeek) {
      // Auto-apply for past weeks only. Current week stays "in progress."
      data.freezesUsed += 1;
      data.weeklyFreezesByWeek[w] = true;
      freezesAvailable -= 1;
      hit = true;
      dataChanged = true;
    }
    weekHit[w] = hit;
  }
  if (dataChanged) saveData(data);

  // Current streak = consecutive hit weeks ending at this week or last.
  let currentStreak = 0;
  let cursor = weekHit[thisWeek] ? thisWeek : addDays(thisWeek, -7);
  while (weekHit[cursor]) {
    currentStreak++;
    cursor = addDays(cursor, -7);
  }

  // Best = longest consecutive hit run.
  let best = 0, run = 0;
  for (const w of weekKeys) {
    if (weekHit[w]) { run++; best = Math.max(best, run); }
    else run = 0;
  }

  const total = wins + fails;
  const rate = total ? Math.round((wins / total) * 100) + '%' : '—';
  const weeksHit = weekKeys.reduce((acc, w) => acc + (weekHit[w] ? 1 : 0), 0);

  return {
    currentStreak, best, wins, fails, rate,
    goalType: 'weekly_target',
    weeksHit,
    weeklyTarget: target,
    weekHit,
    weeklyFreezesByWeek: data.weeklyFreezesByWeek,
  };
}

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

// Wins for the current calendar month — used by the "Wins this month" card.
export function winsThisMonth(data) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  let count = 0;
  for (const d of Object.keys(data.entries)) {
    if (data.entries[d].result !== 'yes') continue;
    const [yy, mm] = d.split('-').map(Number);
    if (yy === y && mm - 1 === m) count++;
  }
  return count;
}