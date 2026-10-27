import { AttendanceRecord, AttendanceStatus, SchoolProfile } from '../types';
import { INITIAL_STUDENTS } from '../data/studentsData';
import { formatDateISO } from './date';

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  namaSekolah: 'SMP NEGERI 1 KUSUMA BANGSA',
  npsn: '20534891',
  alamat: 'Jl. Ki Hajar Dewantara No. 12',
  desaKelurahan: 'Pandanwangi',
  kecamatan: 'Blimbing',
  kabupatenKota: 'Kota Malang',
  provinsi: 'Jawa Timur',
  telepon: '(0341) 489210',
  email: 'smpn1kusumabangsa@sch.id',
  website: 'www.smpn1kusumabangsa.sch.id',
  kepalaSekolah: 'Drs. H. Mulyono Prasetyo, M.Pd.',
  nipKepalaSekolah: '19700415 199503 1 002',
  jamMasuk: '07:00',
  toleransiTerlambatMenit: 15,
  semesterAktif: '1 (Ganjil)',
  tahunAjaran: '2026/2027'
};

/**
 * Deterministic pseudo-random number generator for consistent seed data
 */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates initial realistic attendance records for the past 14 school days + today
 */
export function generateInitialAttendanceRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  // We will generate records for selected weekdays in the current month
  // e.g. last 7 school days including today
  const targetDates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Skip Sundays
    if (d.getDay() !== 0) {
      targetDates.push(formatDateISO(d));
    }
  }

  // Pre-seed attendance for each student across target dates
  // realistic Indonesian school attendance (~95% Hadir, ~2% Sakit, ~1.5% Izin, ~1% Alpa, ~0.5% Terlambat)
  INITIAL_STUDENTS.forEach((student, sIdx) => {
    targetDates.forEach((dateISO, dIdx) => {
      // Deterministic roll
      const seed = sIdx * 37 + dIdx * 97 + parseInt(student.nis || '10000', 10);
      const roll = pseudoRandom(seed);

      let status: AttendanceStatus = 'H';
      let note = '';
      let timeIn = '06:45';

      if (roll < 0.94) {
        status = 'H';
        const minute = Math.floor(pseudoRandom(seed + 1) * 35) + 20; // 06:20 - 06:55
        timeIn = `06:${String(minute).padStart(2, '0')}`;
      } else if (roll < 0.965) {
        status = 'S';
        const notes = ['Demam dan batuk pilek', 'Sakit pusing / flu', 'Istirahat dokter', 'Sakit gigi'];
        note = notes[Math.floor(pseudoRandom(seed + 2) * notes.length)];
        timeIn = '';
      } else if (roll < 0.985) {
        status = 'I';
        const notes = ['Ada acara keluarga di luar kota', 'Keperluan keluarga mendesak', 'Izin menjenguk kerabat'];
        note = notes[Math.floor(pseudoRandom(seed + 3) * notes.length)];
        timeIn = '';
      } else if (roll < 0.995) {
        status = 'A';
        note = 'Tanpa keterangan';
        timeIn = '';
      } else {
        status = 'T';
        const lateMinute = Math.floor(pseudoRandom(seed + 4) * 20) + 5; // 07:05 - 07:25
        timeIn = `07:${String(lateMinute).padStart(2, '0')}`;
        note = `Tiba di sekolah pukul ${timeIn}`;
      }

      records.push({
        id: `${dateISO}_${student.nis}`,
        studentId: student.nis,
        date: dateISO,
        status,
        note,
        timeIn,
        session: 'harian',
        markedAt: `${dateISO}T${timeIn || '07:00'}:00`
      });
    });
  });

  return records;
}
