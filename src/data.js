// ── DATA LAYER ──
import { STORAGE_KEY } from './constants.js';
import { todayStr } from './dates.js';

export function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createFreshState(goal, mode) {
  return {
    version: 1,
    goal,
    goalMode: mode || 'do',
    startDate: todayStr(),
    entries: {},
    earnedBadges: {},
    badgeCounts: {},
    badgeCountedRun: {},
    reminders: [
      { id: 'morning', time: '08:00', enabled: false, preset: true },
      { id: 'evening', time: '20:00', enabled: false, preset: true },
    ],
    createdAt: new Date().toISOString(),
  };
}
