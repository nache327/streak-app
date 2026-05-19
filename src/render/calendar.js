import { state } from '../state.js';
import { todayStr, weekStart, addDays } from '../dates.js';
import { openModal } from '../modal.js';
import { isPro, showProPrompt } from '../pro.js';

export function renderCalendar() {
  const appData = state.appData;
  const calViewDate = state.calViewDate;
  const year = calViewDate.getFullYear();
  const month = calViewDate.getMonth();
  const isWeekly = (appData.goalType || 'daily') === 'weekly_target';
  const frozenWeeks = appData.weeklyFreezesByWeek || {};
  document.getElementById('cal-title').textContent = calViewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const today = todayStr();
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  // Free tier: lock viewing months whose last day is more than 30 days ago.
  const lastDay = new Date(year, month + 1, 0).getDate();
  const lastOfMonthStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
  const cutoffStr = addDays(today, -30);
  if (!isPro() && lastOfMonthStr < cutoffStr) {
    grid.innerHTML = `
      <div style="grid-column:1 / -1;padding:2rem 1rem;text-align:center;">
        <div style="font-family:'Syne',sans-serif;font-size:1rem;margin-bottom:0.4rem;">Pro unlocks full history</div>
        <div style="font-size:0.85rem;color:var(--sub);line-height:1.5;margin-bottom:1rem;">Free tracks the last 30 days.</div>
        <button class="btn-primary" id="cal-pro-cta" style="max-width:200px;margin:0 auto;">Get Pro</button>
      </div>
    `;
    document.getElementById('cal-pro-cta').addEventListener('click', () => showProPrompt('calendar-history'));
    return;
  }
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-dow';
    el.textContent = d;
    grid.appendChild(el);
  });
  const firstDay = new Date(year, month, 1).getDay();
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'cal-cell empty';
    grid.appendChild(el);
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const str = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const e = appData.entries[str];
    const el = document.createElement('div');
    let cls = 'cal-cell';
    if (str > today) cls += ' future';
    else if (e) cls += ' ' + e.result;
    else cls += ' unlogged';
    if (str === today) cls += ' today';
    el.className = cls;
    // Snowflake indicator on the Monday cell of weeks where a freeze was used.
    if (isWeekly && new Date(year, month, d).getDay() === 1 && frozenWeeks[weekStart(str)]) {
      el.textContent = d + ' ❄';
      el.title = 'Streak freeze used this week';
    } else {
      el.textContent = d;
    }
    if (str <= today) el.onclick = () => openModal(str);
    grid.appendChild(el);
  }
}
