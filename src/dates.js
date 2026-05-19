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
