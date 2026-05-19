// ── SETTINGS MODE TOGGLE ──
import { state } from '../state.js';
import { saveData } from '../data.js';
import { showToast } from '../toast.js';
import { renderDashboard } from './dashboard.js';

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
