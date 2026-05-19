// ── CONSTANTS ──
export const MILESTONES = [3, 7, 14, 21, 30, 50, 100];
export const MILESTONE_MSGS = {
  3:   { emoji: '🌱', title: '3-Day Streak!',   sub: 'The habit is forming.' },
  7:   { emoji: '🔥', title: '1 Week!',          sub: 'One full week — respect.' },
  14:  { emoji: '💪', title: '2 Weeks!',         sub: 'You\'re building something real.' },
  21:  { emoji: '⚡', title: '21 Days!',         sub: 'They say habits form at 21.' },
  30:  { emoji: '🏆', title: '30-Day Streak!',   sub: 'A full month. Incredible.' },
  50:  { emoji: '💎', title: '50 Days!',         sub: 'You\'re in the top 1%.' },
  100: { emoji: '🚀', title: '100 Days!!!',      sub: 'Absolute discipline. Legend.' },
};

export const BADGES = [
  { id: 'first_step',   streak: 1,   emoji: '👟', name: 'First Step',        desc: 'You showed up. That\'s everything.' },
  { id: 'on_a_roll',    streak: 3,   emoji: '🌱', name: 'On A Roll',         desc: 'Three days in. The habit is taking root.' },
  { id: 'one_week',     streak: 7,   emoji: '🔥', name: 'One Week Warrior',  desc: 'Seven days of pure discipline. Respect.' },
  { id: 'two_weeks',    streak: 14,  emoji: '⚡', name: 'Fortnight Fighter', desc: 'Two weeks strong. No excuses, no breaks.' },
  { id: 'habit_forged', streak: 21,  emoji: '🔨', name: 'Habit Forged',      desc: '21 days. Science says the habit is locked in.' },
  { id: 'one_month',    streak: 30,  emoji: '🏆', name: 'Monthly Master',    desc: 'A full month. You\'re in rare company.' },
  { id: 'diamond_mind', streak: 50,  emoji: '💎', name: 'Diamond Mind',      desc: '50 days of showing up. Unbreakable.' },
  { id: 'century',      streak: 100, emoji: '🚀', name: 'Century Legend',    desc: '100 days. You are the 1%. Absolute legend.' },
];

export const STORAGE_KEY = 'streak_app_v1';
