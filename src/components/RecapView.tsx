import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  Calendar, 
  Filter, 
  FileSpreadsheet, 
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { BULAN_INDONESIA, getMonthDaysList, formatShortIndonesianDate } from '../utils/date';

export const RecapView: React.FC = () => {
  const { 
    students, 
    records, 
    classList, 
    selectedClass, 
    setSelectedClass,
    schoolProfile 
  } = useAttendance();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-indexed

  // Students of selected class
  const classStudents = useMemo(() => {
    return students
      .filter(s => s.kelas === selectedClass)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [students, selectedClass]);

  // Days in selected month
  const monthDays = useMemo(() => {
    return getMonthDaysList(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Map of studentId -> (dateISO -> status)
  const studentMonthRecords = useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    
    // Initialize map for class students
    classStudents.forEach(s => {
      map.set(s.nis, new Map<string, string>());
    });

    records.forEach(r => {
      const studentMap = map.get(r.studentId);
      if (studentMap) {
        studentMap.set(r.date, r.status);
      }
    });

    return map;
  }, [classStudents, records]);

  // Calculated totals for each student
  const studentTotals = useMemo(() => {
    const totals = new Map<string, { H: number; S: number; I: number; A: number; T: number; totalDays: number; percent: number }>();

    classStudents.forEach(s => {
      const recMap = studentMonthRecords.get(s.nis);
      let H = 0, S = 0, I = 0, A = 0, T = 0;
      let effectiveSchoolDays = 0;

      monthDays.forEach(day => {
        // Skip Sundays from calculation
        if (!day.isSunday) {
          effectiveSchoolDays++;
          const status = recMap?.get(day.dateISO);
          if (status === 'H') H++;
          else if (status === 'S') S++;
          else if (status === 'I') I++;
          else if (status === 'A') A++;
          else if (status === 'T') T++;
        }
      });

      const attended = H + T;
      const totalRecorded = H + S + I + A + T;
      const percent = totalRecorded > 0 ? Math.round((attended / totalRecorded) * 100) : 100;

      totals.set(s.nis, { H, S, I, A, T, totalDays: effectiveSchoolDays, percent });
    });

    return totals;
  }, [classStudents, studentMonthRecords, monthDays]);

  // Daily attendance total across the class for bottom row
  const dailyClassTotals = useMemo(() => {
    return monthDays.map(day => {
      if (day.isSunday) return { H: 0, S: 0, I: 0, A: 0, T: 0, isSunday: true };
      let H = 0, S = 0, I = 0, A = 0, T = 0;
      classStudents.forEach(s => {
        const status = studentMonthRecords.get(s.nis)?.get(day.dateISO);
        if (status === 'H') H++;
        else if (status === 'S') S++;
        else if (status === 'I') I++;
        else if (status === 'A') A++;
        else if (status === 'T') T++;
      });
      return { H, S, I, A, T, isSunday: false };
    });
  }, [monthDays, classStudents, studentMonthRecords]);

  // Handle Export to CSV
  const handleExportCSV = () => {
    const monthName = BULAN_INDONESIA[selectedMonth];
    let csv = `REKAPITULASI KEHADIRAN SISWA - KELAS ${selectedClass}\n`;
    csv += `SEKOLAH: ${schoolProfile.namaSekolah}\n`;
    csv += `BULAN: ${monthName} ${selectedYear}\n\n`;

    // Header row
    const dayHeaders = monthDays.map(d => d.day).join(';');
    csv += `No;NIS;NISN;Nama Siswa;Kelas;${dayHeaders};H;S;I;A;T;Persentase\n`;

    classStudents.forEach((s, idx) => {
      const recMap = studentMonthRecords.get(s.nis);
      const totals = studentTotals.get(s.nis);
      const daysData = monthDays.map(d => {
        if (d.isSunday) return 'L';
        return recMap?.get(d.dateISO) || '-';
      }).join(';');

      csv += `${idx + 1};${s.nis};${s.nisn || ''};"${s.nama}";${s.kelas};${daysData};${totals?.H || 0};${totals?.S || 0};${totals?.I || 0};${totals?.A || 0};${totals?.T || 0};${totals?.percent || 0}%\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap_Presensi_Kelas_${selectedClass}_${monthName}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Filter Bar (Hidden in Print) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              <span>Rekapitulasi Kehadiran Bulanan (Format Dapodik)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Matriks buku absensi resmi standar Kemdikbudristek per rombel kelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Class Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">
              <span className="text-slate-400 font-normal">Kelas:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
              >
                {classList.map(c => (
                  <option key={c} value={c}>Kelas {c}</option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">
              <span className="text-slate-400 font-normal">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
              >
                {BULAN_INDONESIA.map((name, idx) => (
                  <option key={name} value={idx}>{name}</option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">
              <span className="text-slate-400 font-normal">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer font-mono"
              >
                {[2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Ekspor CSV</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-200" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Indonesian School Document Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0">
        
        {/* Kop Surat Resmi Sekolah */}
        <div className="text-center pb-4 mb-4 border-b-2 border-slate-900">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
            PEMERINTAH DAERAH {schoolProfile.provinsi.toUpperCase()}
          </div>
          <div className="text-xs uppercase tracking-wider text-slate-600 font-bold">
            DINAS PENDIDIKAN DAN KEBUDAYAAN {schoolProfile.kabupatenKota.toUpperCase()}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide uppercase mt-0.5">
            {schoolProfile.namaSekolah}
          </h2>
          <div className="text-[11px] text-slate-600 font-medium mt-1">
            {schoolProfile.alamat}, {schoolProfile.kecamatan}, {schoolProfile.kabupatenKota} · Telp: {schoolProfile.telepon} · NPSN: {schoolProfile.npsn}
          </div>
        </div>

        {/* Title and metadata */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">
              REKAPITULASI PRESENSI KEHADIRAN SISWA
            </h3>
            <div className="text-xs text-slate-600 font-medium">
              Bulan: <strong className="text-slate-900">{BULAN_INDONESIA[selectedMonth]} {selectedYear}</strong> · Kelas: <strong className="text-slate-900">{selectedClass}</strong>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono text-right">
            <span>Semester {schoolProfile.semesterAktif} · T.A {schoolProfile.tahunAjaran}</span>
          </div>
        </div>

        {/* Attendance Matrix Table */}
        <div className="overflow-x-auto border border-slate-300 rounded-lg print:border-slate-800">
          <table className="w-full text-center text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 print:bg-slate-200">
                <th className="py-2 px-1 w-8 border-r border-slate-300" rowSpan={2}>No</th>
                <th className="py-2 px-2 w-20 border-r border-slate-300 text-left font-mono" rowSpan={2}>NIS</th>
                <th className="py-2 px-3 border-r border-slate-300 text-left min-w-[180px]" rowSpan={2}>Nama Lengkap Siswa</th>
                <th className="py-1 border-b border-slate-300" colSpan={monthDays.length}>
                  Tanggal Bulan {BULAN_INDONESIA[selectedMonth]}
                </th>
                <th className="py-1 border-l border-slate-300" colSpan={6}>
                  Rekapitulasi
                </th>
              </tr>
              <tr className="bg-slate-50 text-[10px] font-mono border-b border-slate-300">
                {monthDays.map(day => (
                  <th 
                    key={day.day} 
                    className={`w-6 py-1 border-r border-slate-200 ${day.isSunday ? 'bg-rose-100/70 text-rose-800 font-bold' : ''}`}
                    title={day.dateISO}
                  >
                    {day.day}
                  </th>
                ))}
                <th className="w-7 py-1 border-r border-slate-300 bg-emerald-50 text-emerald-800 font-bold">H</th>
                <th className="w-7 py-1 border-r border-slate-300 bg-blue-50 text-blue-800 font-bold">S</th>
                <th className="w-7 py-1 border-r border-slate-300 bg-amber-50 text-amber-800 font-bold">I</th>
                <th className="w-7 py-1 border-r border-slate-300 bg-rose-50 text-rose-800 font-bold">A</th>
                <th className="w-7 py-1 border-r border-slate-300 bg-purple-50 text-purple-800 font-bold">T</th>
                <th className="w-10 py-1 font-bold text-slate-800">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {classStudents.map((student, idx) => {
                const recMap = studentMonthRecords.get(student.nis);
                const totals = studentTotals.get(student.nis);

                return (
                  <tr key={student.nis} className="hover:bg-slate-50/80 transition-colors">
                    {/* No */}
                    <td className="py-1.5 px-1 border-r border-slate-200 tabular-nums text-slate-500">
                      {idx + 1}
                    </td>

                    {/* NIS */}
                    <td className="py-1.5 px-2 border-r border-slate-200 text-left font-semibold text-slate-800">
                      {student.nis}
                    </td>

                    {/* Nama Lengkap */}
                    <td className="py-1.5 px-3 border-r border-slate-200 text-left font-sans font-bold text-slate-900 text-xs">
                      {student.nama}
                    </td>

                    {/* 1-31 days cells */}
                    {monthDays.map(day => {
                      if (day.isSunday) {
                        return (
                          <td key={day.day} className="py-1 border-r border-slate-200 bg-slate-100 text-slate-400 font-sans text-[9px]">
                            L
                          </td>
                        );
                      }

                      const status = recMap?.get(day.dateISO);
                      let style = 'text-slate-300';
                      let label = '·';

                      if (status === 'H') {
                        style = 'text-emerald-700 font-bold';
                        label = 'H';
                      } else if (status === 'S') {
                        style = 'bg-blue-100 text-blue-800 font-bold';
                        label = 'S';
                      } else if (status === 'I') {
                        style = 'bg-amber-100 text-amber-800 font-bold';
                        label = 'I';
                      } else if (status === 'A') {
                        style = 'bg-rose-100 text-rose-800 font-bold';
                        label = 'A';
                      } else if (status === 'T') {
                        style = 'bg-purple-100 text-purple-800 font-bold';
                        label = 'T';
                      }

                      return (
                        <td key={day.day} className={`py-1 border-r border-slate-200 ${style}`}>
                          {label}
                        </td>
                      );
                    })}

                    {/* Totals */}
                    <td className="py-1.5 border-r border-slate-200 font-bold text-emerald-700 bg-emerald-50/30 tabular-nums">
                      {totals?.H || 0}
                    </td>
                    <td className="py-1.5 border-r border-slate-200 font-bold text-blue-700 bg-blue-50/30 tabular-nums">
                      {totals?.S || 0}
                    </td>
                    <td className="py-1.5 border-r border-slate-200 font-bold text-amber-700 bg-amber-50/30 tabular-nums">
                      {totals?.I || 0}
                    </td>
                    <td className="py-1.5 border-r border-slate-200 font-bold text-rose-700 bg-rose-50/30 tabular-nums">
                      {totals?.A || 0}
                    </td>
                    <td className="py-1.5 border-r border-slate-200 font-bold text-purple-700 bg-purple-50/30 tabular-nums">
                      {totals?.T || 0}
                    </td>
                    <td className="py-1.5 font-bold text-slate-900 tabular-nums">
                      {totals?.percent || 0}%
                    </td>
                  </tr>
                );
              })}

              {/* Bottom Total Row */}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-800">
                <td colSpan={3} className="py-2 px-3 text-right border-r border-slate-300 font-sans">
                  Total Hadir Per Hari:
                </td>
                {dailyClassTotals.map((tot, idx) => (
                  <td key={idx} className={`py-2 border-r border-slate-300 ${tot.isSunday ? 'bg-slate-200' : ''}`}>
                    {tot.isSunday ? '-' : tot.H + tot.T}
                  </td>
                ))}
                <td colSpan={6} className="py-2 text-center text-slate-600 font-sans text-[10px]">
                  Rombel {selectedClass}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-3 text-[11px] text-slate-500 flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-700">Keterangan:</span>
          <span><strong>H</strong>: Hadir</span>
          <span><strong>S</strong>: Sakit</span>
          <span><strong>I</strong>: Izin</span>
          <span><strong>A</strong>: Alpa</span>
          <span><strong>T</strong>: Terlambat</span>
          <span><strong>L</strong>: Hari Libur / Minggu</span>
        </div>

        {/* Signature Blocks (Format Tanda Tangan Resmi) */}
        <div className="mt-12 pt-6 grid grid-cols-2 gap-8 text-xs font-sans">
          <div className="text-center">
            <div>Mengetahui,</div>
            <div className="font-bold text-slate-900">Kepala {schoolProfile.namaSekolah}</div>
            <div className="h-20" /> {/* Space for signature & stamp */}
            <div className="font-bold underline text-slate-900 text-sm">
              {schoolProfile.kepalaSekolah}
            </div>
            <div className="font-mono text-slate-600">
              NIP. {schoolProfile.nipKepalaSekolah}
            </div>
          </div>

          <div className="text-center">
            <div>{schoolProfile.kabupatenKota}, {formatShortIndonesianDate(monthDays[monthDays.length - 1].dateISO)}</div>
            <div className="font-bold text-slate-900">Wali Kelas {selectedClass}</div>
            <div className="h-20" /> {/* Space for signature */}
            <div className="font-bold underline text-slate-900 text-sm">
              Arief Arachman, S.Pd.
            </div>
            <div className="font-mono text-slate-600">
              NIP. 19820715 200801 1 012
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
