// ── CHECK-IN ──
import { state } from './state.js';
import { saveData } from './data.js';
import { todayStr } from './dates.js';
import { computeStats } from './stats.js';
import { MILESTONES } from './constants.js';
import { showToast } from './toast.js';
import { checkBadgesForStreak } from './badges.js';
import { showMilestoneBanner, launchConfetti } from './celebrate.js';
import { renderDashboard } from './render/dashboard.js';
import { initNotifBanners } from './notifs.js';

export function logDay(result) {
  const appData = state.appData;
  const today = todayStr();
  if (appData.entries[today]) return;
  const isFirstEver = Object.keys(appData.entries).length === 0;
  appData.entries[today] = {
    result,
    note: '',
    loggedAt: new Date().toISOString(),
  };
  saveData(appData);
  renderDashboard();
  showToast(result === 'yes' ? '✓ Logged — great work!' : 'Logged. Tomorrow is a new day.');

  if (result === 'yes') {
    // Flash celebration
    const screen = document.getElementById('screen-dashboard');
    screen.classList.remove('yes-flash');
    void screen.offsetWidth; // reflow to restart animation
    screen.classList.add('yes-flash');

    const s = computeStats(appData);
    // Mark the start of a new streak run so badge repeat counts increment once per run
    const isNewBest = s.currentStreak > 0 && s.currentStreak === s.best && s.currentStreak > 1;
    if (isNewBest) launchConfetti();
    const newBadge = checkBadgesForStreak(s.currentStreak, true);
    if (!newBadge && MILESTONES.includes(s.currentStreak)) {
      showMilestoneBanner(s.currentStreak);
    }
  }

  // Show reminder banner after the first logged day
  if (isFirstEver) {
    setTimeout(() => initNotifBanners(), 1800);
  }
}

export function editTodayInline() {
  const appData = state.appData;
  const today = todayStr();
  delete appData.entries[today];
  saveData(appData);
  renderDashboard();
}

export function getMotivationLine(s) {
  const hasHistory = s.wins + s.fails > 0;
  if (s.currentStreak === 0 && !hasHistory) return 'Every streak starts with Day 1. Let\'s go.';
  if (s.currentStreak === 0) return 'Streak reset. Today is your comeback.';
  if (s.currentStreak === 1) return 'Day 1 done. Don\'t stop now.';
  if (s.currentStreak === 7) return 'One week! You\'re building something real. 🔥';
  if (s.currentStreak === 14) return 'Two weeks straight. You\'re locked in. 💪';
  if (s.currentStreak === 21) return '21 days. Habit territory. Keep going.';
  if (s.currentStreak >= 30) return `${s.currentStreak} days. This is who you are now.`;
  return `${s.currentStreak} days strong — keep the chain alive!`;
}
