// ── DATE UTILS ──
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatMonthYear(date) {
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export function formatDisplayDate(str) {
  return parseDate(str).toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function dayOfWeek(str) {
  return parseDate(str).toLocaleDateString('default', { weekday: 'short' }).slice(0, 2);
}

export function addDays(str, n) {
  const d = parseDate(str);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Mon-Sun weeks. Returns the Monday-date string for the week containing `str`.
export function weekStart(str) {
  const d = parseDate(str);
  const dow = d.getDay(); // 0=Sun..6=Sat
  const shift = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + shift);
  return fmt(d);
}

export function weekEnd(str) {
  return addDays(weekStart(str), 6);
}

// All Monday-start week keys covered by the entry date range, oldest first.
export function listWeeksCovering(dateStrs) {
  if (!dateStrs.length) return [];
  const first = weekStart(dateStrs[0]);
  const last = weekStart(dateStrs[dateStrs.length - 1]);
  const weeks = [];
  let cur = first;
  while (cur <= last) {
    weeks.push(cur);
    cur = addDays(cur, 7);
  }
  return weeks;
}
