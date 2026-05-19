import { state } from './state.js';
import { saveData } from './data.js';
import { STORAGE_KEY } from './constants.js';
import { showToast } from './toast.js';
import { showConfirm } from './confirm.js';
import { renderDashboard } from './render/dashboard.js';

export function exportData() {
  const blob = new Blob([JSON.stringify(state.appData, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'streak-backup.json';
  a.click();
  showToast('Backup exported');
}

export function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      if (!d.goal || !d.entries) throw new Error('Invalid format');
      saveData(d);
      state.appData = d;
      renderDashboard();
      showToast('Data imported!');
    } catch { showToast('Invalid backup file'); }
  };
  reader.readAsText(file);
}

export function resetApp() {
  showConfirm(
    'Delete everything?',
    'This will permanently erase your streak, history, badges, and all settings. This cannot be undone.',
    () => { localStorage.removeItem(STORAGE_KEY); location.reload(); },
    'Yes, Reset'
  );
}
