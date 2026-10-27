import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Filter, 
  Copy, 
  Settings, 
  Phone, 
  Calendar,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { formatIndonesianDate } from '../utils/date';
import { openWhatsAppChat, generateWAMessage } from '../utils/whatsapp';
import { AttendanceStatus } from '../types';

export const WhatsAppBroadcastView: React.FC = () => {
  const { 
    students, 
    records, 
    selectedDate, 
    setSelectedDate, 
    classList, 
    schoolProfile,
    waTemplates,
    updateWATemplates
  } = useAttendance();

  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showTemplateEditor, setShowTemplateEditor] = useState<boolean>(false);
  const [selectedStudentForPreview, setSelectedStudentForPreview] = useState<{
    student: (typeof students)[0];
    status: AttendanceStatus;
    note: string;
  } | null>(null);

  const formattedDate = formatIndonesianDate(selectedDate);

  // List of absent / late students on the selected date
  const absentStudents = useMemo(() => {
    const list: Array<{
      student: (typeof students)[0];
      status: AttendanceStatus;
      note: string;
      timeIn?: string;
    }> = [];

    records
      .filter(r => r.date === selectedDate && r.status !== 'H')
      .forEach(r => {
        const student = students.find(s => s.nis === r.studentId);
        if (student) {
          if (filterClass !== 'all' && student.kelas !== filterClass) return;
          if (filterStatus !== 'all' && r.status !== filterStatus) return;
          list.push({
            student,
            status: r.status,
            note: r.note || '',
            timeIn: r.timeIn
          });
        }
      });

    return list.sort((a, b) => a.student.kelas.localeCompare(b.student.kelas) || a.student.nama.localeCompare(b.student.nama));
  }, [records, selectedDate, students, filterClass, filterStatus]);

  const handleSendWA = (item: (typeof absentStudents)[0]) => {
    if (!item.student.wa) {
      alert(`Siswa ${item.student.nama} tidak memiliki nomor WhatsApp.`);
      return;
    }
    const msg = generateWAMessage(
      item.student,
      item.status,
      formattedDate,
      item.timeIn || schoolProfile.jamMasuk,
      item.note,
      schoolProfile,
      waTemplates
    );
    openWhatsAppChat(item.student.wa, msg);
  };

  const handleCopyMessage = (item: (typeof absentStudents)[0]) => {
    const msg = generateWAMessage(
      item.student,
      item.status,
      formattedDate,
      item.timeIn || schoolProfile.jamMasuk,
      item.note,
      schoolProfile,
      waTemplates
    );
    navigator.clipboard.writeText(msg);
    alert('Pesan berhasil disalin ke clipboard!');
  };

  const currentPreviewMessage = useMemo(() => {
    if (!selectedStudentForPreview) {
      if (absentStudents.length > 0) {
        const first = absentStudents[0];
        return generateWAMessage(
          first.student,
          first.status,
          formattedDate,
          first.timeIn || schoolProfile.jamMasuk,
          first.note,
          schoolProfile,
          waTemplates
        );
      }
      return 'Pilih siswa untuk melihat pratinjau pesan WhatsApp.';
    }
    return generateWAMessage(
      selectedStudentForPreview.student,
      selectedStudentForPreview.status,
      formattedDate,
      selectedStudentForPreview.note,
      selectedStudentForPreview.note,
      schoolProfile,
      waTemplates
    );
  }, [selectedStudentForPreview, absentStudents, formattedDate, schoolProfile, waTemplates]);

  return (
    <div className="space-y-6 pb-20">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide uppercase">
              <span>Layanan Komunikasi Wali Murid</span>
              <span aria-hidden="true">·</span>
              <span>WhatsApp Direct Protocol</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-700" />
              <span>Notifikasi Kehadiran WhatsApp</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Kirim informasi absensi ketidakhadiran (Sakit, Izin, Alpa, Terlambat) secara langsung ke WhatsApp orang tua dengan format pesan resmi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplateEditor(!showTemplateEditor)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>{showTemplateEditor ? 'Tutup Pengaturan Template' : 'Edit Template Pesan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Template Editor Drawer (if opened) */}
      {showTemplateEditor && (
        <div className="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              Konfigurasi Template Pesan WhatsApp
            </h3>
            <span className="text-[11px] text-slate-500">
              Tag tersedia: {'{nama}'}, {'{kelas}'}, {'{nis}'}, {'{tanggal}'}, {'{keterangan}'}, {'{sekolah}'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Template Alpa (Tanpa Keterangan):
              </label>
              <textarea
                rows={4}
                value={waTemplates.alpa}
                onChange={(e) => updateWATemplates({ alpa: e.target.value })}
                className="w-full p-2.5 font-mono text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Template Sakit:
              </label>
              <textarea
                rows={4}
                value={waTemplates.sakit}
                onChange={(e) => updateWATemplates({ sakit: e.target.value })}
                className="w-full p-2.5 font-mono text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Template Izin:
              </label>
              <textarea
                rows={4}
                value={waTemplates.izin}
                onChange={(e) => updateWATemplates({ izin: e.target.value })}
                className="w-full p-2.5 font-mono text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Template Terlambat:
              </label>
              <textarea
                rows={4}
                value={waTemplates.terlambat}
                onChange={(e) => updateWATemplates({ terlambat: e.target.value })}
                className="w-full p-2.5 font-mono text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: List of Students to Notify + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Queue of absent students */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-medium font-mono text-xs text-slate-900 focus:outline-hidden cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 font-medium"
              >
                <option value="all">Semua Kelas ({classList.length})</option>
                {classList.map(c => (
                  <option key={c} value={c}>Kelas {c}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 font-medium"
              >
                <option value="all">Semua Status Absen</option>
                <option value="A">Hanya Alpa (A)</option>
                <option value="S">Hanya Sakit (S)</option>
                <option value="I">Hanya Izin (I)</option>
                <option value="T">Hanya Terlambat (T)</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[520px] pr-1">
            {absentStudents.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                Tidak ada siswa yang tidak hadir sesuai filter pada tanggal ini.
              </div>
            ) : (
              absentStudents.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedStudentForPreview(item)}
                  className={`py-3 px-2 rounded-lg flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                    selectedStudentForPreview?.student.nis === item.student.nis
                      ? 'bg-emerald-50/80 border border-emerald-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate">
                        {item.student.nama}
                      </span>
                      <span className="font-mono text-[11px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-700 font-bold">
                        {item.student.kelas}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        item.status === 'S' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'I' ? 'bg-amber-100 text-amber-800' :
                        item.status === 'A' ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.status === 'S' ? 'Sakit' : item.status === 'I' ? 'Izin' : item.status === 'A' ? 'Alpa' : 'Terlambat'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 font-mono">
                      <span>NIS: {item.student.nis}</span>
                      <span aria-hidden="true">·</span>
                      {item.student.wa ? (
                        <span className="text-emerald-700 font-medium">WA: {item.student.wa}</span>
                      ) : (
                        <span className="text-slate-400 italic">Tanpa Kontak WA</span>
                      )}
                      {item.note && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-600 truncate max-w-[150px] font-sans">
                            {item.note}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyMessage(item);
                      }}
                      title="Salin Teks Pesan"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {item.student.wa ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendWA(item);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold text-xs shadow-xs transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Kirim WA</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic px-2">
                        No WA (-)
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Message Preview Bubble */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pratinjau Pesan WhatsApp
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>Format Resmi Sekolah</span>
              </span>
            </div>

            {/* Simulated WhatsApp Chat Bubble */}
            <div className="bg-[#efeae2] p-4 rounded-xl border border-slate-200 shadow-inner">
              <div className="bg-white p-3.5 rounded-lg rounded-tl-none shadow-xs text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap relative max-w-[95%]">
                {currentPreviewMessage}
                <div className="text-right text-[10px] text-slate-400 mt-2 font-mono">
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Pesan langsung membuka aplikasi WhatsApp Web atau WhatsApp Mobile resmi tanpa melalui perantara pihak ketiga yang berbahaya.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
