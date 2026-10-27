import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  ArrowRight, 
  QrCode, 
  MessageSquare, 
  FileSpreadsheet,
  AlertTriangle,
  Send
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { formatIndonesianDate, formatDateISO } from '../utils/date';
import { openWhatsAppChat, generateWAMessage } from '../utils/whatsapp';
import { ActiveTab } from './Navbar';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const { 
    students, 
    selectedDate, 
    setSelectedDate, 
    classList, 
    setSelectedClass,
    getClassSummary, 
    getDailyOverallStats,
    records,
    schoolProfile,
    waTemplates
  } = useAttendance();

  const stats = getDailyOverallStats(selectedDate);
  const formattedDate = formatIndonesianDate(selectedDate);

  // Group classes by Grade (7, 8, 9)
  const grade7Classes = classList.filter(c => c.startsWith('7'));
  const grade8Classes = classList.filter(c => c.startsWith('8'));
  const grade9Classes = classList.filter(c => c.startsWith('9'));

  const calculateGradeStats = (classes: string[]) => {
    let hadir = 0;
    let total = 0;
    classes.forEach(c => {
      const summary = getClassSummary(c, selectedDate);
      hadir += summary.hadir + summary.terlambat;
      total += summary.totalStudents;
    });
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { hadir, total, percentage };
  };

  const grade7Stats = calculateGradeStats(grade7Classes);
  const grade8Stats = calculateGradeStats(grade8Classes);
  const grade9Stats = calculateGradeStats(grade9Classes);

  // Find students with absence (S, I, A, T) on the selected date for quick follow-up
  const absentStudentsToday = React.useMemo(() => {
    const list: Array<{
      student: (typeof students)[0];
      status: 'S' | 'I' | 'A' | 'T';
      note: string;
      timeIn?: string;
    }> = [];

    records
      .filter(r => r.date === selectedDate && r.status !== 'H')
      .forEach(r => {
        const student = students.find(s => s.nis === r.studentId);
        if (student) {
          list.push({
            student,
            status: r.status as 'S' | 'I' | 'A' | 'T',
            note: r.note || '',
            timeIn: r.timeIn
          });
        }
      });

    return list;
  }, [records, selectedDate, students]);

  const handleClassClick = (kelas: string) => {
    setSelectedClass(kelas);
    setActiveTab('presensi');
  };

  const handleSendWA = (item: (typeof absentStudentsToday)[0]) => {
    const msg = generateWAMessage(
      item.student,
      item.status,
      formattedDate,
      item.timeIn || schoolProfile.jamMasuk,
      item.note,
      schoolProfile,
      waTemplates
    );
    if (!item.student.wa) {
      alert(`Siswa ${item.student.nama} belum memiliki nomor WhatsApp orang tua terdaftar.`);
      return;
    }
    openWhatsAppChat(item.student.wa, msg);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Date Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide uppercase">
              <span>Tahun Ajaran {schoolProfile.tahunAjaran}</span>
              <span aria-hidden="true">·</span>
              <span>Semester {schoolProfile.semesterAktif}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Ringkasan Kehadiran Siswa
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Pantau status presensi harian 806 siswa dari 24 rombel kelas 7, 8, dan 9.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(formatDateISO(d));
              }}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded bg-white hover:bg-slate-100 shadow-xs transition-colors"
            >
              H-1
            </button>
            <button
              onClick={() => setSelectedDate(formatDateISO(new Date()))}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                selectedDate === formatDateISO(new Date())
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 bg-white hover:bg-slate-100 shadow-xs'
              }`}
            >
              Hari Ini
            </button>
            <div className="flex items-center gap-2 px-2 text-xs text-slate-700 font-mono font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Siswa */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Siswa</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.totalStudents}
            </span>
            <span className="text-xs text-slate-500">Siswa</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            24 Rombel (7A - 9H)
          </div>
        </div>

        {/* Persentase Kehadiran */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Kehadiran</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
              {stats.persentase}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {stats.hadir + stats.terlambat} dari {stats.totalStudents} siswa
          </div>
        </div>

        {/* Hadir */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Hadir Tepat</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.hadir}
            </span>
            <span className="text-xs text-emerald-700 font-medium">H</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Tiba sebelum {schoolProfile.jamMasuk}
          </div>
        </div>

        {/* Sakit */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Sakit</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.sakit}
            </span>
            <span className="text-xs text-blue-700 font-medium">S</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Surat dokter / ortu
          </div>
        </div>

        {/* Izin */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Izin</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.izin}
            </span>
            <span className="text-xs text-amber-700 font-medium">I</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Keperluan keluarga
          </div>
        </div>

        {/* Alpa / Tanpa Keterangan */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Alpa (A)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums ${stats.alpa > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {stats.alpa}
            </span>
            <span className="text-xs text-rose-700 font-medium">A</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Perlu konfirmasi wali
          </div>
        </div>
      </div>

      {/* Grade Level Summary Strips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Kelas 7 (Tingkat VII)', stats: grade7Stats, classes: grade7Classes, color: 'text-indigo-700' },
          { label: 'Kelas 8 (Tingkat VIII)', stats: grade8Stats, classes: grade8Classes, color: 'text-teal-700' },
          { label: 'Kelas 9 (Tingkat IX)', stats: grade9Stats, classes: grade9Classes, color: 'text-sky-700' }
        ].map((grade, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                {grade.label}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {grade.classes.length} Rombel
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {grade.stats.percentage}%
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {grade.stats.hadir} / {grade.stats.total} Siswa
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-300" 
                style={{ width: `${grade.stats.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Launchpad & Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('presensi')}
          className="flex items-center justify-between p-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors text-left"
        >
          <div>
            <div className="text-xs text-emerald-100 font-medium">Buka Absensi</div>
            <div className="text-sm font-bold mt-0.5">Input Presensi Harian</div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-200" />
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className="flex items-center justify-between p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors text-left"
        >
          <div>
            <div className="text-xs text-slate-300 font-medium">Piket / Gerbang</div>
            <div className="text-sm font-bold mt-0.5">Scan Barcode Kartu</div>
          </div>
          <QrCode className="w-4 h-4 text-slate-300" />
        </button>

        <button
          onClick={() => setActiveTab('rekap')}
          className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-xl shadow-xs transition-colors text-left"
        >
          <div>
            <div className="text-xs text-slate-500 font-medium">Format Dapodik</div>
            <div className="text-sm font-bold mt-0.5">Rekapitulasi Bulanan</div>
          </div>
          <FileSpreadsheet className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-xl shadow-xs transition-colors text-left"
        >
          <div>
            <div className="text-xs text-slate-500 font-medium">Layanan Orang Tua</div>
            <div className="text-sm font-bold mt-0.5">Kirim Pesan WhatsApp</div>
          </div>
          <MessageSquare className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Main Content Layout: Class Attendance Grid & Student Follow-up */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: 24 Classes Status Grid (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Status Presensi Per Rombel Kelas
              </h2>
              <p className="text-xs text-slate-500">
                Klik pada kartu kelas untuk langsung membuka daftar presensi siswa rombel tersebut.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 font-mono">
              24 Kelas
            </span>
          </div>

          {/* Subdivided by Grade 7, 8, 9 */}
          <div className="space-y-4">
            {[
              { title: 'Kelas VII', classes: grade7Classes },
              { title: 'Kelas VIII', classes: grade8Classes },
              { title: 'Kelas IX', classes: grade9Classes }
            ].map((section) => (
              <div key={section.title} className="space-y-2">
                <span className="text-xs font-bold text-slate-500 tracking-wider">
                  {section.title}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {section.classes.map(kelas => {
                    const summary = getClassSummary(kelas, selectedDate);
                    return (
                      <button
                        key={kelas}
                        onClick={() => handleClassClick(kelas)}
                        className="p-3 text-left border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                            Kelas {kelas}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            summary.persentase >= 95 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : summary.persentase >= 85 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {summary.persentase}%
                          </span>
                        </div>

                        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
                          <span>{summary.hadir + summary.terlambat}/{summary.totalStudents} Hadir</span>
                          <span className="text-slate-400">·</span>
                          {summary.sakit + summary.izin + summary.alpa > 0 ? (
                            <span className="text-rose-600 font-medium">
                              {summary.sakit + summary.izin + summary.alpa} Absen
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium">Nihil</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Students needing attention today (S, I, A, T) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Siswa Tidak Hadir / Catatan</span>
              </h2>
              <p className="text-xs text-slate-500">
                Daftar siswa yang tidak hadir atau terlambat hari ini ({absentStudentsToday.length} siswa).
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[480px] divide-y divide-slate-100 pr-1">
            {absentStudentsToday.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                Semua siswa tercatat hadir pada tanggal ini!
              </div>
            ) : (
              absentStudentsToday.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">
                        {item.student.nama}
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        {item.student.kelas}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className={`font-semibold ${
                        item.status === 'S' ? 'text-blue-600' :
                        item.status === 'I' ? 'text-amber-600' :
                        item.status === 'A' ? 'text-rose-600' : 'text-purple-600'
                      }`}>
                        {item.status === 'S' ? 'Sakit' :
                         item.status === 'I' ? 'Izin' :
                         item.status === 'A' ? 'Alpa' : 'Terlambat'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate italic text-slate-400">
                        {item.note || 'Tidak ada catatan'}
                      </span>
                    </div>
                  </div>

                  {item.student.wa ? (
                    <button
                      onClick={() => handleSendWA(item)}
                      title={`Kirim WA ke orang tua: ${item.student.wa}`}
                      className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic shrink-0">
                      No WA (-)
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-auto">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Buka Pusat Pesan WhatsApp Ortu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
