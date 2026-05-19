import { state, getModeLabels } from '../state.js';
import { computeStats } from '../stats.js';
import { todayStr, addDays, dayOfWeek } from '../dates.js';
import { getMotivationLine } from '../checkin.js';

function maybeShowWelcomeBack(appData, s) {
  const banner = document.getElementById('welcome-banner');
  if (!banner) return;
  // Suppress if user has already seen it for the current absence.
  if (s.currentStreak > 0) { banner.classList.remove('show'); return; }
  const days = Object.keys(appData.entries).sort();
  if (days.length === 0) { banner.classList.remove('show'); return; }
  const lastEntry = days[days.length - 1];
  // Days between last entry and today.
  const a = new Date(lastEntry), b = new Date(todayStr());
  const gap = Math.floor((b - a) / 86400000);
  if (gap < 3) { banner.classList.remove('show'); return; }
  if (localStorage.getItem('welcome_back_dismissed_for') === lastEntry) return;
  banner.classList.add('show');
  banner.dataset.lastEntry = lastEntry;
}

export function renderDashboard() {
  const appData = state.appData;
  const s = computeStats(appData);
  const today = todayStr();
  const goalLabel = appData.hideGoalName && appData.displayGoalName ? appData.displayGoalName : appData.goal;
  document.getElementById('topbar-goal').textContent = goalLabel;
  document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
  document.getElementById('dash-streak').textContent = s.currentStreak;
  document.getElementById('dash-best').textContent = s.best;
  document.getElementById('dash-wins').textContent = s.wins;
  document.getElementById('dash-rate').textContent = s.rate;

  // Days vs Weeks label depending on goal type.
  const unitEl = document.querySelector('.streak-unit');
  if (unitEl) unitEl.textContent = s.goalType === 'weekly_target' ? 'weeks' : 'days';

  maybeShowWelcomeBack(appData, s);

  const unit = s.goalType === 'weekly_target' ? 'week' : 'day';
  const toGo = s.best > s.currentStreak ? s.best - s.currentStreak : 1;
  if (s.best === 0 || s.currentStreak === 0) {
    document.getElementById('dash-target').innerHTML = 'Start your streak today';
  } else if (s.currentStreak >= s.best) {
    document.getElementById('dash-target').innerHTML = '<span>Personal best!</span> Keep going';
  } else {
    document.getElementById('dash-target').innerHTML = `<span>${toGo}</span> ${unit}${toGo !== 1 ? 's' : ''} to beat your best`;
  }

  // Streak progress ring
  const ringMilestones = [1, 3, 7, 14, 21, 30, 50, 100];
  const nextM = ringMilestones.find(m => m > s.currentStreak) || (s.currentStreak + 1);
  const prevM = [...ringMilestones].reverse().find(m => m < s.currentStreak) || 0;
  const ringPct = s.currentStreak === 0 ? 0 : Math.min(1, (s.currentStreak - prevM) / (nextM - prevM));
  const circumference = 553;
  const ringFill = document.getElementById('streak-ring-fill');
  if (ringFill) ringFill.style.strokeDashoffset = circumference * (1 - ringPct);
  const milestoneLabel = document.getElementById('streak-milestone-label');
  if (milestoneLabel) {
    if (s.goalType === 'weekly_target') {
      // Day-based milestones don't translate cleanly to weekly mode; hide.
      milestoneLabel.textContent = '';
    } else if (s.currentStreak === 0) {
      milestoneLabel.textContent = '';
    } else if (s.currentStreak >= 100) {
      milestoneLabel.textContent = '100+ days — legend 🚀';
    } else {
      milestoneLabel.textContent = `${nextM - s.currentStreak} day${nextM - s.currentStreak !== 1 ? 's' : ''} to ${nextM}-day milestone`;
    }
  }

  // Motivation line
  const motivEl = document.getElementById('streak-motivation');
  if (motivEl) motivEl.textContent = getMotivationLine(s);

  // 7-day strip
  const strip = document.getElementById('week-strip');
  strip.innerHTML = '';
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    const e = appData.entries[d];
    const el = document.createElement('div');
    el.className = 'week-day';
    const dot = document.createElement('div');
    dot.className = 'week-dot' + (e ? ' ' + e.result : '') + (d === today ? ' today' : '');
    const lbl = document.createElement('div');
    lbl.className = 'week-day-label';
    lbl.textContent = dayOfWeek(d);
    el.appendChild(dot);
    el.appendChild(lbl);
    strip.appendChild(el);
  }

  // Check-in state
  const labels = getModeLabels();
  const todayEntry = appData.entries[today];
  const qEl = document.getElementById('checkin-question');
  if (todayEntry) {
    if (qEl) qEl.style.display = 'none';
    document.getElementById('checkin-area').style.display = 'none';
    document.getElementById('checkin-done').style.display = 'block';
    const lbl = document.getElementById('done-result-label');
    lbl.textContent = todayEntry.result === 'yes' ? '✅' : '💪';
    lbl.className = 'done-result';
    document.getElementById('done-confirm-text').textContent = todayEntry.result === 'yes' ? 'Logged! See you tomorrow.' : 'Logged. Tomorrow is a fresh start.';
    document.getElementById('done-note-display').textContent = todayEntry.note || '';
  } else {
    if (qEl) { qEl.style.display = 'block'; qEl.textContent = labels.question; }
    const yesBtn = document.querySelector('#checkin-area .btn-yes');
    const noBtn  = document.querySelector('#checkin-area .btn-no');
    if (yesBtn) yesBtn.textContent = labels.yes;
    if (noBtn)  noBtn.textContent  = labels.no;
    document.getElementById('checkin-area').style.display = 'grid';
    document.getElementById('checkin-done').style.display = 'none';
  }
}
