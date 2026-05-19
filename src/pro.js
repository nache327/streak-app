// ── PRO SCAFFOLDING ──
// Real IAP receipt verification ships with the Capacitor wrap. For now, isPro
// is a local flag toggled via the dev gesture (7-tap wordmark). All gated
// features call isPro() to decide between functional path and showProPrompt.
import { state } from './state.js';
import { saveData } from './data.js';
import { showToast } from './toast.js';

export function isPro() {
  return !!(state.appData && state.appData.isPro);
}

const PROMPT_COPY = {
  '7-day-milestone': {
    title: "You've made it a week",
    body: 'Lock in your progress and unlock full history, exports, and custom reminders with Streak Pro.',
  },
  'calendar-history': {
    title: 'Pro unlocks your full history',
    body: 'Free tracks the last 30 days. Pro keeps every day, forever.',
  },
  'export': {
    title: 'Export is a Pro feature',
    body: 'Back up and restore your data anywhere with Streak Pro.',
  },
  'import': {
    title: 'Import is a Pro feature',
    body: 'Restore from a JSON backup with Streak Pro.',
  },
  'custom-reminder': {
    title: 'Custom reminders are Pro',
    body: 'Free includes morning and evening presets. Pro lets you add your own times.',
  },
  'extra-freeze': {
    title: 'More freezes with Pro',
    body: 'Free stores 1 streak freeze. Pro stores 2.',
  },
};

export function showProPrompt(trigger) {
  const copy = PROMPT_COPY[trigger] || PROMPT_COPY['7-day-milestone'];
  document.getElementById('pro-title').textContent = copy.title;
  document.getElementById('pro-body').textContent = copy.body;
  document.getElementById('pro-overlay').classList.add('show');
}

export function closeProPrompt() {
  document.getElementById('pro-overlay').classList.remove('show');
}

export function proCtaClicked() {
  showToast('Pro launching soon');
  closeProPrompt();
}

// Dev-only: tap the wordmark 7x within 3s to flip isPro.
let _tapTimes = [];
export function wordmarkTapped() {
  const now = Date.now();
  _tapTimes = _tapTimes.filter(t => now - t < 3000);
  _tapTimes.push(now);
  if (_tapTimes.length >= 7) {
    _tapTimes = [];
    state.appData.isPro = !state.appData.isPro;
    saveData(state.appData);
    showToast(state.appData.isPro ? 'PRO enabled (dev)' : 'PRO disabled (dev)');
  }
}

// Triggered after the 7-day milestone banner closes — at most once ever.
const PROMPT_SHOWN_KEY = 'pro_prompt_7day_shown';
export function maybeShow7DayPrompt(currentStreak) {
  if (isPro()) return;
  if (currentStreak !== 7) return;
  if (localStorage.getItem(PROMPT_SHOWN_KEY)) return;
  localStorage.setItem(PROMPT_SHOWN_KEY, '1');
  showProPrompt('7-day-milestone');
}