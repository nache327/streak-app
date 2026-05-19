// ── BADGES ──
import { BADGES } from './constants.js';
import { state } from './state.js';
import { saveData } from './data.js';
import { todayStr, formatDisplayDate } from './dates.js';
import { computeStats, getCurrentRunStartDate } from './stats.js';
import { launchConfetti } from './celebrate.js';

// Awards every badge whose threshold is <= streak (catches skipped milestones too).
// Tracks earn counts per badge across separate streak runs (badgeCounts).
// Once a badge is earned 2+ times, renderBadges shows a "2x" / "3x" pill.
// Pass showCelebration=false to silently catch up on missed badges (e.g. on boot).
export function checkBadgesForStreak(streak, showCelebration) {
  const appData = state.appData;
  if (!appData.earnedBadges) appData.earnedBadges = {};
  if (!appData.badgeCounts) appData.badgeCounts = {};
  if (!appData.badgeCountedRun) appData.badgeCountedRun = {};
  // Derive run ID fresh from entries so modal edits are handled correctly
  const derivedRunId = getCurrentRunStartDate() || '__no_run__';
  if (derivedRunId !== '__no_run__') appData.currentRunStartDate = derivedRunId;
  const runId = derivedRunId;
  let changed = false;
  const newlyAwarded = [];

  for (const badge of BADGES) {
    if (badge.streak > streak) continue;
    const alreadyEarned = !!appData.earnedBadges[badge.id];
    const countedThisRun = appData.badgeCountedRun[badge.id] === runId;

    if (!alreadyEarned) {
      // First-ever earn
      appData.earnedBadges[badge.id] = todayStr();
      appData.badgeCounts[badge.id] = 1;
      appData.badgeCountedRun[badge.id] = runId;
      changed = true;
      newlyAwarded.push(badge);
    } else if (!countedThisRun && runId !== '__no_run__') {
      // Re-earned in a new streak run — increment lifetime count
      appData.badgeCounts[badge.id] = (appData.badgeCounts[badge.id] || 1) + 1;
      appData.badgeCountedRun[badge.id] = runId;
      changed = true;
      newlyAwarded.push(badge);
    }
  }

  if (changed) saveData(appData);

  if (showCelebration && newlyAwarded.length) {
    // Prefer the badge whose threshold exactly matches the streak; otherwise show highest
    const exact = newlyAwarded.find(b => b.streak === streak);
    const toShow = exact || newlyAwarded[newlyAwarded.length - 1];
    showBadgeCelebration(toShow);
    return toShow;
  }
  return null;
}

export function renderBadges() {
  const appData = state.appData;
  if (!appData.earnedBadges) appData.earnedBadges = {};
  if (!appData.badgeCounts) appData.badgeCounts = {};
  const grid = document.getElementById('badges-grid');
  grid.innerHTML = '';
  const s = computeStats(appData);
  BADGES.forEach(badge => {
    const earned = appData.earnedBadges[badge.id];
    const count = appData.badgeCounts[badge.id] || 0;
    const card = document.createElement('div');
    card.className = 'badge-card ' + (earned ? 'earned' : 'locked');
    card.innerHTML = `
      ${!earned ? '<span class="badge-lock-icon">🔒</span>' : ''}
      ${earned && count >= 2 ? `<span class="badge-multiplier">${count}x</span>` : ''}
      <span class="badge-icon">${badge.emoji}</span>
      <div class="badge-name">${badge.name}</div>
      <div class="badge-desc">${earned ? badge.desc : 'Reach a ' + badge.streak + '-day streak'}</div>
      ${earned ? `<div class="badge-earned-date">Earned ${formatDisplayDate(earned)}</div>` : ''}
    `;
    grid.appendChild(card);
  });
}

export function playBadgeSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[523,0],[659,0.18],[784,0.36],[1047,0.54],[1319,0.72]].forEach(([freq, t]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.5);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.55);
    });
  } catch(e) {}
}

export function showBadgeCelebration(badge) {
  document.getElementById('badge-cel-icon').textContent   = badge.emoji;
  document.getElementById('badge-cel-streak').textContent = `${badge.streak}-day streak`;
  document.getElementById('badge-cel-name').textContent   = badge.name;
  document.getElementById('badge-cel-desc').textContent   = badge.desc;
  document.getElementById('badge-celebration').classList.add('open');
  launchConfetti();
  playBadgeSound();
}

export function closeBadgeCelebration() {
  document.getElementById('badge-celebration').classList.remove('open');
}

// Migrate existing users who earned badges before badgeCounts was introduced.
// Sets count=1 for each already-earned badge and marks them as counted in the
// actual current run so the boot catch-up call never double-increments them.
// v2 fixes a prior migration that used a synthetic run ID ('__initial_migration__')
// which caused spurious 2x counts on the very first checkBadgesForStreak call.
export function migrateBadgeCounts() {
  const appData = state.appData;
  if (appData.badgeCountsVersion === 3) return; // already on current version
  const currentRunId = getCurrentRunStartDate() || '__no_run__';
  appData.badgeCounts = {};
  appData.badgeCountedRun = {};
  appData.currentRunStartDate = currentRunId;
  appData.badgeCountsVersion = 3;
  for (const id of Object.keys(appData.earnedBadges || {})) {
    appData.badgeCounts[id] = 1;
    appData.badgeCountedRun[id] = currentRunId;
  }
  saveData(appData);
}
