export type AttendanceStatus = 'H' | 'S' | 'I' | 'A' | 'T';

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  nama: string;
  kelas: string;
  wa: string;
  gender?: string;
}

export interface AttendanceRecord {
  id: string; // `${date}_${studentId}`
  studentId: string; // NIS
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
  timeIn?: string; // HH:mm:ss
  session?: string; // 'harian' | 'mapel'
  markedAt?: string;
}

export interface SchoolProfile {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  telepon: string;
  email: string;
  website: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  jamMasuk: string; // e.g. "07:00"
  toleransiTerlambatMenit: number;
  semesterAktif: '1 (Ganjil)' | '2 (Genap)';
  tahunAjaran: string; // "2026/2027"
}

export interface WATemplate {
  sakit: string;
  izin: string;
  alpa: string;
  terlambat: string;
  hadir: string;
}

export interface ClassSummary {
  kelas: string;
  totalStudents: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  terlambat: number;
  persentase: number;
  isCompleted: boolean;
}
