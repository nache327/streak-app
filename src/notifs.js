// ── NOTIFICATIONS ──
import { state } from './state.js';
import { saveData } from './data.js';
import { todayStr } from './dates.js';
import { showToast } from './toast.js';

// ── NOTIFICATION BANNERS ──
export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function initNotifBanners() {
  if (localStorage.getItem('notif_banner_dismissed')) return;
  const appData = state.appData;
  const remindersAlreadyOn = appData.reminders && appData.reminders.some(r => r.enabled);
  if (remindersAlreadyOn) return;
  // Don't show until user has logged at least one day
  if (Object.keys(appData.entries).length === 0) return;

  if (isIOS() && !isInStandaloneMode()) {
    document.getElementById('ios-banner').classList.add('show');
  } else {
    document.getElementById('notif-banner').classList.add('show');
  }
}

export async function bannerEnableNotifs() {
  document.getElementById('notif-banner').classList.remove('show');
  localStorage.setItem('notif_banner_dismissed', '1');
  // Auto-enable both preset reminders
  await autoEnablePresetReminders();
}

export async function autoEnablePresetReminders() {
  const appData = state.appData;
  if (!appData.reminders) migrateReminders();
  let changed = false;
  for (const r of appData.reminders) {
    if (r.preset && !r.enabled) {
      r.enabled = true;
      changed = true;
    }
  }
  if (changed) {
    saveData(appData);
    renderReminderSettings();
    showToast('Morning & evening reminders enabled! 🔔');
  }
  // Subscribe via OneSignal in background
  _waitForOneSignal().then(async os => {
    if (!os) return;
    try {
      if (!os.User.PushSubscription.optedIn) {
        await os.User.PushSubscription.optIn();
      }
      await os.User.addTags({
        morning_enabled: 'true',
        evening_enabled: 'true',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    } catch(e) {}
  });
}

// Exposed on window because the inline OneSignal SDK init callback in <head>
// runs outside the module graph and needs to call this on push-subscribe.
window.autoEnablePresetReminders = autoEnablePresetReminders;

export function dismissNotifBanner() {
  document.getElementById('notif-banner').classList.remove('show');
  localStorage.setItem('notif_banner_dismissed', '1');
}

export function dismissIosBanner() {
  document.getElementById('ios-banner').classList.remove('show');
  localStorage.setItem('notif_banner_dismissed', '1');
}

export function formatReminderTime(time) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2,'0')} ${ampm}`;
}

export function migrateReminders() {
  const appData = state.appData;
  // Convert old single-reminder format to new reminders array
  const hadOld = appData.reminderEnabled && appData.reminderTime;
  appData.reminders = [
    { id: 'morning', time: '08:00', enabled: false, preset: true },
    { id: 'evening', time: '20:00', enabled: false, preset: true },
  ];
  if (hadOld) {
    appData.reminders.push({ id: 'custom_migrated', time: appData.reminderTime, enabled: true, preset: false });
  }
  saveData(appData);
}

export function renderReminderSettings() {
  const appData = state.appData;
  if (!appData.reminders) migrateReminders();
  const list = document.getElementById('reminders-list');
  if (!list) return;
  list.innerHTML = '';
  const presetLabels = { morning: '🌅 Morning Motivation', evening: '🌙 Evening Check-In' };
  const presetSubs   = {
    morning: 'Stay strong today — keep your streak alive',
    evening: 'Log how your day went before the night is over',
  };
  appData.reminders.forEach(r => {
    const row = document.createElement('div');
    row.className = 'reminder-row';
    if (r.preset) {
      row.innerHTML = `
        <div class="reminder-row-info">
          <div class="reminder-row-label">${presetLabels[r.id]}</div>
          <div class="reminder-row-time">${formatReminderTime(r.time)}</div>
          <div class="reminder-row-sub">${presetSubs[r.id]}</div>
        </div>
        <button class="reminder-toggle-btn ${r.enabled ? 'on' : ''}" data-action="toggle-reminder" data-id="${r.id}">${r.enabled ? 'ON' : 'OFF'}</button>
      `;
    } else {
      row.style.flexWrap = 'wrap';
      row.innerHTML = `
        <div class="reminder-row-info" style="width:100%;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div class="reminder-row-label">⏰ Custom Reminder</div>
            <button class="reminder-delete-btn" data-action="delete-reminder" data-id="${r.id}" title="Remove">✕</button>
          </div>
          <input class="reminder-time-input" type="time" value="${r.time}" data-action="update-reminder-time" data-id="${r.id}" />
        </div>
        <button class="reminder-toggle-btn ${r.enabled ? 'on' : ''}" data-action="toggle-reminder" data-id="${r.id}" style="width:100%;margin-top:0.3rem;padding:0.6rem;">${r.enabled ? 'ON' : 'OFF'}</button>
      `;
    }
    list.appendChild(row);
  });
  // Bind events on dynamically-rendered controls (no inline onclick attributes).
  list.querySelectorAll('[data-action="toggle-reminder"]').forEach(btn => {
    btn.addEventListener('click', () => toggleReminder(btn.dataset.id));
  });
  list.querySelectorAll('[data-action="delete-reminder"]').forEach(btn => {
    btn.addEventListener('click', () => deleteReminder(btn.dataset.id));
  });
  list.querySelectorAll('[data-action="update-reminder-time"]').forEach(inp => {
    inp.addEventListener('change', () => updateReminderTime(inp.dataset.id, inp.value));
  });
}

export function _waitForOneSignal() {
  if (window._os) return Promise.resolve(window._os);
  return new Promise(resolve => {
    const t = setInterval(() => { if (window._os) { clearInterval(t); resolve(window._os); } }, 200);
    setTimeout(() => { clearInterval(t); resolve(null); }, 6000);
  });
}

export async function toggleReminder(id) {
  const appData = state.appData;
  if (!appData.reminders) migrateReminders();
  const r = appData.reminders.find(r => r.id === id);
  if (!r) return;

  if (r.enabled) {
    r.enabled = false;
    saveData(appData);
    renderReminderSettings();
    if (r.preset && window._os) {
      window._os.User.addTag(r.id + '_enabled', 'false').catch(() => {});
    }
    showToast('Reminder turned off');
    return;
  }

  // Toggle on immediately
  r.enabled = true;
  saveData(appData);
  renderReminderSettings();

  if (r.preset) {
    // Try OneSignal push subscription in background (locked-screen notifications)
    _waitForOneSignal().then(async os => {
      if (!os) return;
      try {
        // optIn() is the v16 way — works even if permission was granted outside of OneSignal
        if (!os.User.PushSubscription.optedIn) {
          await os.User.PushSubscription.optIn();
        }
        await os.User.addTags({
          [r.id + '_enabled']: 'true',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      } catch(e) {}
    });
    const label = r.id === 'morning' ? '8 AM' : '8 PM';
    // On iOS, push only works when installed to Home Screen
    const isIOSLocal = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isIOSLocal && !isStandalone) {
      showToast(label + ' reminder on! To get push on locked screen, add to Home Screen 📲');
    } else {
      showToast(label + ' reminder enabled! 🔔');
    }
  } else {
    // Custom reminders: request permission for in-app notifications
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().catch(() => {});
    }
    showToast('Reminder set for ' + formatReminderTime(r.time));
  }
}

export function addCustomReminder() {
  const appData = state.appData;
  if (!appData.reminders) migrateReminders();
  appData.reminders.push({ id: 'custom_' + Date.now(), time: '12:00', enabled: false, preset: false });
  saveData(appData);
  renderReminderSettings();
}

export function updateReminderTime(id, time) {
  const appData = state.appData;
  if (!appData.reminders) return;
  const r = appData.reminders.find(r => r.id === id);
  if (r) { r.time = time; saveData(appData); }
}

export function deleteReminder(id) {
  const appData = state.appData;
  if (!appData.reminders) return;
  appData.reminders = appData.reminders.filter(r => r.id !== id);
  saveData(appData);
  renderReminderSettings();
}

export function initNotifUI() {
  const appData = state.appData;
  if (!appData.reminders) migrateReminders();
  renderReminderSettings();
}

let _reminderFiredDates = {};

export function _fireReminders(timeMatcher) {
  const appData = state.appData;
  if (!appData.reminders) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!appData.reminders.some(r => r.enabled)) return;
  const today = todayStr();
  const checkedInToday = !!appData.entries[today];
  const messages = {
    morning: `Good morning! Stay strong today — keep your ${appData.goal} streak alive. 🔥`,
    evening: `Don't forget to log your day! Did you stick with ${appData.goal}? ✅`,
  };
  appData.reminders.forEach(r => {
    if (!r.enabled) return;
    if (checkedInToday && r.id !== 'morning') return;
    const key = `${r.id}_${today}`;
    if (_reminderFiredDates[key]) return;
    if (!timeMatcher(r)) return;
    _reminderFiredDates[key] = true;
    new Notification('Streak Reminder', { body: messages[r.id] || `Time to check in on your ${appData.goal} streak! ✨` });
  });
}

// Exact-minute check — runs every 60s via setInterval
export function checkReminder() {
  const now = new Date();
  const t = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  _fireReminders(r => r.time === t);
}

// Window check — fires any reminder whose time passed within the last 90 minutes.
// Covers the locked-screen gap: fires when user opens the app or switches back to the tab.
export function checkMissedReminders() {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  _fireReminders(r => {
    const [rh, rm] = r.time.split(':').map(Number);
    const rMins = rh * 60 + rm;
    return nowMins >= rMins && nowMins <= rMins + 90;
  });
}
