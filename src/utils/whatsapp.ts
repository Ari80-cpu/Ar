import { AttendanceStatus, Student, SchoolProfile, WATemplate } from '../types';

export const DEFAULT_WA_TEMPLATES: WATemplate = {
  sakit: 'Yth. Bapak/Ibu Wali dari *{nama}* (Kelas {kelas}, NIS: {nis}).\n\nKami menginformasikan dari pihak {sekolah} bahwa pada hari {tanggal}, ananda tercatat *SAKIT* (Keterangan: {keterangan}). Semoga ananda lekas sembuh dan dapat beraktivitas kembali.\n\nTerima kasih atas perhatian dan kerjasamanya.\n\nSalam hangat,\n*Wali Kelas & Tim Kesiswaan*',
  izin: 'Yth. Bapak/Ibu Wali dari *{nama}* (Kelas {kelas}, NIS: {nis}).\n\nKami mengonfirmasi bahwa pada hari {tanggal}, ananda tercatat *IZIN* (Alasan: {keterangan}) di {sekolah}.\n\nTerima kasih atas informasinya.\n\nSalam hangat,\n*Wali Kelas & Tim Kesiswaan*',
  alpa: 'Yth. Bapak/Ibu Wali dari *{nama}* (Kelas {kelas}, NIS: {nis}).\n\nKami menginformasikan bahwa pada hari {tanggal}, ananda tercatat *BELUM HADIR / TANPA KETERANGAN (ALPA)* di {sekolah}.\n\nMohon konfirmasi keberadaan ananda kepada pihak sekolah/Wali Kelas demi keselamatan dan kelancaran belajar mengajar.\n\nTerima kasih atas kerjasamanya.\n\nSalam hangat,\n*Wali Kelas & Tim Kesiswaan*',
  terlambat: 'Yth. Bapak/Ibu Wali dari *{nama}* (Kelas {kelas}, NIS: {nis}).\n\nKami menginformasikan bahwa pada hari {tanggal}, ananda tiba di sekolah *TERLAMBAT* (Pukul: {jamMasuk}, Keterangan: {keterangan}).\n\nMohon bimbingan bersama agar ananda dapat hadir tepat waktu esok hari.\n\nTerima kasih.\n\nSalam hangat,\n*Wali Kelas & Tim Kesiswaan*',
  hadir: 'Yth. Bapak/Ibu Wali dari *{nama}* (Kelas {kelas}).\n\nKami menginformasikan bahwa ananda telah *HADIR TEPAT WAKTU* di {sekolah} pada hari {tanggal} pukul {jamMasuk}. Semoga pembelajaran hari ini menyenangkan!\n\nSalam,\n*Tim Kesiswaan*'
};

/**
 * Formats an Indonesian phone number to international 62 format
 * e.g. "085257766182" -> "6285257766182"
 * "+62 812-3301-4478" -> "6281233014478"
 */
export function formatIndonesianPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove non-digit characters
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('62')) {
    // Already 62
  } else if (clean.length >= 8 && clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
}

export function generateWAMessage(
  student: Student,
  status: AttendanceStatus,
  dateFormatted: string,
  timeFormatted: string,
  note: string,
  school: SchoolProfile,
  customTemplates?: WATemplate
): string {
  const templates = customTemplates || DEFAULT_WA_TEMPLATES;
  let template = '';

  switch (status) {
    case 'S':
      template = templates.sakit;
      break;
    case 'I':
      template = templates.izin;
      break;
    case 'A':
      template = templates.alpa;
      break;
    case 'T':
      template = templates.terlambat;
      break;
    case 'H':
    default:
      template = templates.hadir;
      break;
  }

  const ket = note && note.trim() !== '' ? note.trim() : (status === 'S' ? 'Surat Sakit / Keterangan Ortu' : status === 'I' ? 'Izin Keperluan Keluarga' : '-');

  return template
    .replace(/{nama}/g, student.nama)
    .replace(/{kelas}/g, student.kelas)
    .replace(/{nis}/g, student.nis)
    .replace(/{nisn}/g, student.nisn)
    .replace(/{sekolah}/g, school.namaSekolah)
    .replace(/{tanggal}/g, dateFormatted)
    .replace(/{jamMasuk}/g, timeFormatted || school.jamMasuk)
    .replace(/{keterangan}/g, ket);
}

export function openWhatsAppChat(
  phone: string,
  message: string
) {
  const formattedPhone = formatIndonesianPhoneNumber(phone);
  if (!formattedPhone) {
    return false;
  }
  const encodedMsg = encodeURIComponent(message);
  const url = `https://wa.me/${formattedPhone}?text=${encodedMsg}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
