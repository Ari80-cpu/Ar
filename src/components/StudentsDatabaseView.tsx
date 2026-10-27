import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  RotateCcw, 
  Settings, 
  School, 
  Save, 
  Phone,
  Check,
  X
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { Student } from '../types';

export const StudentsDatabaseView: React.FC = () => {
  const { 
    students, 
    classList, 
    addStudent, 
    updateStudent, 
    deleteStudent, 
    schoolProfile, 
    updateSchoolProfile, 
    resetToDefault,
    records
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<'students' | 'school'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Add / Edit Modal state
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [studentFormData, setStudentFormData] = useState<{
    id?: string;
    nis: string;
    nisn: string;
    nama: string;
    kelas: string;
    wa: string;
  }>({
    nis: '',
    nisn: '',
    nama: '',
    kelas: '7A',
    wa: ''
  });

  // School profile form state
  const [schoolFormData, setSchoolFormData] = useState(schoolProfile);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = filterClass === 'all' || s.kelas === filterClass;
      const matchSearch = 
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery) ||
        (s.nisn && s.nisn.includes(searchQuery));
      return matchClass && matchSearch;
    }).sort((a, b) => a.kelas.localeCompare(b.kelas, undefined, { numeric: true }) || a.nama.localeCompare(b.nama));
  }, [students, filterClass, searchQuery]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const handleOpenAdd = () => {
    setStudentFormData({
      nis: '',
      nisn: '',
      nama: '',
      kelas: filterClass !== 'all' ? filterClass : '7A',
      wa: ''
    });
    setModalMode('add');
  };

  const handleOpenEdit = (student: Student) => {
    setStudentFormData({
      id: student.id,
      nis: student.nis,
      nisn: student.nisn || '',
      nama: student.nama,
      kelas: student.kelas,
      wa: student.wa || ''
    });
    setModalMode('edit');
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFormData.nis.trim() || !studentFormData.nama.trim()) {
      alert('NIS dan Nama Lengkap wajib diisi.');
      return;
    }

    if (modalMode === 'add') {
      const success = addStudent(studentFormData);
      if (!success) {
        alert(`NIS ${studentFormData.nis} sudah terdaftar dalam sistem.`);
        return;
      }
    } else if (modalMode === 'edit' && studentFormData.id) {
      updateStudent({
        id: studentFormData.id,
        nis: studentFormData.nis,
        nisn: studentFormData.nisn,
        nama: studentFormData.nama,
        kelas: studentFormData.kelas,
        wa: studentFormData.wa
      });
    }

    setModalMode(null);
  };

  const handleDelete = (student: Student) => {
    if (window.confirm(`Yakin ingin menghapus data siswa: ${student.nama} (${student.kelas})?`)) {
      deleteStudent(student.nis);
    }
  };

  const handleSaveSchoolProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfile(schoolFormData);
    alert('Profil dan pengaturan sekolah berhasil disimpan!');
  };

  const handleBackupJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      schoolProfile,
      students,
      records
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_SiHadir_${schoolProfile.namaSekolah.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    if (window.confirm('PERINGATAN: Tindakan ini akan mengembalikan seluruh data 806 siswa dan jadwal absensi ke kondisi awal dari file CSV asli. Lanjutkan?')) {
      resetToDefault();
      alert('Data sistem berhasil direset ke dataset asli template!');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide uppercase">
              <span>Database Terpusat & Pengaturan</span>
              <span aria-hidden="true">·</span>
              <span>{students.length} Siswa Terdaftar</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-700" />
              <span>Kelola Data Siswa & Profil Sekolah</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manajemen master data 806 siswa, kontak WhatsApp wali murid, identitas sekolah, dan backup sistem.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBackupJSON}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Backup JSON</span>
            </button>

            <button
              onClick={handleResetData}
              title="Reset ke CSV Template Asli"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Template CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Siswa vs Profil Sekolah */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'students'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Daftar Master Siswa ({students.length})
          </button>

          <button
            onClick={() => setActiveTab('school')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'school'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Profil & Pengaturan Sekolah
          </button>
        </div>
      </div>

      {activeTab === 'students' ? (
        <div className="space-y-4">
          {/* Search, Filter & Add Student */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, NIS, atau NISN..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 bg-slate-50"
                />
              </div>

              <select
                value={filterClass}
                onChange={(e) => {
                  setFilterClass(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold"
              >
                <option value="all">Semua Kelas ({classList.length})</option>
                {classList.map(c => (
                  <option key={c} value={c}>Kelas {c}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenAdd}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa Baru</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">No</th>
                    <th className="py-3 px-3 w-28">NIS</th>
                    <th className="py-3 px-3 w-32">NISN</th>
                    <th className="py-3 px-3">Nama Lengkap Siswa</th>
                    <th className="py-3 px-3 w-20 text-center">Kelas</th>
                    <th className="py-3 px-3 w-36">No. WA Orang Tua</th>
                    <th className="py-3 px-3 w-24 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Tidak ada data siswa yang cocok dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student, idx) => (
                      <tr key={student.nis} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-400 tabular-nums">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {student.nis}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {student.nisn || '-'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {student.nama}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                            {student.kelas}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {student.wa ? (
                            <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                              {student.wa}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(student)}
                              title="Edit Siswa"
                              className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(student)}
                              title="Hapus Siswa"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari {filteredStudents.length} siswa
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40"
                  >
                    Sebelumnya
                  </button>
                  <span className="px-2 font-mono font-bold text-slate-700">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* School Settings Form */
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-3xl">
          <form onSubmit={handleSaveSchoolProfile} className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
              Identitas Satuan Pendidikan & Pejabat Sekolah
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Resmi Sekolah:
                </label>
                <input
                  type="text"
                  value={schoolFormData.namaSekolah}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, namaSekolah: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NPSN:
                </label>
                <input
                  type="text"
                  value={schoolFormData.npsn}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, npsn: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Lengkap:
                </label>
                <input
                  type="text"
                  value={schoolFormData.alamat}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, alamat: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kabupaten / Kota:
                </label>
                <input
                  type="text"
                  value={schoolFormData.kabupatenKota}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, kabupatenKota: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Provinsi:
                </label>
                <input
                  type="text"
                  value={schoolFormData.provinsi}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, provinsi: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Kepala Sekolah:
                </label>
                <input
                  type="text"
                  value={schoolFormData.kepalaSekolah}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, kepalaSekolah: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NIP Kepala Sekolah:
                </label>
                <input
                  type="text"
                  value={schoolFormData.nipKepalaSekolah}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, nipKepalaSekolah: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jam Batas Masuk Presensi:
                </label>
                <input
                  type="time"
                  value={schoolFormData.jamMasuk}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, jamMasuk: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Scan di atas jam ini akan otomatis dicatat sebagai "Terlambat".
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tahun Ajaran Aktif:
                </label>
                <input
                  type="text"
                  value={schoolFormData.tahunAjaran}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, tahunAjaran: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {modalMode === 'add' ? 'Tambah Siswa Baru' : 'Edit Data Siswa'}
              </h3>
              <button 
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Induk Siswa (NIS):
                </label>
                <input
                  type="text"
                  value={studentFormData.nis}
                  onChange={(e) => setStudentFormData({ ...studentFormData, nis: e.target.value })}
                  disabled={modalMode === 'edit'}
                  placeholder="Contoh: 10940"
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono disabled:bg-slate-100 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NISN (Opsional):
                </label>
                <input
                  type="text"
                  value={studentFormData.nisn}
                  onChange={(e) => setStudentFormData({ ...studentFormData, nisn: e.target.value })}
                  placeholder="Contoh: 0132607497"
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap Siswa:
                </label>
                <input
                  type="text"
                  value={studentFormData.nama}
                  onChange={(e) => setStudentFormData({ ...studentFormData, nama: e.target.value })}
                  placeholder="Nama sesuai akta / raport"
                  className="w-full p-2 border border-slate-200 rounded-lg font-bold uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kelas:
                  </label>
                  <select
                    value={studentFormData.kelas}
                    onChange={(e) => setStudentFormData({ ...studentFormData, kelas: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-bold"
                  >
                    {classList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. WA Orang Tua:
                  </label>
                  <input
                    type="text"
                    value={studentFormData.wa}
                    onChange={(e) => setStudentFormData({ ...studentFormData, wa: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-xs"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
