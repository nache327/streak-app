// ── CONFIRM MODAL ──
import { state } from './state.js';

export function showConfirm(title, body, onConfirm, okLabel) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-body').textContent = body;
  document.getElementById('confirm-ok-btn').textContent = okLabel || 'Delete';
  state._confirmCallback = onConfirm;
  document.getElementById('confirm-overlay').classList.add('open');
}

export function closeConfirm() {
  document.getElementById('confirm-overlay').classList.remove('open');
  state._confirmCallback = null;
}

export function confirmOk() {
  const fn = state._confirmCallback;
  closeConfirm();
  if (fn) fn();
}

export function closeConfirmOnOverlay(e) {
  if (e.target === document.getElementById('confirm-overlay')) closeConfirm();
}
