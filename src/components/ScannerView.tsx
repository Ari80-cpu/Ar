import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Scan, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Volume2, 
  Sparkles, 
  Search,
  User,
  History,
  Send,
  Zap
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { Student } from '../types';
import { formatIndonesianDate, getCurrentTime } from '../utils/date';
import { openWhatsAppChat, generateWAMessage } from '../utils/whatsapp';

export const ScannerView: React.FC = () => {
  const { 
    students, 
    scanNIS, 
    selectedDate, 
    records, 
    schoolProfile,
    waTemplates 
  } = useAttendance();

  const [inputVal, setInputVal] = useState('');
  const [lastScanned, setLastScanned] = useState<{
    student: Student;
    status: 'H' | 'T';
    isLate: boolean;
    time: string;
    message: string;
    alreadyMarked?: boolean;
  } | null>(null);

  const [recentScans, setRecentScans] = useState<Array<{
    student: Student;
    status: 'H' | 'T';
    time: string;
    isLate: boolean;
  }>>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScanSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;

    const res = scanNIS(inputVal.trim(), selectedDate);
    if (res.success && res.student) {
      const scanItem = {
        student: res.student,
        status: (res.status as 'H' | 'T') || 'H',
        isLate: !!res.isLate,
        time: getCurrentTime(),
        message: res.message,
        alreadyMarked: res.alreadyMarked
      };
      setLastScanned(scanItem);
      setRecentScans(prev => [scanItem, ...prev.slice(0, 19)]);
    } else {
      alert(res.message);
    }

    setInputVal('');
  };

  const handleQuickTestScan = (student: Student) => {
    const res = scanNIS(student.nis, selectedDate);
    if (res.success && res.student) {
      const scanItem = {
        student: res.student,
        status: (res.status as 'H' | 'T') || 'H',
        isLate: !!res.isLate,
        time: getCurrentTime(),
        message: res.message,
        alreadyMarked: res.alreadyMarked
      };
      setLastScanned(scanItem);
      setRecentScans(prev => [scanItem, ...prev.slice(0, 19)]);
    }
  };

  const handleSendWA = (student: Student, isLate: boolean) => {
    if (!student.wa) {
      alert(`Siswa ${student.nama} belum memiliki nomor WhatsApp.`);
      return;
    }
    const msg = generateWAMessage(
      student,
      isLate ? 'T' : 'H',
      formatIndonesianDate(selectedDate),
      lastScanned?.time || getCurrentTime(),
      isLate ? 'Tiba terlambat di sekolah' : 'Tiba di sekolah tepat waktu',
      schoolProfile,
      waTemplates
    );
    openWhatsAppChat(student.wa, msg);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide uppercase">
              <span>Gate & Classroom Piket Scanner</span>
              <span aria-hidden="true">·</span>
              <span>Jam Batas: {schoolProfile.jamMasuk} WIB</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-emerald-700" />
              <span>Presensi Barcode / QR Siswa</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Arahkan scanner barcode USB atau ketikkan NIS siswa untuk mencatat kehadiran instan secara otomatis.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <Clock className="w-4 h-4 text-emerald-700 animate-pulse" />
            <div className="text-xs">
              <div className="text-slate-400 text-[10px]">Waktu Sekarang</div>
              <div className="font-mono font-bold text-slate-900 text-sm">
                {getCurrentTime()} WIB
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Scanner Input & Last Scanned Card */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Hardware & Manual Barcode Input Card */}
          <div className="bg-white border-2 border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Scan className="w-4 h-4 text-emerald-600" />
                <span>Input Barcode Scanner / NIS</span>
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Audio Chime Aktif</span>
              </span>
            </div>

            <form onSubmit={handleScanSubmit} className="space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Scan kartu barcode atau ketikkan NIS (contoh: 10940)..."
                  className="w-full px-4 py-3.5 text-base font-mono font-bold bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl focus:outline-hidden transition-all shadow-inner text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Proses</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Dukungan barcode scanner USB gun / keyboard wedge otomatis Enter</span>
                <button
                  type="button"
                  onClick={() => inputRef.current?.focus()}
                  className="text-emerald-700 hover:underline font-semibold"
                >
                  Fokuskan Scanner
                </button>
              </div>
            </form>

            {/* Quick Simulation Samples */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-600 mb-2">
                Simulasi Uji Coba Cepat (Klik salah satu siswa di bawah):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {students.slice(0, 6).map(s => (
                  <button
                    key={s.nis}
                    type="button"
                    onClick={() => handleQuickTestScan(s)}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-lg transition-colors text-slate-700 font-medium"
                  >
                    {s.nama.split(' ')[0]} ({s.kelas} - {s.nis})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Last Scanned Result Display */}
          {lastScanned ? (
            <div className={`p-6 rounded-2xl border-2 transition-all ${
              lastScanned.isLate
                ? 'bg-amber-50/60 border-amber-300'
                : 'bg-emerald-50/60 border-emerald-300'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {lastScanned.isLate ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  )}
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      lastScanned.isLate ? 'text-amber-800' : 'text-emerald-800'
                    }`}>
                      {lastScanned.isLate ? 'Terlambat Masuk' : 'Presensi Hadir Berhasil'}
                    </span>
                    {lastScanned.alreadyMarked && (
                      <span className="ml-2 text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        (Update Waktu Scan)
                      </span>
                    )}
                  </div>
                </div>

                <span className="font-mono text-sm font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                  {lastScanned.time} WIB
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
                  {lastScanned.student.nama.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight truncate">
                    {lastScanned.student.nama}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1 font-mono">
                    <span className="font-semibold px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-900">
                      Kelas {lastScanned.student.kelas}
                    </span>
                    <span>NIS: {lastScanned.student.nis}</span>
                    <span>NISN: {lastScanned.student.nisn || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Action: Send WA Notification */}
              {lastScanned.student.wa && (
                <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs text-slate-600">
                    No. WA Orang Tua: <strong className="font-mono">{lastScanned.student.wa}</strong>
                  </span>

                  <button
                    onClick={() => handleSendWA(lastScanned.student, lastScanned.isLate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Notifikasi WA</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
              <Scan className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
              <div className="text-sm font-semibold text-slate-600">Siap Menerima Scan Kartu</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Scan barcode pada kartu pelajar siswa untuk mencatat kehadiran secara langsung dengan konfirmasi suara.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Live Stream of Recent Scans */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Aktivitas Scan Terkini
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {recentScans.length} Siswa
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[460px] divide-y divide-slate-100 pr-1 mt-2">
            {recentScans.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Belum ada siswa yang melakukan scan presensi hari ini.
              </div>
            ) : (
              recentScans.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[11px] text-slate-400 w-5 text-right tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {item.student.nama}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                        <span>{item.student.kelas}</span>
                        <span aria-hidden="true">·</span>
                        <span>NIS: {item.student.nis}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                      item.isLate 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
