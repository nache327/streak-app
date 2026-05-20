// ── BOOT + INIT ──
import { state, setOnboardMode, setOnboardGoalType, setOnboardWeeklyTarget } from './state.js';
import { loadData, saveData, createFreshState } from './data.js';
import { computeStats } from './stats.js';
import { showScreen } from './router.js';
import { renderDashboard } from './render/dashboard.js';
import { renderCalendar } from './render/calendar.js';
import {
  initNotifBanners,
  migrateReminders,
  checkReminder,
  checkMissedReminders,
  bannerEnableNotifs,
  dismissNotifBanner,
  dismissIosBanner,
} from './notifs.js';
import { checkBadgesForStreak, migrateBadgeCounts, closeBadgeCelebration } from './badges.js';
import { closeMilestone } from './celebrate.js';
import { logDay, editTodayInline } from './checkin.js';
import {
  openModal,
  closeModal,
  closeModalOnOverlay,
  selectModalResult,
  saveModal,
} from './modal.js';
import {
  showConfirm,
  closeConfirm,
  confirmOk,
  closeConfirmOnOverlay,
} from './confirm.js';
import { renameGoal, startGoalEdit, saveGoalInline, handleGoalKey } from './goal.js';
import { exportData, importData, resetApp } from './export.js';
import { addCustomReminder } from './notifs.js';
import { gateOnLock } from './privacy.js';
import { closeProPrompt, proCtaClicked, wordmarkTapped } from './pro.js';

function bindStaticEvents() {
  // Onboarding mode buttons
  document.getElementById('mode-btn-do').addEventListener('click', () => setOnboardMode('do'));
  document.getElementById('mode-btn-avoid').addEventListener('click', () => setOnboardMode('avoid'));

  // Onboarding frequency + weekly target
  document.getElementById('freq-btn-daily').addEventListener('click', () => setOnboardGoalType('daily'));
  document.getElementById('freq-btn-weekly').addEventListener('click', () => setOnboardGoalType('weekly_target'));
  document.querySelectorAll('#weekly-target-row .target-btn').forEach(btn => {
    btn.addEventListener('click', () => setOnboardWeeklyTarget(Number(btn.dataset.target)));
  });

  // Welcome-back banner dismiss
  document.getElementById('welcome-dismiss').addEventListener('click', () => {
    const banner = document.getElementById('welcome-banner');
    banner.classList.remove('show');
    if (banner.dataset.lastEntry) {
      localStorage.setItem('welcome_back_dismissed_for', banner.dataset.lastEntry);
    }
  });

  // Start tracking
  document.querySelector('#screen-onboard .btn-primary').addEventListener('click', startApp);

  // Goal row
  document.querySelector('.goal-edit-btn').addEventListener('click', startGoalEdit);
  document.getElementById('goal-inline-input').addEventListener('keydown', handleGoalKey);
  document.getElementById('goal-save-btn').addEventListener('click', saveGoalInline);

  // Notification banners
  document.querySelector('#notif-banner .notif-banner-btn').addEventListener('click', bannerEnableNotifs);
  document.querySelector('#notif-banner .notif-banner-dismiss').addEventListener('click', dismissNotifBanner);
  document.querySelector('#ios-banner .ios-banner-dismiss').addEventListener('click', dismissIosBanner);

  // Dashboard check-in
  document.querySelector('#checkin-area .btn-yes').addEventListener('click', () => logDay('yes'));
  document.querySelector('#checkin-area .btn-no').addEventListener('click', () => logDay('no'));
  document.querySelector('#checkin-done button').addEventListener('click', editTodayInline);

  // Settings — rename / reminders / data / danger zone (selectors keyed by ID
  // so adding/reordering sections doesn't break wiring).
  document.getElementById('btn-rename-goal').addEventListener('click', renameGoal);
  document.getElementById('reminders-list').parentElement
    .querySelector('button.btn-outline').addEventListener('click', addCustomReminder);
  document.getElementById('btn-export-data').addEventListener('click', exportData);
  document.getElementById('btn-import-data').addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', importData);
  document.querySelector('#screen-settings .btn-danger').addEventListener('click', resetApp);

  // Confirm modal
  document.getElementById('confirm-overlay').addEventListener('click', closeConfirmOnOverlay);
  document.querySelector('#confirm-overlay .btn-outline').addEventListener('click', closeConfirm);
  document.getElementById('confirm-ok-btn').addEventListener('click', confirmOk);

  // Edit modal
  document.getElementById('modal-overlay').addEventListener('click', closeModalOnOverlay);
  document.getElementById('modal-btn-yes').addEventListener('click', () => selectModalResult('yes'));
  document.getElementById('modal-btn-no').addEventListener('click', () => selectModalResult('no'));
  document.querySelector('#modal-overlay .btn-outline').addEventListener('click', closeModal);
  document.querySelector('#modal-overlay .btn-primary').addEventListener('click', saveModal);

  // Badge celebration close
  document.querySelector('#badge-celebration .badge-cel-close').addEventListener('click', closeBadgeCelebration);

  // Milestone banner close
  document.querySelector('#milestone-banner .milestone-close').addEventListener('click', closeMilestone);

  // Allow Enter key on goal input
  document.getElementById('goal-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') startApp();
  });

  // Dev gesture: 7 taps on the wordmark within 3s flips isPro.
  document.querySelector('.topbar-wordmark').addEventListener('click', wordmarkTapped);

  // Pro upgrade prompt buttons
  document.getElementById('pro-later-btn').addEventListener('click', closeProPrompt);
  document.getElementById('pro-cta-btn').addEventListener('click', proCtaClicked);

  // Onboarding placeholder rotation (signals goal versatility)
  startPlaceholderRotation();
}

const PLACEHOLDERS = [
  'e.g. No junk food',
  'e.g. Lift 20 min',
  'e.g. Read scripture',
  'e.g. No social media',
  'e.g. Drink water',
];
function startPlaceholderRotation() {
  const input = document.getElementById('goal-input');
  if (!input) return;
  let i = 0;
  setInterval(() => {
    if (input.value || document.activeElement === input) return;
    i = (i + 1) % PLACEHOLDERS.length;
    input.placeholder = PLACEHOLDERS[i];
  }, 3000);
}

// ── EVENT BINDING (per-app boot) ──
function bindEvents() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.screen));
  });
  if (!bindEvents._calNavBound) {
    bindEvents._calNavBound = true;
    document.getElementById('cal-prev').addEventListener('click', () => {
      state.calViewDate.setMonth(state.calViewDate.getMonth() - 1);
      renderCalendar();
    });
    document.getElementById('cal-next').addEventListener('click', () => {
      state.calViewDate.setMonth(state.calViewDate.getMonth() + 1);
      renderCalendar();
    });
  }
  if (!bindEvents._visibilityBound) {
    bindEvents._visibilityBound = true;
    // visibilitychange fires when the tab itself is hidden (other tab, window
    // minimized). pagehide fires when iOS Safari moves the PWA to background
    // — which is when iOS takes the app-switcher snapshot. Both add the blur.
    const setBlur = on => {
      const appEl = document.getElementById('app');
      if (!appEl) return;
      if (on) appEl.classList.add('app-blurred');
      else appEl.classList.remove('app-blurred');
    };
    document.addEventListener('visibilitychange', () => {
      const hidden = document.visibilityState === 'hidden';
      setBlur(hidden);
      if (!hidden) checkMissedReminders();
    });
    window.addEventListener('pagehide', () => setBlur(true));
    window.addEventListener('pageshow', () => setBlur(false));
  }
}

function startApp() {
  const goal = document.getElementById('goal-input').value.trim();
  if (!goal) { document.getElementById('goal-input').focus(); return; }
  state.appData = createFreshState(
    goal,
    state._onboardMode,
    state._onboardGoalType,
    state._onboardWeeklyTarget
  );
  saveData(state.appData);
  playOnboardFlourish().then(bootApp);
}

// 3-second sprout intro shown once after the user clicks Start Tracking.
// Cycles stages 1->2->3->4 then dismisses. Tap anywhere to skip.
function playOnboardFlourish() {
  return new Promise(resolve => {
    const flourish = document.getElementById('onboard-flourish');
    const img = document.getElementById('flourish-img');
    if (!flourish || !img) return resolve();
    document.getElementById('screen-onboard').style.display = 'none';
    flourish.classList.add('show');
    let stage = 1;
    img.src = `ground_stage_${stage}.png`;
    let interval;
    const finish = () => {
      clearInterval(interval);
      flourish.removeEventListener('click', finish);
      flourish.classList.remove('show');
      // Match the 0.4s opacity transition before resolving so the dashboard
      // doesn't pop in over a still-visible flourish.
      setTimeout(resolve, 420);
    };
    interval = setInterval(() => {
      stage++;
      if (stage > 4) { finish(); return; }
      img.src = `ground_stage_${stage}.png`;
    }, 750);
    flourish.addEventListener('click', finish);
  });
}

function bootApp() {
  const appData = state.appData;
  if (!appData.goalMode) appData.goalMode = 'do';
  document.getElementById('screen-onboard').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');
  bindEvents();
  renderDashboard();
  initNotifBanners();
  if (!appData.reminders) migrateReminders();
  migrateBadgeCounts();
  setInterval(checkReminder, 60000);
  setTimeout(checkMissedReminders, 1500);
  // Silently catch up on any badges missed — use best streak so today's "No" doesn't block awards
  const _bootStats = computeStats(appData);
  const _catchUp = Math.max(_bootStats.currentStreak, _bootStats.best);
  if (_catchUp > 0) checkBadgesForStreak(_catchUp, false);
}

// INIT — runs at top level since <script type="module"> is deferred until after DOM parse
bindStaticEvents();

const data = loadData();
if (data) {
  state.appData = data;
  // Gate boot behind the PIN lock screen when enabled; gateOnLock resolves
  // immediately when the lock is off.
  gateOnLock().then(bootApp);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./OneSignalSDKWorker.js').catch(() => {});
}
