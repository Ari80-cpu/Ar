import React, { useState, useMemo } from 'react';
import { 
  Check, 
  Search, 
  CheckCheck, 
  RotateCcw, 
  MessageSquare, 
  FileText, 
  Clock, 
  Phone, 
  AlertCircle,
  X,
  Send,
  Calendar
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { AttendanceStatus, Student } from '../types';
import { formatIndonesianDate } from '../utils/date';
import { openWhatsAppChat, generateWAMessage } from '../utils/whatsapp';

export const AttendanceTakerView: React.FC = () => {
  const { 
    students, 
    classList, 
    selectedClass, 
    setSelectedClass, 
    selectedDate, 
    setSelectedDate,
    markAttendance, 
    markBatchAttendance, 
    resetClassAttendance,
    getAttendance,
    getClassSummary,
    schoolProfile,
    waTemplates
  } = useAttendance();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeGrade, setActiveGrade] = useState<'7' | '8' | '9'>(() => {
    return (selectedClass.charAt(0) as '7' | '8' | '9') || '7';
  });

  // Modal for note editing & WhatsApp confirmation
  const [editingStudent, setEditingStudent] = useState<{
    student: Student;
    status: AttendanceStatus;
    note: string;
  } | null>(null);

  const formattedDate = formatIndonesianDate(selectedDate);

  // Filter students for the active class
  const classStudents = useMemo(() => {
    return students
      .filter(s => s.kelas === selectedClass)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [students, selectedClass]);

  // Filtered by search & status
  const displayedStudents = useMemo(() => {
    return classStudents.filter(s => {
      const matchSearch = 
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery) ||
        s.nisn.includes(searchQuery);

      if (!matchSearch) return false;

      if (filterStatus !== 'all') {
        const record = getAttendance(s.nis, selectedDate);
        if (filterStatus === 'unmarked') {
          return !record;
        }
        return record?.status === filterStatus;
      }

      return true;
    });
  }, [classStudents, searchQuery, filterStatus, getAttendance, selectedDate]);

  const summary = getClassSummary(selectedClass, selectedDate);

  // Grade class buttons: e.g. 7A, 7B, 7C, 7D, 7E, 7F, 7G, 7H
  const currentGradeClasses = useMemo(() => {
    return classList.filter(c => c.startsWith(activeGrade));
  }, [classList, activeGrade]);

  const handleMarkAllHadir = () => {
    const studentIds = classStudents.map(s => s.nis);
    markBatchAttendance(studentIds, 'H', selectedDate);
  };

  const handleResetClass = () => {
    if (window.confirm(`Yakin ingin mengosongkan data presensi Kelas ${selectedClass} pada tanggal ${formattedDate}?`)) {
      resetClassAttendance(selectedClass, selectedDate);
    }
  };

  const handleOpenNoteModal = (student: Student, status: AttendanceStatus) => {
    const existing = getAttendance(student.nis, selectedDate);
    setEditingStudent({
      student,
      status,
      note: existing?.note || ''
    });
  };

  const handleSaveNoteModal = (sendWhatsApp: boolean = false) => {
    if (!editingStudent) return;
    markAttendance(
      editingStudent.student.nis,
      editingStudent.status,
      editingStudent.note,
      selectedDate
    );

    if (sendWhatsApp && editingStudent.student.wa) {
      const msg = generateWAMessage(
        editingStudent.student,
        editingStudent.status,
        formattedDate,
        schoolProfile.jamMasuk,
        editingStudent.note,
        schoolProfile,
        waTemplates
      );
      openWhatsAppChat(editingStudent.student.wa, msg);
    }

    setEditingStudent(null);
  };

  const handleDirectWA = (student: Student, status: AttendanceStatus, note?: string) => {
    if (!student.wa) {
      alert(`Siswa ${student.nama} belum memiliki nomor WhatsApp terdaftar.`);
      return;
    }
    const msg = generateWAMessage(
      student,
      status,
      formattedDate,
      schoolProfile.jamMasuk,
      note || '',
      schoolProfile,
      waTemplates
    );
    openWhatsAppChat(student.wa, msg);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Selector & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Class selection controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Pilih Jenjang:
              </span>
              <div className="inline-flex p-1 bg-slate-100 rounded-lg">
                {(['7', '8', '9'] as const).map(grade => (
                  <button
                    key={grade}
                    onClick={() => {
                      setActiveGrade(grade);
                      setSelectedClass(`${grade}A`);
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      activeGrade === grade
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Kelas {grade}
                  </button>
                ))}
              </div>
            </div>

            {/* Section tabs: 7A, 7B... */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {currentGradeClasses.map(kelas => {
                const isSelected = selectedClass === kelas;
                const clsSum = getClassSummary(kelas, selectedDate);
                return (
                  <button
                    key={kelas}
                    onClick={() => setSelectedClass(kelas)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span>{kelas}</span>
                    <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                      isSelected ? 'bg-emerald-700/60 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {clsSum.hadir + clsSum.terlambat}/{clsSum.totalStudents}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker & Classroom Fast Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-medium font-mono text-xs text-slate-900 focus:outline-hidden cursor-pointer"
              />
            </div>

            <button
              onClick={handleMarkAllHadir}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Semua Hadir (1-Klik)</span>
            </button>

            <button
              onClick={handleResetClass}
              title="Kosongkan presensi kelas ini"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Attendance Ribbon for active class */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs font-mono">
          <div className="bg-slate-50 p-2 rounded border border-slate-200 flex justify-between items-center">
            <span className="text-slate-500 font-sans text-[11px]">Total Siswa</span>
            <span className="font-bold text-slate-900 tabular-nums">{summary.totalStudents}</span>
          </div>
          <div className="bg-emerald-50 p-2 rounded border border-emerald-200 flex justify-between items-center text-emerald-800">
            <span className="font-sans text-[11px]">Hadir (H)</span>
            <span className="font-bold tabular-nums">{summary.hadir}</span>
          </div>
          <div className="bg-blue-50 p-2 rounded border border-blue-200 flex justify-between items-center text-blue-800">
            <span className="font-sans text-[11px]">Sakit (S)</span>
            <span className="font-bold tabular-nums">{summary.sakit}</span>
          </div>
          <div className="bg-amber-50 p-2 rounded border border-amber-200 flex justify-between items-center text-amber-800">
            <span className="font-sans text-[11px]">Izin (I)</span>
            <span className="font-bold tabular-nums">{summary.izin}</span>
          </div>
          <div className="bg-rose-50 p-2 rounded border border-rose-200 flex justify-between items-center text-rose-800">
            <span className="font-sans text-[11px]">Alpa (A)</span>
            <span className="font-bold tabular-nums">{summary.alpa}</span>
          </div>
          <div className="bg-purple-50 p-2 rounded border border-purple-200 flex justify-between items-center text-purple-800">
            <span className="font-sans text-[11px]">Terlambat (T)</span>
            <span className="font-bold tabular-nums">{summary.terlambat}</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, NIS, atau NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <span className="text-xs text-slate-500 font-medium shrink-0">Filter:</span>
          {[
            { id: 'all', label: 'Semua' },
            { id: 'H', label: 'Hadir' },
            { id: 'S', label: 'Sakit' },
            { id: 'I', label: 'Izin' },
            { id: 'A', label: 'Alpa' },
            { id: 'T', label: 'Terlambat' },
            { id: 'unmarked', label: 'Belum Diabsen' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-colors ${
                filterStatus === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Student Attendance List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 w-36">NIS / NISN</th>
                <th className="py-3 px-3">Nama Lengkap Siswa</th>
                <th className="py-3 px-3 w-28 text-center">Kontak Ortu</th>
                <th className="py-3 px-3 w-72 text-center">Status Kehadiran</th>
                <th className="py-3 px-3 w-48">Keterangan / Jam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada siswa yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                displayedStudents.map((student, idx) => {
                  const record = getAttendance(student.nis, selectedDate);
                  const currentStatus = record?.status;

                  return (
                    <tr 
                      key={student.nis} 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        currentStatus === 'A' ? 'bg-rose-50/20' :
                        currentStatus === 'S' ? 'bg-blue-50/20' :
                        currentStatus === 'I' ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* No. Absen */}
                      <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>

                      {/* NIS / NISN */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        <div className="font-semibold text-slate-800">{student.nis}</div>
                        <div className="text-slate-400">{student.nisn || '-'}</div>
                      </td>

                      {/* Nama Siswa */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 text-[13px]">
                          {student.nama}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>Kelas {student.kelas}</span>
                          {record?.timeIn && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono text-emerald-700 font-medium">
                                Masuk: {record.timeIn}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Kontak WA Ortu */}
                      <td className="py-2.5 px-3 text-center">
                        {student.wa ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{student.wa}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">
                            Belum ada WA
                          </span>
                        )}
                      </td>

                      {/* Status Buttons: [H] [S] [I] [A] [T] */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1 p-1 bg-slate-100 rounded-lg max-w-[270px] mx-auto">
                          {/* Hadir (H) */}
                          <button
                            onClick={() => markAttendance(student.nis, 'H', '', selectedDate)}
                            className={`flex-1 py-1.5 px-2 rounded-md font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                              currentStatus === 'H'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
                            }`}
                            title="Hadir Tepat Waktu"
                          >
                            <span>H</span>
                            {currentStatus === 'H' && <Check className="w-3 h-3" />}
                          </button>

                          {/* Sakit (S) */}
                          <button
                            onClick={() => handleOpenNoteModal(student, 'S')}
                            className={`flex-1 py-1.5 px-2 rounded-md font-bold text-xs transition-all ${
                              currentStatus === 'S'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-blue-700 hover:bg-white/80'
                            }`}
                            title="Sakit (Klik untuk tambah catatan / WA)"
                          >
                            <span>S</span>
                          </button>

                          {/* Izin (I) */}
                          <button
                            onClick={() => handleOpenNoteModal(student, 'I')}
                            className={`flex-1 py-1.5 px-2 rounded-md font-bold text-xs transition-all ${
                              currentStatus === 'I'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 hover:text-amber-700 hover:bg-white/80'
                            }`}
                            title="Izin (Klik untuk tambah catatan / WA)"
                          >
                            <span>I</span>
                          </button>

                          {/* Alpa (A) */}
                          <button
                            onClick={() => handleOpenNoteModal(student, 'A')}
                            className={`flex-1 py-1.5 px-2 rounded-md font-bold text-xs transition-all ${
                              currentStatus === 'A'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-rose-700 hover:bg-white/80'
                            }`}
                            title="Alpa / Tanpa Keterangan"
                          >
                            <span>A</span>
                          </button>

                          {/* Terlambat (T) */}
                          <button
                            onClick={() => handleOpenNoteModal(student, 'T')}
                            className={`flex-1 py-1.5 px-2 rounded-md font-bold text-xs transition-all ${
                              currentStatus === 'T'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-purple-700 hover:bg-white/80'
                            }`}
                            title="Terlambat"
                          >
                            <span>T</span>
                          </button>
                        </div>
                      </td>

                      {/* Keterangan & Action WA */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleOpenNoteModal(student, currentStatus || 'H')}
                            className="text-left flex-1 group"
                          >
                            {record?.note ? (
                              <span className="text-[11px] text-slate-700 italic group-hover:text-emerald-700 line-clamp-1">
                                {record.note}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-300 group-hover:text-slate-500">
                                + Catatan alasan
                              </span>
                            )}
                          </button>

                          {/* 1-Click WhatsApp Button if Absent */}
                          {currentStatus && currentStatus !== 'H' && student.wa && (
                            <button
                              onClick={() => handleDirectWA(student, currentStatus, record?.note)}
                              title={`Kirim WA ke Orang Tua (${student.wa})`}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors shrink-0"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note & WhatsApp Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Catatan Presensi & Notifikasi
              </h3>
              <button 
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs text-slate-500">Siswa:</div>
                <div className="font-bold text-slate-900 text-sm">
                  {editingStudent.student.nama} ({editingStudent.student.kelas})
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  NIS: {editingStudent.student.nis} · WA Ortu: {editingStudent.student.wa || 'Tidak ada'}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Kehadiran:
                </label>
                <div className="grid grid-cols-5 gap-1.5 text-xs font-bold">
                  {[
                    { id: 'H', label: 'Hadir', color: 'bg-emerald-600 text-white' },
                    { id: 'S', label: 'Sakit', color: 'bg-blue-600 text-white' },
                    { id: 'I', label: 'Izin', color: 'bg-amber-500 text-white' },
                    { id: 'A', label: 'Alpa', color: 'bg-rose-600 text-white' },
                    { id: 'T', label: 'Terlambat', color: 'bg-purple-600 text-white' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEditingStudent({ ...editingStudent, status: item.id as AttendanceStatus })}
                      className={`py-1.5 rounded-lg border text-center transition-all ${
                        editingStudent.status === item.id
                          ? `${item.color} border-transparent shadow-xs`
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Alasan:
                </label>
                <textarea
                  rows={2}
                  value={editingStudent.note}
                  onChange={(e) => setEditingStudent({ ...editingStudent, note: e.target.value })}
                  placeholder="Contoh: Demam tinggi, izin keperluan keluarga, atau dispensasi lomba..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1 text-[11px]">
                {['Demam / Flu', 'Surat Dokter', 'Acara Keluarga', 'Dispensasi Lomba', 'Ban Bocor'].map(sug => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setEditingStudent({ ...editingStudent, note: sug })}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-3 py-2 text-slate-600 hover:text-slate-800"
              >
                Batal
              </button>
              
              <button
                type="button"
                onClick={() => handleSaveNoteModal(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
              >
                Simpan
              </button>

              {editingStudent.student.wa && editingStudent.status !== 'H' && (
                <button
                  type="button"
                  onClick={() => handleSaveNoteModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Simpan & Kirim WA</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
