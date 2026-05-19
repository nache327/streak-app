// ── ROUTER ──
import { state } from './state.js';
import { renderCalendar } from './render/calendar.js';
import { renderStats } from './render/stats.js';
import { renderBadges } from './badges.js';
import { renderModeSettings, renderScheduleSettings } from './render/settings.js';
import { initNotifUI } from './notifs.js';

export function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  document.querySelector(`.nav-btn[data-screen="${name}"]`).classList.add('active');

  if (name === 'calendar') renderCalendar();
  if (name === 'stats') renderStats();
  if (name === 'badges') renderBadges();
  if (name === 'settings') {
    document.getElementById('rename-input').value = state.appData.goal;
    renderModeSettings();
    renderScheduleSettings();
    initNotifUI();
  }
}
