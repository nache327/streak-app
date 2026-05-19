import { state } from '../state.js';
import { todayStr } from '../dates.js';
import { openModal } from '../modal.js';

export function renderCalendar() {
  const appData = state.appData;
  const calViewDate = state.calViewDate;
  const year = calViewDate.getFullYear();
  const month = calViewDate.getMonth();
  document.getElementById('cal-title').textContent = calViewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const today = todayStr();
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';
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
    el.textContent = d;
    if (str <= today) el.onclick = () => openModal(str);
    grid.appendChild(el);
  }
}
