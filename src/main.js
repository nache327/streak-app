// ── BOOT + INIT ──
import { state, setOnboardMode } from './state.js';
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

function bindStaticEvents() {
  // Onboarding mode buttons
  document.getElementById('mode-btn-do').addEventListener('click', () => setOnboardMode('do'));
  document.getElementById('mode-btn-avoid').addEventListener('click', () => setOnboardMode('avoid'));

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

  // Settings — rename / reminders / data / danger zone
  document.querySelector('#screen-settings .settings-section:nth-of-type(2) .btn-outline').addEventListener('click', renameGoal);
  // Add Reminder button (inside the reminders section)
  const remindersSection = document.getElementById('reminders-list').parentElement;
  remindersSection.querySelector('button.btn-outline').addEventListener('click', addCustomReminder);
  // Data section buttons
  const dataButtons = document.querySelectorAll('#screen-settings .settings-section')[3].querySelectorAll('button.btn-outline');
  dataButtons[0].addEventListener('click', exportData);
  dataButtons[1].addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', importData);
  // Danger zone
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
}

// ── EVENT BINDING (per-app boot) ──
function bindEvents() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.screen));
  });
  document.getElementById('cal-prev').addEventListener('click', () => {
    state.calViewDate.setMonth(state.calViewDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    state.calViewDate.setMonth(state.calViewDate.getMonth() + 1);
    renderCalendar();
  });
  if (!bindEvents._visibilityBound) {
    bindEvents._visibilityBound = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkMissedReminders();
    });
  }
}

function startApp() {
  const goal = document.getElementById('goal-input').value.trim();
  if (!goal) { document.getElementById('goal-input').focus(); return; }
  state.appData = createFreshState(goal, state._onboardMode);
  saveData(state.appData);
  bootApp();
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
  bootApp();
}

if ('serviceWorker' in navigator) {
  // Unregister stale sw.js — OneSignalSDKWorker.js is now the single service worker
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => {
      if (r.active && !r.active.scriptURL.includes('OneSignalSDKWorker.js')) r.unregister();
    });
  });
  navigator.serviceWorker.register('./OneSignalSDKWorker.js').catch(() => {});
}
