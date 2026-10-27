import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Student, AttendanceRecord, AttendanceStatus, SchoolProfile, WATemplate, ClassSummary } from '../types';
import { INITIAL_STUDENTS } from '../data/studentsData';
import { DEFAULT_SCHOOL_PROFILE, generateInitialAttendanceRecords } from '../utils/seedData';
import { DEFAULT_WA_TEMPLATES } from '../utils/whatsapp';
import { formatDateISO, getCurrentTime } from '../utils/date';
import { playSuccessChime, playWarningTone } from '../utils/audio';

const STORAGE_KEYS = {
  STUDENTS: 'sihadir_students_v1',
  RECORDS: 'sihadir_records_v1',
  SCHOOL: 'sihadir_school_v1',
  TEMPLATES: 'sihadir_wa_templates_v1',
};

interface AttendanceContextType {
  students: Student[];
  records: AttendanceRecord[];
  schoolProfile: SchoolProfile;
  waTemplates: WATemplate;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedClass: string;
  setSelectedClass: (kelas: string) => void;
  classList: string[];
  markAttendance: (studentId: string, status: AttendanceStatus, note?: string, date?: string, customTime?: string) => void;
  markBatchAttendance: (studentIds: string[], status: AttendanceStatus, date?: string) => void;
  resetClassAttendance: (kelas: string, date?: string) => void;
  getAttendance: (studentId: string, date?: string) => AttendanceRecord | undefined;
  getClassSummary: (kelas: string, date?: string) => ClassSummary;
  getDailyOverallStats: (date?: string) => {
    totalStudents: number;
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    terlambat: number;
    persentase: number;
    recordedCount: number;
  };
  scanNIS: (scannedValue: string, date?: string) => {
    success: boolean;
    student?: Student;
    status?: AttendanceStatus;
    isLate?: boolean;
    message: string;
    alreadyMarked?: boolean;
  };
  addStudent: (studentData: Omit<Student, 'id'>) => boolean;
  updateStudent: (student: Student) => boolean;
  deleteStudent: (studentId: string) => boolean;
  updateSchoolProfile: (profile: Partial<SchoolProfile>) => void;
  updateWATemplates: (templates: Partial<WATemplate>) => void;
  resetToDefault: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Students State
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load students from localStorage', e);
    }
    return INITIAL_STUDENTS;
  });

  // 2. Attendance Records State
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load records from localStorage', e);
    }
    return generateInitialAttendanceRecords();
  });

  // 3. School Profile State
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHOOL);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load school profile', e);
    }
    return DEFAULT_SCHOOL_PROFILE;
  });

  // 4. WhatsApp Templates State
  const [waTemplates, setWATemplates] = useState<WATemplate>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load templates', e);
    }
    return DEFAULT_WA_TEMPLATES;
  });

  // Selected date and class for active navigation
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateISO(new Date()));
  const [selectedClass, setSelectedClass] = useState<string>('7A');

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.warn('Storage quota exceeded or error saving students', e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    } catch (e) {
      console.warn('Storage quota exceeded or error saving records', e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(schoolProfile));
    } catch (e) {
      console.warn('Error saving school profile', e);
    }
  }, [schoolProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(waTemplates));
    } catch (e) {
      console.warn('Error saving wa templates', e);
    }
  }, [waTemplates]);

  // Derived unique class list
  const classList = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.kelas) set.add(s.kelas);
    });
    // Natural sort: 7A, 7B... 8A... 9H
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students]);

  // Lookup record map for fast retrieval: `${date}_${studentId}` -> record
  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records.forEach(r => {
      map.set(`${r.date}_${r.studentId}`, r);
    });
    return map;
  }, [records]);

  // Fast student lookup by NIS, NISN
  const studentByNIS = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => {
      map.set(s.nis, s);
      if (s.nisn) map.set(s.nisn, s);
    });
    return map;
  }, [students]);

  const getAttendance = useCallback((studentId: string, date: string = selectedDate) => {
    return recordMap.get(`${date}_${studentId}`);
  }, [recordMap, selectedDate]);

  // Mark single attendance
  const markAttendance = useCallback((
    studentId: string,
    status: AttendanceStatus,
    note?: string,
    date: string = selectedDate,
    customTime?: string
  ) => {
    const timeIn = customTime || (status === 'H' || status === 'T' ? getCurrentTime() : '');
    const recId = `${date}_${studentId}`;

    setRecords(prev => {
      const idx = prev.findIndex(r => r.id === recId);
      const newRec: AttendanceRecord = {
        id: recId,
        studentId,
        date,
        status,
        note: note || '',
        timeIn,
        session: 'harian',
        markedAt: new Date().toISOString()
      };

      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newRec;
        return next;
      } else {
        return [...prev, newRec];
      }
    });
  }, [selectedDate]);

  // Mark batch attendance (e.g. mark all present)
  const markBatchAttendance = useCallback((
    studentIds: string[],
    status: AttendanceStatus,
    date: string = selectedDate
  ) => {
    const currentTime = getCurrentTime();
    const mapNew = new Map<string, AttendanceRecord>();

    studentIds.forEach(id => {
      const recId = `${date}_${id}`;
      mapNew.set(recId, {
        id: recId,
        studentId: id,
        date,
        status,
        note: '',
        timeIn: status === 'H' ? currentTime : '',
        session: 'harian',
        markedAt: new Date().toISOString()
      });
    });

    setRecords(prev => {
      const remaining = prev.filter(r => !mapNew.has(r.id));
      return [...remaining, ...Array.from(mapNew.values())];
    });
  }, [selectedDate]);

  // Reset attendance for a class
  const resetClassAttendance = useCallback((kelas: string, date: string = selectedDate) => {
    const classStudentIds = new Set(students.filter(s => s.kelas === kelas).map(s => s.nis));
    setRecords(prev => prev.filter(r => !(r.date === date && classStudentIds.has(r.studentId))));
  }, [students, selectedDate]);

  // Get class summary stats
  const getClassSummary = useCallback((kelas: string, date: string = selectedDate): ClassSummary => {
    const classStudents = students.filter(s => s.kelas === kelas);
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let terlambat = 0;
    let recorded = 0;

    classStudents.forEach(s => {
      const rec = recordMap.get(`${date}_${s.nis}`);
      if (rec) {
        recorded++;
        switch (rec.status) {
          case 'H': hadir++; break;
          case 'S': sakit++; break;
          case 'I': izin++; break;
          case 'A': alpa++; break;
          case 'T': terlambat++; break;
        }
      }
    });

    const totalStudents = classStudents.length;
    // Persentase kehadiran = (Hadir + Terlambat) / Total Siswa
    const persentase = totalStudents > 0 ? Math.round(((hadir + terlambat) / totalStudents) * 100) : 0;
    const isCompleted = recorded >= totalStudents && totalStudents > 0;

    return {
      kelas,
      totalStudents,
      hadir,
      sakit,
      izin,
      alpa,
      terlambat,
      persentase,
      isCompleted
    };
  }, [students, recordMap, selectedDate]);

  // Overall daily stats for all classes
  const getDailyOverallStats = useCallback((date: string = selectedDate) => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let terlambat = 0;
    let recordedCount = 0;

    students.forEach(s => {
      const rec = recordMap.get(`${date}_${s.nis}`);
      if (rec) {
        recordedCount++;
        switch (rec.status) {
          case 'H': hadir++; break;
          case 'S': sakit++; break;
          case 'I': izin++; break;
          case 'A': alpa++; break;
          case 'T': terlambat++; break;
        }
      }
    });

    const totalStudents = students.length;
    const persentase = totalStudents > 0 ? Math.round(((hadir + terlambat) / totalStudents) * 100) : 0;

    return {
      totalStudents,
      hadir,
      sakit,
      izin,
      alpa,
      terlambat,
      persentase,
      recordedCount
    };
  }, [students, recordMap, selectedDate]);

  // Scan Barcode / QR / NIS
  const scanNIS = useCallback((scannedValue: string, date: string = selectedDate) => {
    const clean = scannedValue.trim().replace(/^[*#]/, '').replace(/[*#]$/, '');
    const student = studentByNIS.get(clean);

    if (!student) {
      playWarningTone();
      return {
        success: false,
        message: `Data siswa dengan NIS/Barcode "${clean}" tidak ditemukan dalam sistem.`
      };
    }

    const recId = `${date}_${student.nis}`;
    const existing = recordMap.get(recId);
    const nowTime = getCurrentTime();

    // Check if late based on school jamMasuk
    const [inHour, inMin] = schoolProfile.jamMasuk.split(':').map(Number);
    const [currHour, currMin] = nowTime.split(':').map(Number);
    const targetMin = inHour * 60 + inMin;
    const actualMin = currHour * 60 + currMin;
    const isLate = actualMin > targetMin;

    const status: AttendanceStatus = isLate ? 'T' : 'H';
    const note = isLate ? `Tiba pukul ${nowTime} (Terlambat ${actualMin - targetMin} menit)` : 'Hadir Tepat Waktu via Scan';

    markAttendance(student.nis, status, note, date, nowTime);

    if (isLate) {
      playWarningTone();
    } else {
      playSuccessChime();
    }

    return {
      success: true,
      student,
      status,
      isLate,
      alreadyMarked: !!existing,
      message: `Presensi ${student.nama} (${student.kelas}) berhasil dicatat: ${isLate ? 'Terlambat' : 'Hadir Tepat Waktu'}`
    };
  }, [selectedDate, studentByNIS, recordMap, schoolProfile, markAttendance]);

  // Student CRUD
  const addStudent = useCallback((studentData: Omit<Student, 'id'>) => {
    if (studentByNIS.has(studentData.nis)) {
      return false; // NIS must be unique
    }
    const newStudent: Student = {
      ...studentData,
      id: studentData.nis
    };
    setStudents(prev => [...prev, newStudent]);
    return true;
  }, [studentByNIS]);

  const updateStudent = useCallback((student: Student) => {
    setStudents(prev => prev.map(s => s.id === student.id ? student : s));
    return true;
  }, []);

  const deleteStudent = useCallback((studentId: string) => {
    setStudents(prev => prev.filter(s => s.nis !== studentId && s.id !== studentId));
    // also remove records
    setRecords(prev => prev.filter(r => r.studentId !== studentId));
    return true;
  }, []);

  const updateSchoolProfile = useCallback((profile: Partial<SchoolProfile>) => {
    setSchoolProfile(prev => ({ ...prev, ...profile }));
  }, []);

  const updateWATemplates = useCallback((templates: Partial<WATemplate>) => {
    setWATemplates(prev => ({ ...prev, ...templates }));
  }, []);

  const resetToDefault = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    localStorage.removeItem(STORAGE_KEYS.SCHOOL);
    localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
    setStudents(INITIAL_STUDENTS);
    setRecords(generateInitialAttendanceRecords());
    setSchoolProfile(DEFAULT_SCHOOL_PROFILE);
    setWATemplates(DEFAULT_WA_TEMPLATES);
  }, []);

  const value = {
    students,
    records,
    schoolProfile,
    waTemplates,
    selectedDate,
    setSelectedDate,
    selectedClass,
    setSelectedClass,
    classList,
    markAttendance,
    markBatchAttendance,
    resetClassAttendance,
    getAttendance,
    getClassSummary,
    getDailyOverallStats,
    scanNIS,
    addStudent,
    updateStudent,
    deleteStudent,
    updateSchoolProfile,
    updateWATemplates,
    resetToDefault
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
