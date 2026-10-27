import React, { useState } from 'react';
import { AttendanceProvider } from './context/AttendanceContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { AttendanceTakerView } from './components/AttendanceTakerView';
import { ScannerView } from './components/ScannerView';
import { RecapView } from './components/RecapView';
import { StudentCardsView } from './components/StudentCardsView';
import { WhatsAppBroadcastView } from './components/WhatsAppBroadcastView';
import { StudentsDatabaseView } from './components/StudentsDatabaseView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  return (
    <AttendanceProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-200">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
          {activeTab === 'presensi' && <AttendanceTakerView />}
          {activeTab === 'scanner' && <ScannerView />}
          {activeTab === 'rekap' && <RecapView />}
          {activeTab === 'kartu' && <StudentCardsView />}
          {activeTab === 'whatsapp' && <WhatsAppBroadcastView />}
          {activeTab === 'siswa' && <StudentsDatabaseView />}
        </main>

        <footer className="no-print mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">SiHadir SMP</span>
              <span aria-hidden="true">·</span>
              <span>Sistem Presensi Siswa Terpadu Jenjang SMP</span>
            </div>
            <div className="text-slate-400">
              Format Rekapitulasi Sesuai Standar Dapodik Kemdikbudristek
            </div>
          </div>
        </footer>
      </div>
    </AttendanceProvider>
  );
}
