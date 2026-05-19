import { state } from './state.js';
import { saveData } from './data.js';
import { showToast } from './toast.js';

export function renameGoal() {
  const v = document.getElementById('rename-input').value.trim();
  if (!v) return;
  state.appData.goal = v;
  saveData(state.appData);
  document.getElementById('topbar-goal').textContent = v;
  showToast('Goal renamed');
}

export function startGoalEdit() {
  const input = document.getElementById('goal-inline-input');
  const btn = document.getElementById('goal-save-btn');
  input.value = state.appData.goal;
  document.getElementById('topbar-goal').style.display = 'none';
  document.querySelector('.goal-edit-btn').style.display = 'none';
  input.style.display = 'inline-block';
  btn.style.display = 'inline-block';
  input.focus();
  input.select();
}

export function saveGoalInline() {
  const input = document.getElementById('goal-inline-input');
  const v = input.value.trim();
  if (v) {
    state.appData.goal = v;
    saveData(state.appData);
    document.getElementById('rename-input').value = v;
    showToast('Goal renamed');
  }
  document.getElementById('topbar-goal').textContent = state.appData.goal;
  document.getElementById('topbar-goal').style.display = '';
  document.querySelector('.goal-edit-btn').style.display = '';
  input.style.display = 'none';
  document.getElementById('goal-save-btn').style.display = 'none';
}

export function handleGoalKey(e) {
  if (e.key === 'Enter') saveGoalInline();
  if (e.key === 'Escape') {
    document.getElementById('goal-inline-input').value = state.appData.goal;
    saveGoalInline();
  }
}
