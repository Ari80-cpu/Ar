import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Printer, 
  Search, 
  Check, 
  QrCode as QrIcon, 
  Grid, 
  User, 
  Download,
  School
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { Student } from '../types';
import { Barcode } from './Barcode';
import { QRCode } from './QRCode';

export const StudentCardsView: React.FC = () => {
  const { students, classList, selectedClass, setSelectedClass, schoolProfile } = useAttendance();

  const [activeGrade, setActiveGrade] = useState<'7' | '8' | '9'>(() => {
    return (selectedClass.charAt(0) as '7' | '8' | '9') || '7';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [printMode, setPrintMode] = useState<'single' | 'batch'>('single');

  // Filter students by selected class
  const classStudents = useMemo(() => {
    return students
      .filter(s => s.kelas === selectedClass)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [students, selectedClass]);

  // Selected student defaults to first student of the class
  const activeStudent = useMemo(() => {
    if (selectedStudent && selectedStudent.kelas === selectedClass) {
      return selectedStudent;
    }
    return classStudents[0] || null;
  }, [selectedStudent, selectedClass, classStudents]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents;
    return classStudents.filter(s => 
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.includes(searchQuery)
    );
  }, [classStudents, searchQuery]);

  const currentGradeClasses = useMemo(() => {
    return classList.filter(c => c.startsWith(activeGrade));
  }, [classList, activeGrade]);

  const handlePrint = (mode: 'single' | 'batch') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner (No Print) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-700" />
              <span>Cetak Kartu Pelajar & Barcode Presensi</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate kartu identitas siswa digital siap cetak dengan barcode NIS dan QR Code.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handlePrint('single')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak Kartu Terpilih</span>
            </button>

            <button
              onClick={() => handlePrint('batch')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <Grid className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cetak Semua Kartu ({classStudents.length} Siswa)</span>
            </button>
          </div>
        </div>

        {/* Grade & Class Switcher */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
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

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {currentGradeClasses.map(c => (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                  selectedClass === c
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Screen Layout: Single Card Preview + Student List */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${printMode === 'batch' ? 'hidden print:hidden' : ''}`}>
        
        {/* Left: Student Selector List */}
        <div className="no-print lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col max-h-[580px]">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari siswa di kelas ini..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 bg-slate-50"
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
            {filteredStudents.map((s, idx) => {
              const isSelected = activeStudent?.nis === s.nis;
              return (
                <button
                  key={s.nis}
                  onClick={() => setSelectedStudent(s)}
                  className={`w-full text-left py-2.5 px-3 rounded-lg flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-emerald-50 text-emerald-950 font-bold' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-xs text-slate-400 w-5 text-right tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs truncate">{s.nama}</div>
                      <div className="text-[11px] font-mono text-slate-500">NIS: {s.nis}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Premium Indonesian Student ID Card Preview */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-100/70 border border-slate-200 rounded-xl">
          {activeStudent ? (
            <div className="w-full max-w-[420px] aspect-[1.586/1] bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl shadow-xl overflow-hidden p-5 flex flex-col justify-between relative border border-emerald-500/30">
              
              {/* Header: School Logo & Title */}
              <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-900 flex items-center justify-center font-bold text-sm shadow-xs">
                    <School className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-emerald-300 font-semibold leading-tight">
                      KARTU TANDA PELAJAR
                    </div>
                    <div className="text-xs font-bold tracking-tight text-white leading-tight">
                      {schoolProfile.namaSekolah}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-mono font-medium text-emerald-400 px-1.5 py-0.5 rounded bg-white/10">
                    KLS {activeStudent.kelas}
                  </span>
                </div>
              </div>

              {/* Student Details & Photo Avatar */}
              <div className="my-auto flex items-center gap-4 py-2">
                <div className="w-20 h-24 rounded-xl bg-white/10 border border-white/20 flex flex-col items-center justify-center text-white/60 shadow-inner shrink-0 relative overflow-hidden">
                  <User className="w-10 h-10 text-white/40" />
                  <span className="text-[9px] font-mono mt-1 text-emerald-300">FOTO 3x4</span>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div>
                    <div className="text-[9px] text-emerald-300/80 uppercase font-medium">Nama Siswa</div>
                    <div className="text-sm font-bold text-white tracking-tight truncate leading-tight">
                      {activeStudent.nama}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                    <div>
                      <span className="text-slate-400 block text-[8px]">NIS</span>
                      <span className="font-semibold text-white">{activeStudent.nis}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[8px]">NISN</span>
                      <span className="font-semibold text-white">{activeStudent.nisn || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="shrink-0 bg-white p-1 rounded-lg shadow-sm">
                  <QRCode value={`STUDENT:${activeStudent.nis}:${activeStudent.nama}`} size={64} />
                </div>
              </div>

              {/* Card Footer: Barcode */}
              <div className="bg-white rounded-lg p-2 flex flex-col items-center shadow-xs">
                <Barcode value={activeStudent.nis} height={32} width={260} showText={true} />
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-sm">Pilih siswa untuk melihat kartu pelajar</div>
          )}
        </div>
      </div>

      {/* Batch Print Grid: 8 Cards per A4 Page (Active during Batch Print) */}
      <div className={`grid grid-cols-2 gap-4 ${printMode === 'batch' ? 'block' : 'hidden print:block'}`}>
        {classStudents.map((student) => (
          <div 
            key={student.nis} 
            className="w-full aspect-[1.586/1] bg-white text-slate-900 rounded-xl p-4 flex flex-col justify-between border-2 border-slate-800 break-inside-avoid shadow-xs"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  S
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-wider text-slate-500 font-bold leading-tight">
                    KARTU TANDA PELAJAR
                  </div>
                  <div className="text-[10px] font-bold text-slate-900 leading-tight">
                    {schoolProfile.namaSekolah}
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                {student.kelas}
              </span>
            </div>

            {/* Content */}
            <div className="flex items-center gap-3 py-1">
              <div className="w-14 h-16 rounded bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400 shrink-0 text-[8px] font-mono">
                3x4
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                  {student.nama}
                </div>
                <div className="text-[9px] font-mono text-slate-600 mt-0.5">
                  NIS: <strong>{student.nis}</strong> · NISN: {student.nisn || '-'}
                </div>
              </div>
              <div className="shrink-0">
                <QRCode value={`STUDENT:${student.nis}`} size={46} />
              </div>
            </div>

            {/* Barcode */}
            <div className="border-t border-slate-200 pt-1 flex justify-center">
              <Barcode value={student.nis} height={26} width={220} showText={true} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
