// ── PRIVACY: app lock (PIN-based; WebAuthn comes with Capacitor wrap) ──
// PWA biometric via WebAuthn is unreliable across iOS Safari versions; we keep
// this lightweight and ship PIN. The biometricLockEnabled flag stays generic
// so the native wrap can swap implementations without touching callers.
import { state } from './state.js';
import { saveData } from './data.js';
import { showToast } from './toast.js';

const PIN_HASH_KEY = 'streak_pin_hash_v1';

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function setPIN(pin) {
  if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be 4 digits');
  localStorage.setItem(PIN_HASH_KEY, await sha256(pin));
}

export async function verifyPIN(pin) {
  const stored = localStorage.getItem(PIN_HASH_KEY);
  if (!stored) return false;
  return (await sha256(pin)) === stored;
}

export function hasPIN() {
  return !!localStorage.getItem(PIN_HASH_KEY);
}

export function clearPIN() {
  localStorage.removeItem(PIN_HASH_KEY);
}

export function isLockActive() {
  return !!(state.appData && state.appData.biometricLockEnabled && hasPIN());
}

// Wires up the lock-screen overlay. Returns a Promise that resolves once the
// app is unlocked. If the lock isn't active, resolves immediately.
export function gateOnLock() {
  if (!isLockActive()) return Promise.resolve();
  return new Promise(resolve => {
    const overlay = document.getElementById('lock-overlay');
    const input = document.getElementById('lock-pin-input');
    const err = document.getElementById('lock-error');
    overlay.classList.add('show');
    document.getElementById('app').classList.add('app-blurred');
    input.value = '';
    err.textContent = '';
    setTimeout(() => input.focus(), 50);

    async function tryUnlock() {
      const pin = input.value.trim();
      if (!/^\d{4}$/.test(pin)) { err.textContent = 'Enter 4 digits.'; return; }
      const ok = await verifyPIN(pin);
      if (!ok) { err.textContent = 'Wrong PIN.'; input.value = ''; return; }
      overlay.classList.remove('show');
      document.getElementById('app').classList.remove('app-blurred');
      input.removeEventListener('keydown', onKey);
      btn.removeEventListener('click', tryUnlock);
      resolve();
    }
    function onKey(e) { if (e.key === 'Enter') tryUnlock(); }
    const btn = document.getElementById('lock-unlock-btn');
    input.addEventListener('keydown', onKey);
    btn.addEventListener('click', tryUnlock);
  });
}

// Prompts for a fresh PIN via the existing lock overlay reused in "setup" mode.
// Resolves to true on success, false on cancel.
export function promptForNewPIN() {
  return new Promise(resolve => {
    const overlay = document.getElementById('lock-overlay');
    const input = document.getElementById('lock-pin-input');
    const err = document.getElementById('lock-error');
    const title = document.getElementById('lock-title');
    const sub = document.getElementById('lock-sub');
    const cancel = document.getElementById('lock-cancel-btn');
    const btn = document.getElementById('lock-unlock-btn');
    const origTitle = title.textContent;
    const origSub = sub.textContent;
    const origBtn = btn.textContent;
    title.textContent = 'Set a 4-digit PIN';
    sub.textContent = 'You\'ll enter this each time you open the app.';
    btn.textContent = 'Set PIN';
    cancel.style.display = 'inline-block';
    overlay.classList.add('show');
    input.value = '';
    err.textContent = '';
    setTimeout(() => input.focus(), 50);

    function restore() {
      title.textContent = origTitle;
      sub.textContent = origSub;
      btn.textContent = origBtn;
      cancel.style.display = 'none';
      overlay.classList.remove('show');
      input.removeEventListener('keydown', onKey);
      btn.removeEventListener('click', onSet);
      cancel.removeEventListener('click', onCancel);
    }
    async function onSet() {
      const pin = input.value.trim();
      if (!/^\d{4}$/.test(pin)) { err.textContent = 'Enter 4 digits.'; return; }
      await setPIN(pin);
      restore();
      showToast('PIN set');
      resolve(true);
    }
    function onCancel() { restore(); resolve(false); }
    function onKey(e) { if (e.key === 'Enter') onSet(); }
    input.addEventListener('keydown', onKey);
    btn.addEventListener('click', onSet);
    cancel.addEventListener('click', onCancel);
  });
}

export async function toggleBiometricLock(enable) {
  if (enable) {
    if (!hasPIN()) {
      const ok = await promptForNewPIN();
      if (!ok) return false;
    }
    state.appData.biometricLockEnabled = true;
    saveData(state.appData);
    return true;
  }
  state.appData.biometricLockEnabled = false;
  clearPIN();
  saveData(state.appData);
  return true;
}