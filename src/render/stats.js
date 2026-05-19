import { state } from '../state.js';
import { computeStats, getNextMilestone, winsThisMonth } from '../stats.js';
import { todayStr, addDays } from '../dates.js';

export function renderStats() {
  const appData = state.appData;
  const s = computeStats(appData);
  const isEmpty = s.wins === 0 && s.fails === 0;
  document.getElementById('stats-empty-state').style.display = isEmpty ? 'block' : 'none';
  document.getElementById('stats-content').style.display = isEmpty ? 'none' : 'block';
  if (isEmpty) return;
  document.getElementById('stat-streak').textContent = s.currentStreak;
  document.getElementById('stat-best').textContent = s.best;
  document.getElementById('stat-wins').textContent = s.wins;
  document.getElementById('stat-fails').textContent = s.fails;
  document.getElementById('stat-wins-month').textContent = winsThisMonth(appData);
  document.getElementById('stat-rate').textContent = s.rate;
  const nm = getNextMilestone(s);
  document.getElementById('stat-next-val').textContent = nm ? nm.days + ' day' + (nm.days !== 1 ? 's' : '') : '🏆';
  document.getElementById('stat-next-lbl').textContent = nm ? `Until "${nm.name}"` : 'All Milestones Reached';

  // 30-day bar chart
  const bars = document.getElementById('chart-bars');
  bars.innerHTML = '';
  const today = todayStr();
  for (let i = 29; i >= 0; i--) {
    const d = addDays(today, -i);
    const e = appData.entries[d];
    const bar = document.createElement('div');
    bar.className = 'chart-bar ' + (e ? e.result : 'empty');
    bar.style.height = e ? '100%' : '20%';
    bars.appendChild(bar);
  }
}
