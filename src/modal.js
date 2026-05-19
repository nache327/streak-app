// ── MODAL ──
import { state, getModeLabels } from './state.js';
import { saveData } from './data.js';
import { formatDisplayDate } from './dates.js';
import { computeStats } from './stats.js';
import { showToast } from './toast.js';
import { checkBadgesForStreak } from './badges.js';
import { renderDashboard } from './render/dashboard.js';
import { renderCalendar } from './render/calendar.js';

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
  closeModal();
  renderDashboard();
  if (document.getElementById('screen-calendar').classList.contains('active')) renderCalendar();
  showToast('Saved');
  if (savedResult === 'yes') {
    const s = computeStats(appData);
    const streak = Math.max(s.currentStreak, s.best);
    if (streak > 0) checkBadgesForStreak(streak, true);
  }
}
