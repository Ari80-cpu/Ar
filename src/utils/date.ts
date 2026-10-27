export const HARI_INDONESIA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Returns YYYY-MM-DD for a date object or current time
 */
export function formatDateISO(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats YYYY-MM-DD to Indonesian formal string: "Selasa, 27 Oktober 2026"
 */
export function formatIndonesianDate(isoString: string): string {
  if (!isoString) return '';
  const [y, m, d] = isoString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = HARI_INDONESIA[date.getDay()];
  const monthName = BULAN_INDONESIA[date.getMonth()];
  return `${dayName}, ${d} ${monthName} ${y}`;
}

/**
 * Formats YYYY-MM-DD to short Indonesian: "27 Okt 2026"
 */
export function formatShortIndonesianDate(isoString: string): string {
  if (!isoString) return '';
  const [y, m, d] = isoString.split('-').map(Number);
  const monthShort = BULAN_INDONESIA[m - 1].slice(0, 3);
  return `${d} ${monthShort} ${y}`;
}

/**
 * Gets days count in a given month and year
 */
export function getDaysInMonth(year: number, monthZeroIndexed: number): number {
  return new Date(year, monthZeroIndexed + 1, 0).getDate();
}

/**
 * Returns all dates for a given month as array of { day: number, dateISO: string, isSunday: boolean }
 */
export function getMonthDaysList(year: number, monthZeroIndexed: number) {
  const daysCount = getDaysInMonth(year, monthZeroIndexed);
  const list = [];
  for (let d = 1; d <= daysCount; d++) {
    const dateObj = new Date(year, monthZeroIndexed, d);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday
    const dateISO = `${year}-${String(monthZeroIndexed + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    list.push({
      day: d,
      dateISO,
      dayOfWeek,
      isSunday: dayOfWeek === 0,
      isFriday: dayOfWeek === 5,
      isSaturday: dayOfWeek === 6,
      dayShort: HARI_INDONESIA[dayOfWeek].slice(0, 3)
    });
  }
  return list;
}

/**
 * Returns current local time HH:mm
 */
export function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}
