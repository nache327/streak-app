// ── MODAL ──
import { state, getModeLabels } from './state.js';
import { saveData } from './data.js';
import { formatDisplayDate } from './dates.js';
import { computeStats } from './stats.js';
import { showToast } from './toast.js';
import { checkBadgesForStreak } from './badges.js';
import { renderDashboard, currentSproutStage } from './render/dashboard.js';
import { renderCalendar } from './render/calendar.js';
import { launchConfetti } from './celebrate.js';
import { getStageForStreak } from './constants.js';

export function openModal(dateStr) {
  state.modalDate = dateStr;
  const e = state.appData.entries[dateStr];
  state.modalResult = e ? e.result : null;
  document.getElementById('modal-date-label').textContent = formatDisplayDate(dateStr);
  document.getElementById('modal-note').value = e ? (e.note || '') : '';
  updateModalResultBtns();
  document.getElementById('modal-overlay').classList.add('open');
}

export function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  state.modalDate = null;
  state.modalResult = null;
}

export function closeModalOnOverlay(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

export function selectModalResult(result) {
  state.modalResult = result;
  updateModalResultBtns();
}

export function updateModalResultBtns() {
  const labels = getModeLabels();
  const yBtn = document.getElementById('modal-btn-yes');
  const nBtn = document.getElementById('modal-btn-no');
  yBtn.className = 'modal-result-btn yes' + (state.modalResult === 'yes' ? ' active' : '');
  nBtn.className = 'modal-result-btn no'  + (state.modalResult === 'no'  ? ' active' : '');
  yBtn.textContent = labels.modalYes;
  nBtn.textContent = labels.modalNo;
}

export function saveModal() {
  const appData = state.appData;
  if (!state.modalResult) { showToast('Pick Yes or No first'); return; }
  const savedResult = state.modalResult;
  const note = document.getElementById('modal-note').value.trim();
  const existing = appData.entries[state.modalDate];
  appData.entries[state.modalDate] = {
    result: savedResult,
    note,
    loggedAt: existing ? existing.loggedAt : new Date().toISOString(),
  };
  saveData(appData);

  // Detect sprout stage upgrade from this edit (e.g. backfilling a yes-day
  // that bridges into a longer current run). Confetti below.
  const sBefore = computeStats(appData);
  const prevStage = currentSproutStage();
  const newStage = getStageForStreak(sBefore);
  const sproutUpgraded = savedResult === 'yes' && newStage > prevStage && prevStage > 0;

  closeModal();
  renderDashboard({ animateSprout: savedResult === 'yes' });
  if (document.getElementById('screen-calendar').classList.contains('active')) renderCalendar();
  showToast('Saved');
  if (savedResult === 'yes') {
    if (sproutUpgraded) launchConfetti();
    const streak = Math.max(sBefore.currentStreak, sBefore.best);
    if (streak > 0) checkBadgesForStreak(streak, true);
  }
}
