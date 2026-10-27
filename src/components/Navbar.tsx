import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  QrCode, 
  FileSpreadsheet, 
  CreditCard, 
  MessageSquare, 
  Users
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { formatShortIndonesianDate } from '../utils/date';

export type ActiveTab = 'dashboard' | 'presensi' | 'scanner' | 'rekap' | 'kartu' | 'whatsapp' | 'siswa';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { schoolProfile, selectedDate, setSelectedDate } = useAttendance();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'presensi', label: 'Presensi Harian', icon: CheckSquare },
    { id: 'rekap', label: 'Rekap & Laporan', icon: FileSpreadsheet },
    { id: 'scanner', label: 'Scanner ID', icon: QrCode },
    { id: 'whatsapp', label: 'Pesan Ortu', icon: MessageSquare },
    { id: 'kartu', label: 'Kartu Pelajar', icon: CreditCard },
    { id: 'siswa', label: 'Data Siswa', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          
          {/* Zone 1: Brand title, one line */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-2.5 text-left group transition-transform focus:outline-hidden"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap leading-tight">
                  SiHadir SMP
                </span>
                <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap truncate max-w-[160px] sm:max-w-[220px]">
                  {schoolProfile.namaSekolah}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-6 concise single-line nav links with active state */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all whitespace-nowrap shrink-0 text-xs font-semibold ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action & Quick Date Picker */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700">
              <span className="text-slate-400 font-normal">Tgl:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-medium font-mono text-xs text-slate-800 focus:outline-hidden cursor-pointer"
              />
              <span className="text-[11px] text-emerald-700 font-medium">
                ({formatShortIndonesianDate(selectedDate)})
              </span>
            </div>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'scanner' 
                  ? 'bg-emerald-700 hover:bg-emerald-800' 
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Scan Presensi</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation strip */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
