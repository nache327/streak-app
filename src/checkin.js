// ── CHECK-IN ──
import { state } from './state.js';
import { saveData } from './data.js';
import { todayStr } from './dates.js';
import { computeStats } from './stats.js';
import { MILESTONES, getStageForStreak } from './constants.js';
import { showToast } from './toast.js';
import { checkBadgesForStreak } from './badges.js';
import { showMilestoneBanner, launchConfetti } from './celebrate.js';
import { renderDashboard, currentSproutStage } from './render/dashboard.js';
import { initNotifBanners } from './notifs.js';
import { openModal } from './modal.js';

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

  // Detect sprout stage upgrade BEFORE re-rendering (renderDashboard mutates
  // the img's data-stage). Stage upgrade = ambient reward; confetti below.
  const sBefore = computeStats(appData);
  const prevStage = currentSproutStage();
  const newStage = getStageForStreak(sBefore);
  const sproutUpgraded = result === 'yes' && newStage > prevStage && prevStage > 0;

  renderDashboard({ animateSprout: result === 'yes' });
  showToast(result === 'yes' ? '✓ Logged — great work!' : 'Logged. Tomorrow is a new day.');

  if (result === 'yes') {
    const screen = document.getElementById('screen-dashboard');
    screen.classList.remove('yes-flash');
    void screen.offsetWidth;
    screen.classList.add('yes-flash');

    const isNewBest = sBefore.currentStreak > 0 && sBefore.currentStreak === sBefore.best && sBefore.currentStreak > 1;
    if (isNewBest || sproutUpgraded) launchConfetti();
    const newBadge = checkBadgesForStreak(sBefore.currentStreak, true);
    if (!newBadge && MILESTONES.includes(sBefore.currentStreak)) {
      showMilestoneBanner(sBefore.currentStreak);
    }
  }

  if (isFirstEver) {
    setTimeout(() => initNotifBanners(), 1800);
  }
}

// Opens the day-edit modal pre-filled with today's data so the user can change
// result or note without losing the original loggedAt timestamp.
export function editTodayInline() {
  openModal(todayStr());
}

export function getMotivationLine(s) {
  const hasHistory = s.wins + s.fails > 0;
  if (s.goalType === 'weekly_target') {
    const w = s.currentStreak;
    if (w === 0) return "Let's get this week's target.";
    if (w === 1) return 'One week hit. Keep going.';
    if (w <= 3) return `${w} weeks of hitting your target.`;
    return `${w} weeks straight. You found your rhythm.`;
  }
  const d = s.currentStreak;
  if (d === 0 && !hasHistory) return "Every streak starts with Day 1. Let's go.";
  if (d === 0) return "Welcome back. Today's the day.";
  if (d === 1) return 'Day 1 done. One more tomorrow.';
  if (d < 7) return `${d} days in. Build it up.`;
  if (d < 14) return 'One full week. Real progress.';
  if (d < 21) return "Two weeks. You're locked in.";
  if (d < 30) return '21 days. Habit territory.';
  return `${d} days. This is who you are now.`;
}
