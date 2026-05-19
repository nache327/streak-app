// ── DATA LAYER ──
import { STORAGE_KEY } from './constants.js';
import { todayStr } from './dates.js';

export const SCHEMA_VERSION = 2;

export function loadData() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!raw) return null;
    const migrated = migrate(raw);
    if (migrated !== raw) saveData(migrated);
    return migrated;
  } catch {
    return null;
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createFreshState(goal, mode, goalType, weeklyTarget) {
  return {
    version: SCHEMA_VERSION,
    goal,
    goalMode: mode || 'do',
    goalType: goalType || 'daily',
    weeklyTarget: weeklyTarget || 5,
    startDate: todayStr(),
    entries: {},
    earnedBadges: {},
    badgeCounts: {},
    badgeCountedRun: {},
    reminders: [
      { id: 'morning', time: '08:00', enabled: false, preset: true },
      { id: 'evening', time: '20:00', enabled: false, preset: true },
    ],
    freezesEarned: 0,
    freezesUsed: 0,
    weeklyFreezesByWeek: {},
    isPro: false,
    biometricLockEnabled: false,
    hideGoalName: false,
    displayGoalName: '',
    discreetNotifications: true,
    createdAt: new Date().toISOString(),
  };
}

// Idempotent: bringing v1 (or undefined) data up to v2.
// Safe to call repeatedly — only fills missing fields.
export function migrate(data) {
  if (!data) return data;
  if (data.version === SCHEMA_VERSION) return data;
  if (data.goalType === undefined) data.goalType = 'daily';
  if (data.weeklyTarget === undefined) data.weeklyTarget = 5;
  if (data.freezesEarned === undefined) data.freezesEarned = 0;
  if (data.freezesUsed === undefined) data.freezesUsed = 0;
  if (data.weeklyFreezesByWeek === undefined) data.weeklyFreezesByWeek = {};
  if (data.isPro === undefined) data.isPro = false;
  if (data.biometricLockEnabled === undefined) data.biometricLockEnabled = false;
  if (data.hideGoalName === undefined) data.hideGoalName = false;
  if (data.displayGoalName === undefined) data.displayGoalName = '';
  if (data.discreetNotifications === undefined) data.discreetNotifications = true;
  data.version = SCHEMA_VERSION;
  return data;
}
