// ── APP STATE ──
// Shared mutable state container. Modules read/write `state.appData` etc.
// Helpers exposed for convenience.
export const state = {
  appData: null,
  calViewDate: new Date(),
  modalDate: null,
  modalResult: null,
  _onboardMode: 'do',
  _onboardGoalType: 'daily',
  _onboardWeeklyTarget: 5,
  _confirmCallback: null,
};

export function setOnboardGoalType(t) {
  state._onboardGoalType = t;
  document.getElementById('freq-btn-daily').classList.toggle('active', t === 'daily');
  document.getElementById('freq-btn-weekly').classList.toggle('active', t === 'weekly_target');
  document.getElementById('weekly-target-row').style.display = t === 'weekly_target' ? 'flex' : 'none';
}

export function setOnboardWeeklyTarget(n) {
  state._onboardWeeklyTarget = n;
  document.querySelectorAll('#weekly-target-row .target-btn').forEach(b => {
    b.classList.toggle('active', Number(b.dataset.target) === n);
  });
}

export function getAppData() { return state.appData; }
export function setAppData(d) { state.appData = d; }

// ── MODE HELPERS ──
export function setOnboardMode(mode) {
  state._onboardMode = mode;
  document.getElementById('mode-btn-do').classList.toggle('active', mode === 'do');
  document.getElementById('mode-btn-avoid').classList.toggle('active', mode === 'avoid');
}

export function getModeLabels() {
  const mode = state.appData ? state.appData.goalMode : state._onboardMode;
  if (mode === 'avoid') {
    return {
      yes: '✓ Avoided',
      no:  '✕ Broke It',
      question: 'Did you avoid it today?',
      doneYes: '✓ AVOIDED — stayed clean',
      doneNo:  '✕ Broke it — missed today',
      modalYes: '✓ Avoided',
      modalNo:  '✕ Broke It',
    };
  }
  return {
    yes: '✓ Yes',
    no:  '✗ No',
    question: 'Did you do it today?',
    doneYes: '✓ YES — kept it',
    doneNo:  '✗ No — missed today',
    modalYes: '✓ Yes',
    modalNo:  '✗ No',
  };
}
