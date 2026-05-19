// ── SETTINGS SECTIONS ──
import { state } from '../state.js';
import { saveData } from '../data.js';
import { showToast } from '../toast.js';
import { renderDashboard } from './dashboard.js';
import { toggleBiometricLock } from '../privacy.js';

export function renderModeSettings() {
  const container = document.getElementById('settings-mode-toggle');
  if (!container) return;
  const mode = state.appData.goalMode || 'do';
  container.innerHTML = `
    <div style="font-size:0.78rem;color:var(--sub);margin-bottom:0.7rem;line-height:1.5;">Change how check-in buttons are labeled for your goal.</div>
    <div class="mode-toggle">
      <button class="mode-btn ${mode === 'do' ? 'active' : ''}" data-mode="do">✓ DO daily<br><span style="font-size:0.75rem;opacity:0.75;">e.g. Exercise</span></button>
      <button class="mode-btn ${mode === 'avoid' ? 'active' : ''}" data-mode="avoid">✕ AVOID daily<br><span style="font-size:0.75rem;opacity:0.75;">e.g. No junk food</span></button>
    </div>
  `;
  container.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setSettingsMode(btn.dataset.mode));
  });
}

export function setSettingsMode(mode) {
  state.appData.goalMode = mode;
  saveData(state.appData);
  renderModeSettings();
  renderDashboard();
  showToast('Goal mode updated');
}

export function renderScheduleSettings() {
  const container = document.getElementById('settings-schedule');
  if (!container) return;
  const type = state.appData.goalType || 'daily';
  const target = state.appData.weeklyTarget || 5;
  const freezesStored = (state.appData.freezesEarned || 0) - (state.appData.freezesUsed || 0);
  const freezeLine = type === 'weekly_target'
    ? `<div style="font-size:0.78rem;color:var(--sub);margin-top:0.8rem;">Streak freezes: <span style="color:var(--text);font-weight:500;">${freezesStored} stored</span></div>`
    : '';
  container.innerHTML = `
    <div style="font-size:0.78rem;color:var(--sub);margin-bottom:0.7rem;line-height:1.5;">How often do you want to hit this goal?</div>
    <div class="freq-toggle">
      <button class="freq-btn ${type === 'daily' ? 'active' : ''}" data-freq="daily">Every day</button>
      <button class="freq-btn ${type === 'weekly_target' ? 'active' : ''}" data-freq="weekly_target">Some days a week</button>
    </div>
    <div class="target-row" id="settings-target-row" style="display:${type === 'weekly_target' ? 'flex' : 'none'};">
      ${[3,4,5,6].map(n => `<button class="target-btn ${target === n ? 'active' : ''}" data-target="${n}">${n}</button>`).join('')}
    </div>
    ${freezeLine}
  `;
  container.querySelectorAll('.freq-btn').forEach(btn => {
    btn.addEventListener('click', () => setSettingsGoalType(btn.dataset.freq));
  });
  container.querySelectorAll('.target-btn').forEach(btn => {
    btn.addEventListener('click', () => setSettingsWeeklyTarget(Number(btn.dataset.target)));
  });
}

function setSettingsGoalType(t) {
  state.appData.goalType = t;
  saveData(state.appData);
  renderScheduleSettings();
  renderDashboard();
  showToast(t === 'daily' ? 'Switched to daily mode' : 'Switched to weekly mode');
}

function setSettingsWeeklyTarget(n) {
  state.appData.weeklyTarget = n;
  saveData(state.appData);
  renderScheduleSettings();
  renderDashboard();
  showToast(`Target set to ${n} days/week`);
}

export function renderPrivacySettings() {
  const container = document.getElementById('settings-privacy');
  if (!container) return;
  const d = state.appData;
  const bio = !!d.biometricLockEnabled;
  const hide = !!d.hideGoalName;
  const discreet = d.discreetNotifications !== false;
  container.innerHTML = `
    <div class="privacy-row">
      <div class="privacy-row-info">
        <div class="privacy-row-label">Lock app with PIN</div>
        <div class="privacy-row-sub">A 4-digit PIN is required on launch. Native Face ID / fingerprint comes with the app version.</div>
      </div>
      <button class="privacy-toggle ${bio ? 'on' : ''}" data-key="biometric">${bio ? 'ON' : 'OFF'}</button>
    </div>
    <div class="privacy-row">
      <div class="privacy-row-info">
        <div class="privacy-row-label">Hide goal name in app</div>
        <div class="privacy-row-sub">Show a label of your choice anywhere your real goal would appear.</div>
      </div>
      <button class="privacy-toggle ${hide ? 'on' : ''}" data-key="hide-goal">${hide ? 'ON' : 'OFF'}</button>
    </div>
    ${hide ? `
      <div style="margin-top:0.5rem;">
        <input class="settings-input" id="display-goal-input" type="text" maxlength="40" placeholder="My Goal" value="${(d.displayGoalName || '').replace(/"/g, '&quot;')}" />
      </div>
    ` : ''}
    <div class="privacy-row">
      <div class="privacy-row-info">
        <div class="privacy-row-label">Discreet notifications</div>
        <div class="privacy-row-sub">Notification bodies never reveal your goal. (Already enforced.)</div>
      </div>
      <button class="privacy-toggle ${discreet ? 'on' : ''}" data-key="discreet">${discreet ? 'ON' : 'OFF'}</button>
    </div>
  `;
  container.querySelectorAll('.privacy-toggle').forEach(btn => {
    btn.addEventListener('click', () => onPrivacyToggle(btn.dataset.key));
  });
  const dgi = document.getElementById('display-goal-input');
  if (dgi) {
    dgi.addEventListener('input', () => {
      state.appData.displayGoalName = dgi.value;
      saveData(state.appData);
      renderDashboard();
    });
  }
}

async function onPrivacyToggle(key) {
  const d = state.appData;
  if (key === 'biometric') {
    const enable = !d.biometricLockEnabled;
    const ok = await toggleBiometricLock(enable);
    if (ok) {
      renderPrivacySettings();
      showToast(enable ? 'App lock enabled' : 'App lock disabled');
    }
    return;
  }
  if (key === 'hide-goal') {
    d.hideGoalName = !d.hideGoalName;
    saveData(d);
    renderPrivacySettings();
    renderDashboard();
    return;
  }
  if (key === 'discreet') {
    d.discreetNotifications = !d.discreetNotifications;
    saveData(d);
    renderPrivacySettings();
  }
}