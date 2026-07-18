import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { School, Student, Payment, BackupLog, ApiKey, Role } from '../types';
import AcademicCenter from './AcademicCenter';
import AttendanceTracker from './AttendanceTracker';
import StudentHistoryModal from './StudentHistoryModal';
import PromotionsManager from './PromotionsManager';
import StudentTranscripts from './StudentTranscripts';
import AnalyticsCenter from './AnalyticsCenter';
import NewsFeed from './NewsFeed';
import PastStudents from './PastStudents';
import BillingComponent from './BillingComponent';
import { 
  BarChart3, Users, PlusCircle, CreditCard, ShieldCheck, 
  Database, Terminal, LogOut, Wifi, WifiOff, FileText, 
  Trash2, RefreshCw, Send, CheckCircle2, AlertTriangle, 
  Search, SlidersHorizontal, ArrowDownToLine, Phone, Printer, 
  Calendar, Award, DollarSign, BookOpen, Clock, Key,
  School as SchoolIcon, GraduationCap, Settings, Edit, Menu, User
} from 'lucide-react';

interface DashboardProps {
  school: School;
  role: Role;
  user?: any;
  isDemo?: boolean;
  onLogout: () => void;
  onRoleChange: (role: Role) => void;
  onSchoolUpdate?: (school: School) => void;
}

export default function Dashboard({ school, role, user, isDemo = true, onLogout, onRoleChange, onSchoolUpdate }: DashboardProps) {
  // Navigation State
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (role === 'Teacher') return 'academic';
    return school.accessLevel === 'Restricted' ? 'register' : 'overview';
  });

  // Network Offline State Simulation
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return localStorage.getItem('geda_offline_mode') === 'true';
  });

  // Client states
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<Student[]>(() => {
    const cached = localStorage.getItem(`geda_offline_queue_${school.id}`);
    return cached ? JSON.parse(cached) : [];
  });

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [billingNotice, setBillingNotice] = useState(school.billingNotice || '');

  const handleTabChange = (tab: any) => {
    if (school.accessLevel === 'Restricted' && tab !== 'register' && tab !== 'billing') {
      setErrorMsg("Your account is currently restricted. The only access available is to add students and to make payment.");
      setActiveTab('billing');
      setTimeout(() => setErrorMsg(''), 6000);
      return;
    }
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Roster Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form State: Register Student
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [classLevel, setClassLevel] = useState('JHS 1');
  const [boardingStatus, setBoardingStatus] = useState<'Day' | 'Boarding'>('Day');
  const [feeTotal, setFeeTotal] = useState<number | ''>('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [passportPicture, setPassportPicture] = useState('');
  const [studentRemarks, setStudentRemarks] = useState('');

  // Form State: Collect Payment
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MTN MoMo' | 'Telecel Cash' | 'AT Money' | 'Bank' | 'Cash'>('MTN MoMo');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Editing / Deleting Student
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isDeletingStudent, setIsDeletingStudent] = useState<string | null>(null);
  const [momoPendingSim, setMomoPendingSim] = useState(false);

  // Admission Letter Modal
  const [letterStudent, setLetterStudent] = useState<Student | null>(null);
  const [activeLetterTab, setActiveLetterTab] = useState<'letter' | 'slip'>('letter');
  const [letterCustomNotes, setLetterCustomNotes] = useState('');
  const [headmasterName, setHeadmasterName] = useState('Rev. Dr. Osei K. Bonsu');
  const printRef = useRef<HTMLDivElement>(null);
  const [showPrintWarning, setShowPrintWarning] = useState(false);
  
  const reactToPrintFn = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Admission_Letter',
  });

  const handlePrint = () => {
    if (window.self !== window.top) {
      setShowPrintWarning(true);
      setTimeout(() => setShowPrintWarning(false), 5000);
    }
    if (reactToPrintFn) {
      reactToPrintFn();
    }
  };

  // Teacher Academic Grade Dialog State
  const [gradeStudent, setGradeStudent] = useState<Student | null>(null);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [tempRemarks, setTempRemarks] = useState('');
  const [tempSbaScore, setTempSbaScore] = useState('');
  const [tempExamScore, setTempExamScore] = useState('');
  const [tempAttPresent, setTempAttPresent] = useState('');
  const [tempAttTotal, setTempAttTotal] = useState('');

  // Teacher Management State
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState<boolean>(false);
  const [newTeacherName, setNewTeacherName] = useState<string>('');
  const [newTeacherEmail, setNewTeacherEmail] = useState<string>('');
  const [newTeacherPassword, setNewTeacherPassword] = useState<string>('');
  const [newTeacherDepartment, setNewTeacherDepartment] = useState<'Primary' | 'JHS' | ''>('');
  const [newTeacherSubject, setNewTeacherSubject] = useState<string>('');
  const [newTeacherIsClassTeacher, setNewTeacherIsClassTeacher] = useState<boolean>(false);
  const [newTeacherAssignedClass, setNewTeacherAssignedClass] = useState<string>('');
  const [teacherError, setTeacherError] = useState<string>('');
  const [teacherSuccess, setTeacherSuccess] = useState<string>('');
  const [creatingTeacher, setCreatingTeacher] = useState<boolean>(false);

  // API Key form state
  const [newKeyName, setNewKeyName] = useState('');

  // API Sandbox Live Runner State
  const [sandboxMethod, setSandboxMethod] = useState<'GET' | 'POST'>('GET');
  const [sandboxToken, setSandboxToken] = useState('');
  const [sandboxPostData, setSandboxPostData] = useState(`{
  "fullName": "Efua Kwarteng",
  "dob": "2014-09-18",
  "gender": "Female",
  "classLevel": "JHS 1",
  "boardingStatus": "Day",
  "guardianName": "Joseph Kwarteng",
  "guardianPhone": "0245667788"
}`);
  const [sandboxResponse, setSandboxResponse] = useState<any>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  // School Settings State
  const [settingsName, setSettingsName] = useState(school.name);
  const [settingsRegion, setSettingsRegion] = useState(school.region);
  const [settingsDistrict, setSettingsDistrict] = useState(school.district);
  const [settingsLogo, setSettingsLogo] = useState(school.logo || '');
  const [settingsPrimaryColor, setSettingsPrimaryColor] = useState(school.primaryColor || '#0f172a');
  const [settingsEmisCode, setSettingsEmisCode] = useState(school.emisCode || '');
  const [settingsYearOfEstablishment, setSettingsYearOfEstablishment] = useState(school.yearOfEstablishment || '');
  const [settingsHeadTeacherName, setSettingsHeadTeacherName] = useState(school.headTeacherName || '');
  const [settingsHeadTeacherStaffId, setSettingsHeadTeacherStaffId] = useState(school.headTeacherStaffId || '');
  const [settingsHeadTeacherPhone, setSettingsHeadTeacherPhone] = useState(school.headTeacherPhone || '');
  const [settingsAcademicYear, setSettingsAcademicYear] = useState(school.academicYear || '2026/2027');
  const [settingsAcademicTerm, setSettingsAcademicTerm] = useState(school.academicTerm || 'First');
  const [settingsReopeningDate, setSettingsReopeningDate] = useState(school.reopeningDate || '');
  const [settingsVacationDate, setSettingsVacationDate] = useState(school.vacationDate || '');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Keep settings states in sync with active school prop changes
  useEffect(() => {
    setSettingsName(school.name);
    setSettingsRegion(school.region);
    setSettingsDistrict(school.district);
    setSettingsLogo(school.logo || '');
    setSettingsPrimaryColor(school.primaryColor || '#0f172a');
    setSettingsEmisCode(school.emisCode || '');
    setSettingsYearOfEstablishment(school.yearOfEstablishment || '');
    setSettingsHeadTeacherName(school.headTeacherName || '');
    setSettingsHeadTeacherStaffId(school.headTeacherStaffId || '');
    setSettingsHeadTeacherPhone(school.headTeacherPhone || '');
    setSettingsAcademicYear(school.academicYear || '2026/2027');
    setSettingsAcademicTerm(school.academicTerm || 'First');
    setSettingsReopeningDate(school.reopeningDate || '');
    setSettingsVacationDate(school.vacationDate || '');
    setSettingsSuccess('');
    setSettingsError('');
  }, [school]);

  // Syncing status
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync Offline cache state helper
  useEffect(() => {
    localStorage.setItem(`geda_offline_queue_${school.id}`, JSON.stringify(offlineQueue));
  }, [offlineQueue, school.id]);

  useEffect(() => {
    localStorage.setItem('geda_offline_mode', String(isOffline));
  }, [isOffline]);

  // Load backend data
  const fetchData = async () => {
    if (isOffline) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const schoolRes = await fetch(`/api/v1/schools/${school.id}`);
      if (!schoolRes.ok) {
        const text = await schoolRes.text();
        console.error("School API error:", schoolRes.status, text);
        throw new Error("School API failed");
      }
      const schoolData = await schoolRes.json();
      if (schoolData.billingNotice) {
        setBillingNotice(schoolData.billingNotice);
      } else {
        setBillingNotice('');
      }

      const sRes = await fetch(`/api/v1/students?schoolId=${school.id}`);
      if (!sRes.ok) throw new Error("Students API failed: " + await sRes.text());
      const sData = await sRes.json();
      setStudents(sData);

      const pRes = await fetch(`/api/v1/payments?schoolId=${school.id}`);
      if (!pRes.ok) throw new Error("Payments API failed: " + await pRes.text());
      const pData = await pRes.json();
      setPayments(pData);

      const bRes = await fetch(`/api/v1/backups?schoolId=${school.id}`);
      if (!bRes.ok) throw new Error("Backups API failed: " + await bRes.text());
      const bData = await bRes.json();
      setBackups(bData);

      const kRes = await fetch(`/api/v1/api-keys?schoolId=${school.id}`);
      if (!kRes.ok) throw new Error("Keys API failed: " + await kRes.text());
      const kData = await kRes.json();
      setApiKeys(kData);
      if (kData.length > 0 && !sandboxToken) {
        setSandboxToken(kData[0].token);
      }
    } catch (err: any) {
      console.error("Fetch Data Error:", err);
      setErrorMsg(`Failed to sync latest cloud data from GEDA servers. Using cached client state. (${err.message})`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeachers = async () => {
    if (isOffline) return;
    setLoadingTeachers(true);
    try {
      const res = await fetch(`/api/v1/teachers?schoolId=${school.id}`);
      if (res.ok) {
        const data = await res.json();
        setTeachers(data);
      }
    } catch (err) {
      console.error('Failed to load teachers', err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTeachers();
  }, [school.id, isOffline, activeTab]);

  // Simulate Toggle Network Online/Offline
  const handleOfflineToggle = () => {
    setIsOffline(!isOffline);
    setSuccessMsg(!isOffline ? 'Simulating complete network disconnect (Offline Mode).' : 'Network reconnected. Fetching live database.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Sync Offline Queue
  const handleOfflineSync = async () => {
    if (isOffline) {
      setErrorMsg('Cannot sync while Offline Mode is enabled.');
      return;
    }
    if (offlineQueue.length === 0) return;

    setIsSyncing(true);
    try {
      const res = await fetch('/api/v1/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: school.id,
          students: offlineQueue
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students);
        setOfflineQueue([]);
        setSuccessMsg(`Synchronization complete! ${data.syncedCount} offline registration records pushed to cloud database.`);
        setTimeout(() => setSuccessMsg(''), 5000);
        // Refresh payments
        fetchData();
      } else {
        setErrorMsg(data.error || 'Synchronization failed.');
      }
    } catch (err) {
      setErrorMsg('Failed to establish hand-shake with GES Cloud servers. Try again later.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Download Excel Template for Bulk Upload
  const downloadExcelTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        fullName: 'John Doe',
        dob: '2010-05-14',
        gender: 'Male',
        classLevel: 'Basic 1',
        boardingStatus: 'Day',
        feeTotal: 1200,
        guardianName: 'Jane Doe',
        guardianPhone: '0241234567',
        remarks: 'Transfer student'
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students Template');
    XLSX.writeFile(wb, 'GEDA_Bulk_Onboarding_Template.xlsx');
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet) as any[];

        if (parsedData.length === 0) {
          setErrorMsg('The uploaded Excel file is empty.');
          return;
        }

        if (isOffline) {
          setErrorMsg('Bulk upload requires an active network connection.');
          return;
        }

        const res = await fetch('/api/v1/students/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schoolId: school.id, students: parsedData })
        });

        if (res.ok) {
          const newStudents = await res.json();
          setStudents((prev) => [...prev, ...newStudents]);
          setSuccessMsg(`Successfully onboarded ${newStudents.length} students in bulk.`);
        } else {
          const err = await res.json();
          setErrorMsg(err.error || 'Bulk upload failed.');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Error parsing Excel file. Please use the provided template.');
      }
      
      // Reset input
      if (e.target) {
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to low quality jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setPassportPicture(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingStudent) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setEditingStudent({...editingStudent, passportPicture: dataUrl});
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Form Submit: Register Student
  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName || !dob || !guardianName || !guardianPhone) {
      setErrorMsg('Please complete all required student fields.');
      return;
    }

    const price = feeTotal !== '' ? Number(feeTotal) : (boardingStatus === 'Boarding' ? 2500 : 1200);

    const newStudentTemp: Student = {
      id: `${school.id}-${Date.now()}`,
      schoolId: school.id,
      admissionNo: `PENDING-SYNC`,
      fullName,
      dob,
      gender,
      classLevel,
      boardingStatus,
      guardianName,
      guardianPhone,
      passportPicture,
      admissionStatus: 'Admitted',
      feePaid: 0,
      feeTotal: price,
      paymentStatus: 'Unpaid',
      syncStatus: isOffline ? 'pending' : 'synced',
      remarks: studentRemarks,
      createdAt: new Date().toISOString()
    };

    if (isOffline) {
      // Append to offline cache queue
      setOfflineQueue(prev => [...prev, newStudentTemp]);
      setSuccessMsg(`OFFLINE CACHED: Student registration saved locally. Record will upload when reconnected. Fee assigned: GH₵ ${(price || 0).toLocaleString()}`);
      resetRegisterForm();
    } else {
      try {
        const res = await fetch('/api/v1/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newStudentTemp)
        });
        const data = await res.json();
        if (res.ok) {
          setStudents(prev => [...prev, data]);
          setSuccessMsg(`SUCCESS: student ${data.fullName} registered. Admission No: ${data.admissionNo}. Fee: GH₵ ${(price || 0).toLocaleString()}`);
          resetRegisterForm();
        } else {
          setErrorMsg(data.error || 'Failed to submit registration');
        }
      } catch (err) {
        setErrorMsg('Network error. Switched registration to offline cache.');
        setOfflineQueue(prev => [...prev, newStudentTemp]);
        resetRegisterForm();
      }
    }
  };

  const resetRegisterForm = () => {
    setFullName('');
    setDob('');
    setGender('Male');
    setClassLevel('JHS 1');
    setBoardingStatus('Day');
    setFeeTotal('');
    setGuardianName('');
    setGuardianPhone('');
    setPassportPicture('');
    setStudentRemarks('');
    // Clear notifications in 5s
    setTimeout(() => {
      setSuccessMsg('');
      setErrorMsg('');
    }, 6000);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    if (isOffline) {
      alert("Editing students is only available when online.");
      return;
    }

    try {
      const res = await fetch(`/api/v1/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStudent)
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(prev => prev.map(s => s.id === editingStudent.id ? data : s));
        setEditingStudent(null);
      } else {
        alert(data.error || 'Failed to update student');
      }
    } catch (err) {
      alert('Network error while updating student.');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (isOffline) {
      alert("Deleting students is only available when online.");
      return;
    }

    try {
      const res = await fetch(`/api/v1/students/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStudents(prev => prev.filter(s => s.id !== id));
        setPayments(prev => prev.filter(p => p.studentId !== id));
        setIsDeletingStudent(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete student');
      }
    } catch (err) {
      alert('Network error while deleting student.');
    }
  };

  // Form Submit: Collect MoMo Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    setPaymentSuccess(false);

    if (!selectedStudentId || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      setPaymentError('Please select a student and enter a valid payment amount.');
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) {
      // Check in offline queue
      const offlineStud = offlineQueue.find(s => s.id === selectedStudentId);
      if (offlineStud) {
        setPaymentError('Payments cannot be logged for pending-sync offline registrations. Please sync your offline registrations first.');
      } else {
        setPaymentError('Student record not found.');
      }
      return;
    }

    const remaining = student.feeTotal - student.feePaid;
    if (parseFloat(paymentAmount) > remaining) {
      setPaymentError(`Excess amount. Student only owes GH₵ ${(remaining || 0).toLocaleString()}`);
      return;
    }

    setMomoPendingSim(true);

    // Simulate Mobile Money processing delays & SMS network handshakes
    setTimeout(async () => {
      const transactionId = `MOMO-${Math.floor(10000000 + Math.random() * 90000000)}`;
      
      const payload = {
        studentId: selectedStudentId,
        schoolId: school.id,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        transactionId
      };

      if (isOffline) {
        // Log transaction error (Payments require authorization gateway)
        setPaymentError('Offline Transaction Failed: Real-time payment verification requires active cellular connection for SMS handshake.');
        setMomoPendingSim(false);
      } else {
        try {
          const res = await fetch('/api/v1/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok) {
            setPaymentSuccess(true);
            setPaymentAmount('');
            setSelectedStudentId('');
            setPaymentPhone('');
            fetchData(); // reload
          } else {
            setPaymentError(data.error || 'Payment logging failed.');
          }
        } catch (err) {
          setPaymentError('Failed to verify MoMo transaction with server.');
        } finally {
          setMomoPendingSim(false);
        }
      }
    }, 1500);
  };

  // Trigger Manual Backup
  const handleTriggerBackup = async () => {
    if (isOffline) {
      setErrorMsg('Backup catalog logging is unavailable while offline.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: school.id, type: 'Manual' })
      });
      const data = await res.json();
      if (res.ok) {
        setBackups(prev => [data.log, ...prev]);
        setSuccessMsg(`Data Backup Successful! Log recorded. Initializing archive download.`);
        
        // Trigger actual download of JSON file
        const blob = new Blob([JSON.stringify(data.backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.log.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg('Backup process halted by host.');
      }
    } catch (err) {
      setErrorMsg('Failed to process secure backup.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate / Create API Key
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: school.id, name: newKeyName })
      });
      const data = await res.json();
      if (res.ok) {
        setApiKeys(prev => [...prev, data]);
        setNewKeyName('');
        setSuccessMsg(`New API Access Key created: "${data.name}"`);
        setSandboxToken(data.token);
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      setErrorMsg('API token creation failed.');
    }
  };

  // Revoke API Key
  const handleRevokeKey = async (keyId: string) => {
    try {
      const res = await fetch('/api/v1/api-keys/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId })
      });
      const data = await res.json();
      if (res.ok) {
        setApiKeys(prev => prev.map(k => k.id === keyId ? { ...k, status: 'Revoked' } : k));
        setSuccessMsg('API Token revoked.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg('Token revocation failed.');
    }
  };

  // Run API Sandbox Request
  const handleRunSandbox = async () => {
    setSandboxLoading(true);
    setSandboxResponse(null);
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${sandboxToken}`
      };
      
      let options: RequestInit = {
        method: sandboxMethod,
        headers
      };

      if (sandboxMethod === 'POST') {
        headers['Content-Type'] = 'application/json';
        options.body = sandboxPostData;
      }

      const res = await fetch('/api/v1/sis/students', options);
      const data = await res.json();
      setSandboxResponse(data);
      // If student successfully added via sandbox POST, refresh data
      if (res.ok && sandboxMethod === 'POST') {
        fetchData();
      }
    } catch (err) {
      setSandboxResponse({ error: 'Failed to connect to API Sandbox. Verify network connectivity.' });
    } finally {
      setSandboxLoading(false);
    }
  };

  // Edit Academic remarks (Teacher flow)
  const handleSaveAcademicRecord = async () => {
    if (!gradeStudent) return;
    try {
      const body = {
        remarks: tempRemarks,
        sbaScore: tempSbaScore !== '' ? Number(tempSbaScore) : null,
        examScore: tempExamScore !== '' ? Number(tempExamScore) : null,
        attendancePresent: tempAttPresent !== '' ? Number(tempAttPresent) : null,
        attendanceTotal: tempAttTotal !== '' ? Number(tempAttTotal) : null
      };

      const res = await fetch(`/api/v1/students/${gradeStudent.id}/academic`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const updatedStudent = await res.json();
        setStudents(prev => prev.map(s => s.id === gradeStudent.id ? updatedStudent : s));
        setGradeStudent(null);
        setSuccessMsg(`Academic indicators and attendance recorded for ${gradeStudent.fullName}.`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert("Failed to save academic records. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to backend to save academic records.");
    }
  };

  const handleSaveSchoolSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess('');
    setSettingsError('');

    try {
      const res = await fetch(`/api/v1/schools/${school.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: settingsName,
          region: settingsRegion,
          district: settingsDistrict,
          logo: settingsLogo,
          primaryColor: settingsPrimaryColor,
          emisCode: settingsEmisCode,
          yearOfEstablishment: settingsYearOfEstablishment,
          headTeacherName: settingsHeadTeacherName,
          headTeacherStaffId: settingsHeadTeacherStaffId,
          headTeacherPhone: settingsHeadTeacherPhone,
          academicYear: settingsAcademicYear,
          academicTerm: settingsAcademicTerm,
          reopeningDate: settingsReopeningDate,
          vacationDate: settingsVacationDate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSettingsSuccess('School profile and configurations updated successfully!');
        if (onSchoolUpdate) {
          onSchoolUpdate(data);
        }
        setTimeout(() => setSettingsSuccess(''), 5000);
      } else {
        setSettingsError(data.error || 'Failed to update school settings.');
      }
    } catch (err) {
      console.error(err);
      setSettingsError('A network error occurred. Please try again.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDragLogo = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDropLogo = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processLogoFile(file);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processLogoFile(file);
    }
  };

  const processLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setSettingsError('Please upload an image file (PNG, JPG, SVG, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSettingsError('File size is too large. Max limit is 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSettingsLogo(event.target.result as string);
        setSettingsSuccess('School emblem uploaded! Save configurations below to apply.');
        setTimeout(() => setSettingsSuccess(''), 4000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');
    setTeacherSuccess('');
    
    if (!newTeacherName.trim() || !newTeacherEmail.trim() || !newTeacherPassword.trim() || !newTeacherDepartment) {
      setTeacherError('Please fill all required fields including Department.');
      return;
    }
    
    if (newTeacherDepartment === 'Primary' && !newTeacherAssignedClass) {
      setTeacherError('Please assign a class for the Primary teacher.');
      return;
    }
    
    if (newTeacherDepartment === 'JHS' && newTeacherIsClassTeacher && !newTeacherAssignedClass) {
      setTeacherError('Please assign a class for the JHS Class Teacher.');
      return;
    }

    if (newTeacherDepartment === 'JHS' && !newTeacherSubject) {
      setTeacherError('Please select a subject for the JHS teacher.');
      return;
    }
    
    setCreatingTeacher(true);
    try {
      const res = await fetch('/api/v1/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: school.id,
          fullName: newTeacherName.trim(),
          email: newTeacherEmail.trim(),
          password: newTeacherPassword,
          department: newTeacherDepartment,
          subject: newTeacherSubject.trim() || 'General',
          isClassTeacher: newTeacherIsClassTeacher,
          assignedClass: newTeacherAssignedClass.trim() || null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTeacherSuccess(`Account for teacher ${data.fullName} created successfully!`);
        setNewTeacherName('');
        setNewTeacherEmail('');
        setNewTeacherPassword('');
        setNewTeacherDepartment('');
        setNewTeacherSubject('');
        setNewTeacherAssignedClass('');
        setNewTeacherIsClassTeacher(false);
        // Refresh teachers list
        setTeachers(prev => [...prev, data]);
      } else {
        setTeacherError(data.error || 'Failed to create teacher account.');
      }
    } catch (err) {
      setTeacherError('Failed to register teacher due to a connection issue.');
    } finally {
      setCreatingTeacher(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const csvRows = [
      ['Admission No', 'Full Name', 'DOB', 'Gender', 'Class', 'Boarding', 'Guardian', 'Phone', 'Fees Total (GHS)', 'Fees Paid (GHS)', 'Payment Status', 'Status'],
      ...students.map(s => [
        s.admissionNo,
        s.fullName,
        s.dob,
        s.gender,
        s.classLevel,
        s.boardingStatus,
        s.guardianName,
        s.guardianPhone,
        s.feeTotal,
        s.feePaid,
        s.paymentStatus,
        s.admissionStatus
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_roster_${school.id}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic Metrics calculations
  const totalStudents = students.length + offlineQueue.length;
  const admittedStudents = students.filter(s => s.admissionStatus === 'Admitted').length + offlineQueue.length;
  const pendingStudents = students.filter(s => s.admissionStatus === 'Pending').length;
  
  const totalFeesExpected = students.reduce((acc, s) => acc + s.feeTotal, 0) + offlineQueue.reduce((acc, s) => acc + s.feeTotal, 0);
  const totalFeesPaid = payments.filter(p => p.status === 'Success').reduce((acc, p) => acc + p.amount, 0);
  const totalFeesOutstanding = totalFeesExpected - totalFeesPaid;

  const mCount = students.filter(s => s.gender === 'Male').length + offlineQueue.filter(s => s.gender === 'Male').length;
  const fCount = students.filter(s => s.gender === 'Female').length + offlineQueue.filter(s => s.gender === 'Female').length;

  const boardingCount = students.filter(s => s.boardingStatus === 'Boarding').length + offlineQueue.filter(s => s.boardingStatus === 'Boarding').length;
  const dayCount = students.filter(s => s.boardingStatus === 'Day').length + offlineQueue.filter(s => s.boardingStatus === 'Day').length;

  // Filter student registry
  const filteredStudents = [...offlineQueue, ...students].filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          String(s.guardianPhone).includes(searchQuery);
    const matchesClass = classFilter === 'All' ? true : s.classLevel === classFilter;
    const matchesStatus = statusFilter === 'All' ? true : s.admissionStatus === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });


  // Helper to adjust hex color brightness
  const adjustColor = (color: string, amount: number) => {
    if (!color || !color.startsWith('#')) return color;
    return '#' + color.replace(/^#/, '').replace(/../g, c => ('0'+Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2));
  };

  const dynamicStyles = school.primaryColor ? {
    '--color-brand-green-700': school.primaryColor,
    '--color-brand-green-800': adjustColor(school.primaryColor, -20),
    '--color-brand-green-900': adjustColor(school.primaryColor, -40),
  } as React.CSSProperties : {};

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-800 flex flex-col font-sans text-slate-800 dark:text-slate-200" style={dynamicStyles}>

      
      {/* Upper color indicator stripe representing the Ghanaian flag */}
      <div className="h-1.5 w-full flex no-print">
        <div className="h-full bg-red-600 flex-1"></div>
        <div className="h-full bg-amber-400 flex-1"></div>
        <div className="h-full bg-green-700 flex-1"></div>
      </div>

      {/* Connectivity Status Banner */}
      <div className={`py-2 px-4 flex flex-wrap items-center justify-between border-b no-print text-xs font-medium transition ${
        isOffline 
          ? 'bg-red-50 border-red-100 text-red-900' 
          : 'bg-brand-green-50 border-brand-green-100 text-brand-green-900'
      }`}>
        <div className="flex items-center gap-2">
          {isOffline ? (
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span className="font-semibold uppercase font-display tracking-wide">Offline Local Sandbox Mode Enabled</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-green-600"></span>
              <span className="font-semibold uppercase font-display tracking-wide">Connected to GEDA Cloud servers</span>
            </div>
          )}
          {offlineQueue.length > 0 && (
            <span className="bg-amber-400 text-slate-950 dark:text-white font-semibold px-2 py-0.5 rounded-full text-[10px]">
              {offlineQueue.length} record{offlineQueue.length > 1 ? 's' : ''} waiting to Sync
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {offlineQueue.length > 0 && !isOffline && (
            <button
              onClick={handleOfflineSync}
              disabled={isSyncing}
              className="bg-brand-green-700 hover:bg-brand-green-800 text-white font-semibold py-1 px-3 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Offline Cache Now
            </button>
          )}

          <div className="flex items-center gap-2 border-l border-slate-300 dark:border-slate-600 pl-3">
            <span className="text-slate-500 dark:text-slate-400">Test Network Break:</span>
            <button
              onClick={handleOfflineToggle}
              className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider cursor-pointer border transition ${
                isOffline
                  ? 'bg-brand-green-700 text-white border-brand-green-800'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-red-600 hover:bg-red-50'
              }`}
            >
              {isOffline ? 'Simulate Reconnect' : 'Trigger Offline Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 h-14 px-4 flex items-center justify-between gap-3 no-print shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-white p-1.5 rounded flex items-center justify-center overflow-hidden h-9 w-9 shadow-inner" style={{ backgroundColor: school.primaryColor || '#0f172a' }}>
            {school.logo ? (
              <img src={school.logo} alt="Emblem" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <SchoolIcon className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <div>
            <h1 className="font-display font-bold text-sm text-slate-950 dark:text-white flex items-center gap-2">
              {role === 'Teacher' ? `${getGreeting()}, ${user?.fullName || 'Teacher'}` : school.name}
              {role !== 'Teacher' && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">{school.region}</span>}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {role === 'Teacher' ? school.name : `District: ${school.district} | Multi-tenant space`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Simulation Role-Based Switcher */}
          {isDemo && (
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded border border-slate-200 dark:border-slate-700/60 hidden sm:flex items-center gap-1">
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1.5">Role:</span>
              {(['Admin', 'Staff', 'Teacher'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => onRoleChange(r)}
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                    role === r
                      ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white py-1.5 px-2.5 rounded transition text-xs font-semibold cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Log Out Portal</span>
          </button>
        </div>
      </header>

      {/* Content Body Grid */}
      <div className="flex-1 grid md:grid-cols-12 relative">
        
        {/* Navigation Sidebar Drawer */}
        {isSidebarOpen && (
          <>
            {/* Mobile backdrop overlay */}
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden no-print"
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside 
              className="fixed md:relative inset-y-0 left-0 z-50 w-64 md:w-auto text-white flex flex-col border-r border-slate-800 p-2 space-y-1 no-print md:col-span-3 lg:col-span-2 shadow-2xl md:shadow-none" 
              style={{ backgroundColor: school.primaryColor || '#0f172a' }}
            >
          <div className="pb-2 border-b border-slate-800 mb-3 px-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Management</span>
            <span className="text-[11px] font-medium text-slate-400 block mt-0.5">Logged as <b className="text-white">{role}</b></span>
          </div>

          {school.accessLevel !== 'Restricted' && (
            <>
              <button
                onClick={() => handleTabChange('overview')}
                className={`${role === 'Teacher' ? 'hidden ' : ''}w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Metrics Center</span>
              </button>
              <button
                onClick={() => handleTabChange('analytics')}
                className={`${role === 'Teacher' ? 'hidden ' : ''}w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>School Analytics</span>
              </button>

              <button
                onClick={() => handleTabChange('roster')}
                className={`${role === 'Teacher' ? 'hidden ' : ''}w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                  activeTab === 'roster'
                    ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Student Registry</span>
              </button>
              <button
                onClick={() => handleTabChange('classes')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                  activeTab === 'classes'
                    ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Classes</span>
              </button>
              <button
                onClick={() => handleTabChange('academic')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                  activeTab === 'academic'
                    ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Award className="h-4 w-4" />
                <span>Academic Center</span>
              </button>

              {role === 'Admin' && (
                <button
                  onClick={() => handleTabChange('transcripts')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                    activeTab === 'transcripts'
                      ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Transcripts</span>
                </button>
              )}
              <button
                onClick={() => handleTabChange('attendance')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                  activeTab === 'attendance'
                    ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Mark Attendance</span>
              </button>

              <button
                onClick={() => handleTabChange('promotions')}
                className={`${role === 'Teacher' ? 'hidden ' : ''}w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                  activeTab === 'promotions'
                    ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Promotions</span>
              </button>

              <button
                onClick={() => handleTabChange('past-students')}
                className={`${role === 'Teacher' ? 'hidden ' : ''}w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                  activeTab === 'past-students'
                    ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                <span>Past Students</span>
              </button>

              {role === 'Admin' && (
                <button
                  onClick={() => handleTabChange('teachers')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                    activeTab === 'teachers'
                      ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Teacher Accounts</span>
                </button>
              )}
            </>
          )}

          {role !== 'Teacher' && (
            <button
              onClick={() => handleTabChange('register')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Admissions Portal</span>
            </button>
          )}

          {school.accessLevel !== 'Restricted' && role === 'Admin' && (
            <button
              onClick={() => handleTabChange('settings')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>School Settings</span>
            </button>
          )}

          {role === 'Admin' && (
            <button
              onClick={() => handleTabChange('billing')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                activeTab === 'billing'
                  ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Billing (Blaze)</span>
            </button>
          )}

          {school.accessLevel !== 'Restricted' && (
            <>
              {role !== 'Teacher' && <div className="pt-2 pb-1 px-2"><span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Financials</span></div>}

              <button
                onClick={() => handleTabChange('payments')}
                className={`${role === 'Teacher' ? 'hidden ' : ''}w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                  activeTab === 'payments'
                    ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>MoMo Ledger</span>
              </button>

              {role !== 'Teacher' && <div className="pt-2 pb-1 px-2"><span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">System</span></div>}

              <button
                onClick={() => handleTabChange('backups')}
                className={`${role === 'Teacher' ? 'hidden ' : ''}w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                  activeTab === 'backups'
                    ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Database className="h-4 w-4" />
                <span>Security Backups</span>
              </button>

              <button
                onClick={() => handleTabChange('api')}
                className={`${role === 'Teacher' ? 'hidden ' : ''}w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                  activeTab === 'api'
                    ? 'bg-amber-500 text-slate-950 dark:text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Terminal className="h-4 w-4" />
                <span>SIS API Sandbox</span>
              </button>
            </>
          )}

          <div className="pt-4 block">
            <div className="bg-slate-950 border border-slate-800 rounded p-2 text-[10px] text-slate-400 leading-relaxed">
              <span className="font-semibold block text-slate-200 mb-0.5">GES Data Standard v1.2</span>
              This portal encrypts multi-tenant student identities and enforces local offline caches.
            </div>
          </div>
        </aside>
          </>
        )}
        {/* Dashboard Panels */}
        <main className={`col-span-12 ${isSidebarOpen ? 'md:col-span-9 lg:col-span-10' : 'md:col-span-12'} p-4 space-y-4 overflow-y-auto w-full`}>
          
          {/* Notifications Alert Container */}
          {billingNotice && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center justify-between gap-2 text-sm shadow-sm dark:shadow-none no-print mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <span className="font-medium">{billingNotice}</span>
              </div>
              <button 
                onClick={() => handleTabChange('billing')}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
              >
                Go to Billing
              </button>
            </div>
          )}
          {successMsg && (
            <div className="bg-brand-green-50 border border-brand-green-200 text-brand-green-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm shadow-sm dark:shadow-none animate-pulse no-print">
              <CheckCircle2 className="h-5 w-5 text-brand-green-700 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm shadow-sm dark:shadow-none no-print">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW METRICS */}
          {activeTab === 'overview' && role !== 'Teacher' && (
            <div className="space-y-6 fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-950 dark:text-white">Administrative Performance Metrics</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time indicators across Admissions, Mobile Money Ledger, and Sync Status.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-gold-600" />
                  <span>Sync Status: <b className="text-slate-900 dark:text-white">{isOffline ? 'OFFLINE WORKING' : 'SYNCHRONIZED'}</b></span>
                </div>
              </div>

              {/* KPI CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* KPI 1 */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Enrollment</span>
                    <span className="text-3xl font-display font-bold text-slate-950 dark:text-white">{totalStudents}</span>
                    <span className="block text-[10px] text-brand-green-700 font-medium">{admittedStudents} Admitted</span>
                  </div>
                  <div className="bg-brand-green-50 text-brand-green-800 p-3 rounded-xl shrink-0">
                    <Users className="h-6 w-6" />
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Fees Collected</span>
                    <span className="text-2xl font-display font-bold text-brand-green-800">GH₵ {(totalFeesPaid || 0).toLocaleString()}</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">From verified transactions</span>
                  </div>
                  <div className="bg-brand-green-50 text-brand-green-800 p-3 rounded-xl shrink-0">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding Arrears</span>
                    <span className="text-2xl font-display font-bold text-red-700">GH₵ {(totalFeesOutstanding || 0).toLocaleString()}</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">Boarding & Tuition dues</span>
                  </div>
                  <div className="bg-red-50 text-red-800 p-3 rounded-xl shrink-0">
                    <CreditCard className="h-6 w-6" />
                  </div>
                </div>

                {/* KPI 4 */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Offline Pending Cache</span>
                    <span className="text-3xl font-display font-bold text-amber-500">{offlineQueue.length}</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">Awaiting sync</span>
                  </div>
                  <div className={`p-3 rounded-xl shrink-0 ${offlineQueue.length > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <WifiOff className="h-6 w-6" />
                  </div>
                </div>

              </div>

              {/* DYNAMIC SVG CHARTS (High Crafts, Zero-dependency, pure and error-free) */}
              <div className="grid lg:grid-cols-12 gap-6">
                
                {/* Chart 1: Enrollment Distribution */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none space-y-4">
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 dark:text-white">Weekly Student Intake (Academic Timeline)</h3>
                    <p className="text-slate-400 text-xs">Simulated linear index of admissions plotted against real-time registers.</p>
                  </div>

                  {/* Beautiful SVG Area Line Graph */}
                  <div className="h-64 w-full relative flex items-end">
                    <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#15803d" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#15803d" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                      <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                      <line x1="0" y1="140" x2="500" y2="140" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />

                      {/* Area Fill */}
                      <path 
                        d="M 10 180 Q 100 130 180 150 T 300 80 T 420 50 T 490 30 L 490 200 L 10 200 Z" 
                        fill="url(#chartGrad)" 
                      />

                      {/* Line Path */}
                      <path 
                        d="M 10 180 Q 100 130 180 150 T 300 80 T 420 50 T 490 30" 
                        fill="none" 
                        stroke="#15803d" 
                        strokeWidth="3.5" 
                        strokeLinecap="round"
                      />

                      {/* Line Dots */}
                      <circle cx="10" cy="180" r="5" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
                      <circle cx="180" cy="150" r="5" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
                      <circle cx="300" cy="80" r="5" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
                      <circle cx="420" cy="50" r="5" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
                      <circle cx="490" cy="30" r="5" fill="#15803d" stroke="#fff" strokeWidth="2" />
                    </svg>

                    {/* X Axis Labels */}
                    <div className="absolute bottom-0 inset-x-0 flex justify-between px-2 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>June W1</span>
                      <span>June W3</span>
                      <span>July W1</span>
                      <span>July W3</span>
                      <span>August (Est)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-brand-green-700"></span> Registered Intake
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-brand-gold-500"></span> MoMo Validation Steps
                    </span>
                  </div>
                </div>

                {/* Chart 2: Student Attributes */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none space-y-4">
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 dark:text-white">Enrollment & Gender Dynamics</h3>
                    <p className="text-slate-400 text-xs">Aesthetic ratio breakups of registered school students.</p>
                  </div>

                  <div className="space-y-5 pt-2">
                    {/* Enrollment Status Tracker Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>Enrollment System: Day System (100%)</span>
                        <span className="text-amber-600">100% Day Students</span>
                      </div>
                      <div className="h-4 w-full bg-amber-500 rounded-full overflow-hidden">
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>● Day Tuition: GH₵ 1,200/term</span>
                        <span>● Ghanaian Basic Standard</span>
                      </div>
                    </div>

                    {/* Gender Status Tracker Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>Gender Balance: {mCount} Male / {fCount} Female</span>
                        <span className="text-blue-700">{totalStudents > 0 ? Math.round((mCount / totalStudents) * 100) : 0}% Male</span>
                      </div>
                      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="bg-blue-600 h-full" style={{ width: `${totalStudents > 0 ? (mCount / totalStudents) * 100 : 0}%` }}></div>
                        <div className="bg-pink-500 h-full" style={{ width: `${totalStudents > 0 ? (fCount / totalStudents) * 100 : 0}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>● Male Intake</span>
                        <span>● Female Intake</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    💡 <b>GES Standard Ratio Guidance:</b> {school.name} recommends maintaining balanced class metrics. Ensure class sizes remain under national municipal safety ceilings of 35-40 pupils.
                  </div>
                </div>

              </div>

              {/* BOTTOM GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  {/* RECENT PAYMENTS LOG BLOCK */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none overflow-hidden h-full">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-slate-950 dark:text-white">Recent verified MoMo Payments Ledger</h3>
                    <p className="text-xs text-slate-400">Secure logs of student fee payments recorded inside this tenant.</p>
                  </div>
                  <button 
                    onClick={() => handleTabChange('payments')} 
                    className="text-xs text-brand-green-700 hover:underline font-semibold cursor-pointer"
                  >
                    Manage Payments Ledger →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-6">Transaction ID</th>
                        <th className="py-3 px-6">Student Code</th>
                        <th className="py-3 px-6">Amount Verified</th>
                        <th className="py-3 px-6">Method Gateway</th>
                        <th className="py-3 px-6">Timestamp</th>
                        <th className="py-3 px-6">Status Indicator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 dark:text-slate-300">
                      {payments.slice(0, 3).map((pay) => {
                        const studName = students.find(s => s.id === pay.studentId)?.fullName || 'External API Student';
                        return (
                          <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950/50">
                            <td className="py-3.5 px-6 font-mono font-semibold text-slate-900 dark:text-white text-xs">{pay.transactionId}</td>
                            <td className="py-3.5 px-6">
                              <div>
                                <span className="font-medium text-slate-900 dark:text-white">{studName}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-6 font-semibold text-brand-green-800">GH₵ {(pay.amount || 0).toLocaleString()}</td>
                            <td className="py-3.5 px-6 text-xs">{pay.method}</td>
                            <td className="py-3.5 px-6 text-slate-400 text-xs">{new Date(pay.timestamp).toLocaleString()}</td>
                            <td className="py-3.5 px-6">
                              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span> Verified
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {payments.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 text-xs font-mono">No payment records logged in this school session.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1 h-[400px] lg:h-auto">
                <NewsFeed />
              </div>
            </div>

            </div>
          )}

          {/* TAB 2: STUDENT REGISTRY */}
          {activeTab === 'roster' && (
            <div className="space-y-6 fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-950 dark:text-white">Integrated Student Registry</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Review registrations, print standard GES letters, or manage payment logs.</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    Export CSV Register
                  </button>
                  {role !== 'Teacher' && (
                    <button
                      onClick={() => handleTabChange('register')}
                      className="flex items-center gap-1.5 bg-brand-green-700 hover:bg-brand-green-800 text-white py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Student Registration
                    </button>
                  )}
                </div>
              </div>

              {/* SEARCH & FILTERS BOX */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="relative sm:col-span-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by Name or No..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green-700 focus:bg-white dark:bg-slate-900 text-xs transition"
                  />
                </div>

                <div>
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-green-700 text-xs"
                  >
                    <option value="All">All Class Levels</option>
                    <option value="Class 1">Class 1</option>
                    <option value="Class 2">Class 2</option>
                    <option value="Class 3">Class 3</option>
                    <option value="Class 4">Class 4</option>
                    <option value="Class 5">Class 5</option>
                    <option value="Class 6">Class 6</option>
                    <option value="JHS 1">JHS 1</option>
                    <option value="JHS 2">JHS 2</option>
                    <option value="JHS 3">JHS 3</option>
                  </select>
                </div>

                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-green-700 text-xs"
                  >
                    <option value="All">All Admission Statuses</option>
                    <option value="Admitted">Admitted</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* ROSTER TABLE */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-6">Admission Code</th>
                        <th className="py-3.5 px-6">Student Details</th>
                        <th className="py-3.5 px-6">Class & Boarding</th>
                        <th className="py-3.5 px-6">MoMo Ledger Status</th>
                        <th className="py-3.5 px-6 text-right">Actions Panel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 dark:text-slate-300">
                      {filteredStudents.map((stud) => (
                        <tr key={stud.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950/40">
                          <td className="py-4 px-6">
                            {stud.syncStatus === 'pending' ? (
                              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                <WifiOff className="h-3 w-3 animate-pulse" /> Pending Sync
                              </span>
                            ) : (
                              <span className="font-mono font-semibold text-slate-900 dark:text-white text-xs">{stud.admissionNo}</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <b className="text-slate-900 dark:text-white block font-medium">{stud.fullName}</b>
                              <span className="text-xs text-slate-400 block">Guardian: {stud.guardianName} ({stud.guardianPhone})</span>
                              {(stud.remarks || (stud.sbaScore !== undefined && stud.sbaScore !== null) || (stud.attendancePresent !== undefined && stud.attendancePresent !== null)) && (
                                <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                                  {stud.attendancePresent !== undefined && stud.attendancePresent !== null && (
                                    <span className="bg-blue-50 text-blue-800 border border-blue-100 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                      Att: {stud.attendancePresent}/{stud.attendanceTotal || '?'} ({Math.round((stud.attendancePresent / (stud.attendanceTotal || 1)) * 100)}%)
                                    </span>
                                  )}
                                  {stud.sbaScore !== undefined && stud.sbaScore !== null && (
                                    <span className="bg-indigo-50 text-indigo-800 border border-indigo-100 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                      SBA: {stud.sbaScore}/30
                                    </span>
                                  )}
                                  {stud.examScore !== undefined && stud.examScore !== null && (
                                    <span className="bg-purple-50 text-purple-800 border border-purple-100 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                      Exam: {stud.examScore}/70
                                    </span>
                                  )}
                                  {stud.remarks && (
                                    <span className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 px-1.5 py-0.5 rounded text-[10px] italic max-w-[200px] truncate" title={stud.remarks}>
                                      "{stud.remarks}"
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-semibold">{stud.classLevel}</span>
                              <span className="block text-[10px] text-slate-400">Day Student</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  stud.paymentStatus === 'Paid' ? 'bg-green-600' : stud.paymentStatus === 'Partial' ? 'bg-amber-500' : 'bg-red-500'
                                }`}></span>
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{stud.paymentStatus}</span>
                              </div>
                              <span className="block text-[10px] text-slate-400">Paid GH₵ {(stud.feePaid || 0).toLocaleString()} / {(stud.feeTotal || 0).toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* View Admission Letter */}
                              <button
                                onClick={() => {
                                  setLetterStudent(stud);
                                  setLetterCustomNotes(stud.remarks || '');
                                }}
                                className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 py-1.5 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition shadow-sm dark:shadow-none"
                              >
                                <FileText className="h-3.5 w-3.5 text-brand-green-700" />
                                <span>GES Admission Letter</span>
                              </button>

                              {/* Teacher/Admin academic record and attendance */}
                              {(role === 'Teacher' || role === 'Admin') && (
                                <button
                                  onClick={() => {
                                    setGradeStudent(stud);
                                    setTempRemarks(stud.remarks || '');
                                    setTempSbaScore(stud.sbaScore !== undefined && stud.sbaScore !== null ? String(stud.sbaScore) : '');
                                    setTempExamScore(stud.examScore !== undefined && stud.examScore !== null ? String(stud.examScore) : '');
                                    setTempAttPresent(stud.attendancePresent !== undefined && stud.attendancePresent !== null ? String(stud.attendancePresent) : '');
                                    setTempAttTotal(stud.attendanceTotal !== undefined && stud.attendanceTotal !== null ? String(stud.attendanceTotal) : '');
                                  }}
                                  className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 dark:text-white py-1.5 px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition"
                                >
                                  <Award className="h-3.5 w-3.5" />
                                  <span>Academic & Attendance</span>
                                </button>
                              )}
                              {role === 'Admin' && (
                                <>
                                  <button
                                  onClick={() => setHistoryStudent(stud)}
                                  className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950 text-amber-700 py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition shadow-sm dark:shadow-none"
                                  title="Academic History"
                                >
                                  <BookOpen className="h-3.5 w-3.5" />
                                  <span>History</span>
                                </button>
                                <button
                                    onClick={() => setEditingStudent(stud)}
                                    className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition shadow-sm dark:shadow-none"
                                    title="Edit Student"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setIsDeletingStudent(stud.id)}
                                    className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 py-1.5 px-2.5 border border-red-200 rounded-lg text-xs font-semibold cursor-pointer transition shadow-sm dark:shadow-none"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}

                              {/* Pay Fees shortcut */}
                              {role !== 'Teacher' && stud.paymentStatus !== 'Paid' && (
                                <button
                                  onClick={() => {
                                    setSelectedStudentId(stud.id);
                                    handleTabChange('payments');
                                  }}
                                  className="inline-flex items-center gap-1 bg-brand-gold-50 hover:bg-brand-gold-100 text-brand-gold-700 py-1.5 px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition border border-brand-gold-200/50"
                                >
                                  <DollarSign className="h-3.5 w-3.5" />
                                  <span>Log Payment</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-mono">No student records found matching active filter.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ANALYTICS */}
          {activeTab === 'analytics' && role !== 'Teacher' && (
            <AnalyticsCenter school={school} students={[...offlineQueue, ...students]} isOffline={isOffline} />
          )}

          {/* TAB: CLASSES */}
          {activeTab === 'classes' && (
            <div className="space-y-6 fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-950 dark:text-white">Classes</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">View students organized by their respective class levels.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from(new Set([...offlineQueue, ...students].map(s => s.classLevel))).sort().map(className => {
                  const classStudents = [...offlineQueue, ...students].filter(s => s.classLevel === className);
                  if (classStudents.length === 0) return null;
                  
                  return (
                    <div key={className} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-none flex flex-col">
                      <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
                        <h3 className="font-display font-bold text-slate-900 dark:text-white">{className}</h3>
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">
                          {classStudents.length} Students
                        </span>
                      </div>
                      <div className="p-0 overflow-y-auto max-h-[400px]">
                        <ul className="divide-y divide-slate-100">
                          {classStudents.map(student => (
                            <li key={student.id} className="px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950 transition flex justify-between items-center group">
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{student.fullName}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">{student.gender} • {student.boardingStatus}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-400 group-hover:hidden">{student.admissionNo}</span>
                                {role === 'Admin' && (
                                  <div className="hidden group-hover:flex items-center gap-1">
                                    <button
                                      onClick={() => setHistoryStudent(student)}
                                      className="p-1 text-slate-400 hover:text-amber-700 hover:bg-slate-200 dark:bg-slate-700 rounded transition cursor-pointer"
                                      title="Academic History"
                                    >
                                      <BookOpen className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => setEditingStudent(student)}
                                      className="p-1 text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-slate-700 rounded transition cursor-pointer"
                                      title="Edit Student"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => setIsDeletingStudent(student.id)}
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                      title="Delete Student"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: ACADEMIC CENTER */}
          {activeTab === 'academic' && (
            <AcademicCenter school={school} students={[...offlineQueue, ...students]} isOffline={isOffline} user={user} role={role} />
          )}

          {/* TAB: TRANSCRIPTS */}
          {activeTab === 'transcripts' && (
            <StudentTranscripts school={school} students={[...offlineQueue, ...students]} />
          )}

          
          {/* TAB: ATTENDANCE TRACKER */}
          {activeTab === 'attendance' && (
            <AttendanceTracker school={school} students={[...offlineQueue, ...students]} isOffline={isOffline} user={user} role={role} />
          )}

          
          {/* TAB: PROMOTIONS */}
          {activeTab === 'promotions' && (
            <PromotionsManager 
              school={school} 
              students={[...offlineQueue, ...students]} 
              onPromote={async (studentIds, targetClass) => {
                try {
                  const res = await fetch('/api/v1/students/promote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentIds, targetClass })
                  });
                  if (res.ok) {
                    alert('Students promoted successfully!');
                    fetchData();
                  } else {
                    alert('Failed to promote students.');
                  }
                } catch (err) {
                  console.error(err);
                  alert('Error promoting students. Check connection.');
                }
              }} 
            />
          )}

          {/* TAB: PAST STUDENTS */}
          {activeTab === 'past-students' && (
            <PastStudents school={school} students={[...offlineQueue, ...students]} />
          )}

          {/* TAB 3: ADMISSIONS PORTAL (REGISTER FORM) */}
          {activeTab === 'register' && (
            <div className="max-w-3xl mx-auto space-y-6 fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-950 dark:text-white">Add New Student Registration</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Offline-ready digital registrar portal. Assign board status and fee schemes.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={downloadExcelTemplate}
                    className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold py-2 px-4 rounded-xl transition"
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    Download Template
                  </button>
                  <label className="flex items-center gap-2 bg-brand-green-700 hover:bg-brand-green-800 text-white text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer transition">
                    <FileText className="h-4 w-4" />
                    Bulk Upload Excel
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleBulkUpload} />
                  </label>
                </div>
              </div>

              {role === 'Teacher' ? (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
                  <ShieldCheck className="h-12 w-12 text-red-500 mx-auto" />
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Access Restricted</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                    Your account does not hold Administrator or Registrar privileges. Student registration and admission provisioning requires **Admin** or **Staff** credentials.
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm dark:shadow-none">
                  <form onSubmit={handleRegisterStudent} className="space-y-6">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-2">Student Identity Core</span>
                    
                    <div className="grid sm:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Student Full Name *</label>
                        <input
                          type="text"
                          placeholder="Firstname Middlename Surname"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green-700 focus:bg-white dark:bg-slate-900 text-xs transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Date of Birth *</label>
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green-700 focus:bg-white dark:bg-slate-900 text-xs transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Gender *</label>
                        <div className="grid grid-cols-2 gap-3">
                          {['Male', 'Female'].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setGender(g as 'Male' | 'Female')}
                              className={`py-3 px-4 border rounded-xl font-medium text-xs transition cursor-pointer ${
                                gender === g
                                  ? 'bg-brand-green-50 border-brand-green-600 text-brand-green-800'
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Class Level / Form *</label>
                        <select
                          value={classLevel}
                          onChange={(e) => setClassLevel(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green-700 text-xs transition appearance-none"
                        >
                          <option value="Class 1">Class 1</option>
                          <option value="Class 2">Class 2</option>
                          <option value="Class 3">Class 3</option>
                          <option value="Class 4">Class 4</option>
                          <option value="Class 5">Class 5</option>
                          <option value="Class 6">Class 6</option>
                          <option value="JHS 1">JHS 1 (Junior High 1)</option>
                          <option value="JHS 2">JHS 2 (Junior High 2)</option>
                          <option value="JHS 3">JHS 3 (Junior High 3)</option>
                        </select>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-2 pt-4">Fees Allocation</span>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Boarding Status *</label>
                        <select
                          value={boardingStatus}
                          onChange={(e) => setBoardingStatus(e.target.value as 'Day' | 'Boarding')}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green-700 text-xs transition appearance-none"
                        >
                          <option value="Day">Day</option>
                          <option value="Boarding">Boarding</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Total Term Fees (GH₵) *</label>
                        <input
                          type="number"
                          placeholder={boardingStatus === 'Boarding' ? 'e.g. 2500' : 'e.g. 1200'}
                          value={feeTotal}
                          onChange={(e) => setFeeTotal(e.target.value ? Number(e.target.value) : '')}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green-700 focus:bg-white dark:bg-slate-900 text-xs transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Academic Remarks (Optional)</label>
                        <textarea
                          placeholder="Notes about school placement, previous aggregates, etc..."
                          value={studentRemarks}
                          onChange={(e) => setStudentRemarks(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green-700 focus:bg-white dark:bg-slate-900 text-xs transition"
                        />
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-2 pt-4">Parent / Guardian Information</span>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Guardian Official Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Kwabena Mensah"
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green-700 focus:bg-white dark:bg-slate-900 text-xs transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Mobile Contact Number (Momo enabled) *</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                            <Phone className="h-4 w-4" />
                          </span>
                          <input
                            type="tel"
                            placeholder="e.g. 0244123456"
                            value={guardianPhone}
                            onChange={(e) => setGuardianPhone(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green-700 focus:bg-white dark:bg-slate-900 text-xs transition"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-2 pt-4">Student Identity & Picture</span>
                    <div className="flex items-center gap-6">
                      <div className="shrink-0 w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                        {passportPicture ? (
                          <img src={passportPicture} alt="Passport Preview" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-8 w-8 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Upload Passport Picture</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-green-50 file:text-brand-green-700 hover:file:bg-brand-green-100 transition cursor-pointer"
                        />
                        <p className="mt-2 text-[10px] text-slate-400">Supported formats: JPG, PNG. Image will be compressed automatically. Max 250x250 pixels recommended.</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal max-w-md">
                        {isOffline 
                          ? '⚠️ System currently working Offline. Records are locally buffered into browser IndexDB state.' 
                          : '🚀 Live connection active. Creating a new student generates custom registration numbers automatically.'
                        }
                      </p>
                      <button
                        type="submit"
                        className="bg-brand-green-700 hover:bg-brand-green-800 text-white font-medium py-3 px-6 rounded-xl transition shadow-md cursor-pointer text-xs"
                      >
                        {isOffline ? 'Cache Offline Registration' : 'Verify & Register Student'}
                      </button>
                    </div>

                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MOMO PAYMENTS LEDGER */}
          {activeTab === 'payments' && (
            <div className="space-y-6 fade-in">
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-950 dark:text-white">Localized Payment Tracking (Momo Verification)</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Process school term fee installments, boarding expenses, and log SMS transaction keys.</p>
              </div>

              {role === 'Teacher' ? (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
                  <ShieldCheck className="h-12 w-12 text-red-500 mx-auto" />
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Access Restricted</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                    Your account holds academic teacher privileges. Accessing financial ledgers and recording Mobile Money transactions requires **Admin** or **Staff/Registrar** credentials.
                  </p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-12 gap-6">
                  
                  {/* Collect Momo Payments Form */}
                  <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none space-y-5">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h3 className="font-display font-semibold text-slate-900 dark:text-white">Log Mobile Money Payment</h3>
                      <p className="text-slate-400 text-xs">Instantly process deposits via Ghanaian network telecom gateways.</p>
                    </div>

                    {paymentSuccess && (
                      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-xs flex items-center gap-1.5 font-medium animate-pulse">
                        <CheckCircle2 className="h-5 w-5 text-green-700" />
                        <span>Momo transaction confirmed! Student's balance and admission certificate updated successfully.</span>
                      </div>
                    )}

                    {paymentError && (
                      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs">
                        {paymentError}
                      </div>
                    )}

                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Select Student *</label>
                        <select
                          value={selectedStudentId}
                          onChange={(e) => {
                            setSelectedStudentId(e.target.value);
                            const stud = students.find(s => s.id === e.target.value);
                            if (stud) setPaymentPhone(stud.guardianPhone);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green-700 text-xs transition"
                          required
                        >
                          <option value="">-- Choose Admitted Student --</option>
                          {students.filter(s => s.paymentStatus !== 'Paid').map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.fullName} ({s.classLevel} - Owed: GH₵ {((s.feeTotal || 0) - (s.feePaid || 0)).toLocaleString()})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Gateway Provider</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green-700 text-xs"
                          >
                            <option value="MTN MoMo">MTN MoMo</option>
                            <option value="Telecel Cash">Telecel Cash</option>
                            <option value="AT Money">AT Money</option>
                            <option value="Bank">Bank Deposit</option>
                            <option value="Cash">Cash Receipt</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Deposit Amount (GH₵) *</label>
                          <input
                            type="number"
                            placeholder="e.g. 500"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green-700 text-xs"
                            required
                          />
                        </div>
                      </div>

                      {['MTN MoMo', 'Telecel Cash', 'AT Money'].includes(paymentMethod) && (
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Sender Mobile Number (MoMo)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                              <Phone className="h-4 w-4" />
                            </span>
                            <input
                              type="text"
                              placeholder="e.g. 0244112233"
                              value={paymentPhone}
                              onChange={(e) => setPaymentPhone(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green-700 text-xs"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={momoPendingSim}
                        className="w-full bg-brand-green-700 hover:bg-brand-green-800 text-white font-medium py-3 px-4 rounded-xl transition shadow-sm dark:shadow-none flex items-center justify-center gap-2 cursor-pointer text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        <Send className={`h-4 w-4 ${momoPendingSim ? 'animate-bounce' : ''}`} />
                        <span>{momoPendingSim ? 'Executing SMS Telecom hand-shake...' : `Verify & Post GH₵ ${paymentAmount ? parseFloat(paymentAmount).toLocaleString() : '0'} Deposit`}</span>
                      </button>
                    </form>
                  </div>

                  {/* Ledger summary & outstanding fees table */}
                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none space-y-4">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                      <div>
                        <h3 className="font-display font-semibold text-slate-900 dark:text-white">Total verified transactions ledger</h3>
                        <p className="text-slate-400 text-xs">Verify financial inputs across our secure REST nodes.</p>
                      </div>
                      <span className="text-xs bg-brand-green-50 text-brand-green-800 font-semibold px-2 py-0.5 rounded-full font-mono">
                        {payments.length} SUCCESSFUL
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-mono text-[9px] border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Transaction ID</th>
                            <th className="py-2.5 px-3">Student Name</th>
                            <th className="py-2.5 px-3">Deposit</th>
                            <th className="py-2.5 px-3">Provider</th>
                            <th className="py-2.5 px-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-400">
                          {payments.map((p) => {
                            const student = students.find(s => s.id === p.studentId);
                            return (
                              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950/50">
                                <td className="py-2.5 px-3 font-mono font-semibold text-slate-950 dark:text-white">{p.transactionId}</td>
                                <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{student ? student.fullName : 'External API Student'}</td>
                                <td className="py-2.5 px-3 font-semibold text-brand-green-700">GH₵ {(p.amount || 0).toLocaleString()}</td>
                                <td className="py-2.5 px-3">{p.method}</td>
                                <td className="py-2.5 px-3 text-slate-400">{new Date(p.timestamp).toLocaleDateString()}</td>
                              </tr>
                            );
                          })}
                          {payments.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400 font-mono">No payment logs saved.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 5: AUTOMATED BACKUPS */}
          {activeTab === 'backups' && (
            <div className="space-y-6 fade-in">
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-950 dark:text-white">Secure Automated Data Backups</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Download localized snapshots of student enrollment registers. Avoid data-loss from cached local client partitions.</p>
              </div>

              {role !== 'Admin' ? (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
                  <ShieldCheck className="h-12 w-12 text-red-500 mx-auto" />
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Access Restricted</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                    Secure backups, JSON data catalogs, and system-wide recovery logs require **Administrator** access privileges. Staff and Teachers are blocked from direct export tables to safeguard student data privacy.
                  </p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-12 gap-6">
                  
                  {/* Trigger Manual Backup Column */}
                  <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none space-y-5">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h3 className="font-display font-semibold text-slate-900 dark:text-white">Backup Core Controls</h3>
                      <p className="text-slate-400 text-xs">Run physical JSON exports or configure cron simulation rules.</p>
                    </div>

                    <div className="bg-brand-green-50 border border-brand-green-100 p-4 rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold text-brand-green-900 uppercase tracking-wide">GES Backup Compliance Policy</h4>
                      <p className="text-[11px] text-brand-green-800 leading-normal">
                        Ghanaian schools are mandated to back up registry records every 24 hours. Backups contain encryption hashes for student IDs, guardian MoMo ledgers, and transaction signatures.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={handleTriggerBackup}
                        className="w-full bg-brand-green-700 hover:bg-brand-green-800 text-white font-semibold py-3 px-4 rounded-xl transition shadow-sm dark:shadow-none flex items-center justify-center gap-2 cursor-pointer text-xs"
                      >
                        <Database className="h-4 w-4" />
                        Download Direct School JSON Backup
                      </button>
                      <p className="text-[10px] text-slate-400 text-center">Generates encrypted JSON archive with {totalStudents} current student records.</p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Automated backup cron</span>
                      <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                        <span>Simulated Cron Status:</span>
                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold text-[10px]">ACTIVE</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                        <span>Frequency:</span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">Every 24 Hours (Midnight GMT)</span>
                      </div>
                    </div>
                  </div>

                  {/* Backup Logs Column */}
                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none space-y-4">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h3 className="font-display font-semibold text-slate-900 dark:text-white">School Data Snapshot History</h3>
                      <p className="text-slate-400 text-xs">Physical backup records saved within this multi-tenant instance.</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-mono text-[9px] border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">File Name</th>
                            <th className="py-2.5 px-3">Records</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-400">
                          {backups.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950/50">
                              <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-white font-semibold truncate max-w-[150px]">{log.fileName}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{log.recordsCount} pupils</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${log.type === 'Automatic' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                                  {log.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                              <td className="py-2.5 px-3">
                                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {backups.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400 font-mono">No backup checkpoints saved.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 6: DEVELOPER API INTEGRATION */}
          {activeTab === 'api' && (
            <div className="space-y-6 fade-in">
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-950 dark:text-white">Student Information System (SIS) API Integration</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Synchronize external SIS databases, databases, or client routers to your GEDA tenant using secure REST endpoints.</p>
              </div>

              {role !== 'Admin' ? (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
                  <ShieldCheck className="h-12 w-12 text-red-500 mx-auto" />
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Access Restricted</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                    Developer credentials, API key configurations, and external synchronization gateways require **Administrator** access privileges.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* KEY GENERATOR & DOCUMENTATION GRID */}
                  <div className="grid lg:grid-cols-12 gap-6">
                    
                    {/* API Token Key Issuer */}
                    <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none space-y-4">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h3 className="font-display font-semibold text-slate-900 dark:text-white">Security Access Tokens</h3>
                        <p className="text-slate-400 text-xs">Generate bearer tokens to authenticate external REST synchronization nodes.</p>
                      </div>

                      <form onSubmit={handleCreateApiKey} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. WASSCE Sync Client"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green-700 text-xs"
                          required
                        />
                        <button
                          type="submit"
                          className="bg-brand-green-700 hover:bg-brand-green-800 text-white font-semibold py-2 px-3 rounded-xl text-xs cursor-pointer"
                        >
                          Issue Key
                        </button>
                      </form>

                      <div className="space-y-2.5 pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Tokens</span>
                        <div className="space-y-2">
                          {apiKeys.map((key) => (
                            <div key={key.id} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                              <div>
                                <b className="text-slate-900 dark:text-white font-medium block">{key.name}</b>
                                <code className="text-[10px] text-brand-green-800 font-mono select-all bg-brand-green-50/50 px-1.5 py-0.5 rounded">{key.token}</code>
                              </div>
                              <div className="text-right">
                                {key.status === 'Active' ? (
                                  <button
                                    onClick={() => handleRevokeKey(key.id)}
                                    className="text-[10px] text-red-600 font-bold uppercase hover:underline cursor-pointer"
                                  >
                                    Revoke
                                  </button>
                                ) : (
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Revoked</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {apiKeys.length === 0 && (
                            <p className="text-slate-400 text-xs font-mono">No API keys registered. Enter a client description above to issue your first credential.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* REST Endpoints documentation */}
                    <div className="lg:col-span-7 bg-slate-900 text-slate-300 p-6 rounded-3xl border border-slate-800 shadow-sm dark:shadow-none space-y-4">
                      <div>
                        <span className="bg-brand-gold-500 text-slate-950 dark:text-white font-semibold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-display inline-block">GEDA REST SPEC v1</span>
                        <h3 className="font-display font-semibold text-white text-lg mt-2">Active Integration Nodes</h3>
                        <p className="text-slate-400 text-xs">Authorize external systems to inject registrations or download current student registers securely.</p>
                      </div>

                      <div className="space-y-3 font-mono text-[11px]">
                        {/* GET Endpoint */}
                        <div className="bg-slate-800/80 p-3 rounded-xl space-y-1.5 border border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded text-[9px]">GET</span>
                            <span className="text-white font-bold">/api/v1/sis/students</span>
                          </div>
                          <p className="text-slate-400 text-[10px]">Retrieves all student registers matching this tenant's ID.</p>
                        </div>

                        {/* POST Endpoint */}
                        <div className="bg-slate-800/80 p-3 rounded-xl space-y-1.5 border border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="bg-green-600 text-white font-bold px-1.5 py-0.5 rounded text-[9px]">POST</span>
                            <span className="text-white font-bold">/api/v1/sis/students</span>
                          </div>
                          <p className="text-slate-400 text-[10px]">Creates an admitted pupil record and returns an automated Admission Code.</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* LIVE API SANDBOX RUNNER */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none space-y-5">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h3 className="font-display font-semibold text-slate-900 dark:text-white">Interactive API Testing Terminal</h3>
                      <p className="text-slate-400 text-xs">Test real REST HTTP requests hitting your Express server database instantly inside this sandbox window.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      
                      {/* Sandbox Inputs */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Request Method</label>
                            <select
                              value={sandboxMethod}
                              onChange={(e) => setSandboxMethod(e.target.value as 'GET' | 'POST')}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-200 font-mono text-xs"
                            >
                              <option value="GET">GET</option>
                              <option value="POST">POST</option>
                            </select>
                          </div>

                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Authorization Bearer Token</label>
                            <select
                              value={sandboxToken}
                              onChange={(e) => setSandboxToken(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-200 font-mono text-xs"
                            >
                              {apiKeys.filter(k => k.status === 'Active').map(k => (
                                <option key={k.id} value={k.token}>{k.name} ({k.token.slice(0, 15)}...)</option>
                              ))}
                              {apiKeys.filter(k => k.status === 'Active').length === 0 && (
                                <option value="">-- No Active API Token Found --</option>
                              )}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">API Endpoint</label>
                          <input
                            type="text"
                            readOnly
                            value={`http://0.0.0.0:3000/api/v1/sis/students`}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-500 dark:text-slate-400 font-mono text-xs cursor-not-allowed"
                          />
                        </div>

                        {sandboxMethod === 'POST' && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">JSON Payload Body</label>
                            <textarea
                              rows={5}
                              value={sandboxPostData}
                              onChange={(e) => setSandboxPostData(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green-700"
                            />
                          </div>
                        )}

                        <button
                          onClick={handleRunSandbox}
                          disabled={sandboxLoading || !sandboxToken}
                          className="w-full bg-brand-green-700 hover:bg-brand-green-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                        >
                          {sandboxLoading ? 'Executing Node Fetch...' : `Send Sandbox REST Call`}
                        </button>
                      </div>

                      {/* Sandbox Outputs */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Live Server JSON Response</label>
                        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 h-[260px] overflow-auto flex flex-col font-mono text-[11px]">
                          {sandboxResponse ? (
                            <pre className="text-emerald-400 whitespace-pre-wrap">{JSON.stringify(sandboxResponse, null, 2)}</pre>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400 italic m-auto">Click "Send Sandbox REST Call" to execute real HTTP request against the Express backend and print outcomes here.</span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB: TEACHER MANAGEMENT */}
          {activeTab === 'teachers' && (
            <div className="space-y-6 fade-in">
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-950 dark:text-white">Teacher Management Center</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Create and authorize school Teacher accounts. Registered teachers can record student attendance, update WASSCE SBA, and manage final grades.</p>
              </div>

              {role !== 'Admin' ? (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
                  <ShieldCheck className="h-12 w-12 text-red-500 mx-auto" />
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Access Restricted</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                    Only the **Administrator** can provision teacher credential accounts. Please contact the administrator.
                  </p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-12 gap-6">
                  {/* Create Teacher Form */}
                  <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none space-y-4">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h3 className="font-display font-semibold text-slate-900 dark:text-white">Provision Teacher Credentials</h3>
                      <p className="text-slate-400 text-xs">Register official staff credentials. They can immediately log in as Teachers.</p>
                    </div>

                    {teacherError && (
                      <div className="bg-red-50 text-red-800 border border-red-200 px-3 py-2 rounded text-xs">
                        {teacherError}
                      </div>
                    )}

                    {teacherSuccess && (
                      <div className="bg-green-50 text-green-800 border border-green-200 px-3 py-2 rounded text-xs font-semibold">
                        {teacherSuccess}
                      </div>
                    )}

                    <form onSubmit={handleCreateTeacher} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Teacher Full Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Ama Boatemaa"
                          value={newTeacherName}
                          onChange={(e) => setNewTeacherName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Email Address *</label>
                        <input
                          type="email"
                          placeholder="e.g. ama.boatemaa@geda.edu.gh"
                          value={newTeacherEmail}
                          onChange={(e) => setNewTeacherEmail(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Default Password *</label>
                        <input
                          type="password"
                          placeholder="•••••••• (minimum 6 characters)"
                          value={newTeacherPassword}
                          onChange={(e) => setNewTeacherPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                          minLength={6}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Department *</label>
                          <select
                            value={newTeacherDepartment}
                            onChange={(e) => {
                              setNewTeacherDepartment(e.target.value as 'Primary' | 'JHS');
                              setNewTeacherSubject(''); // Reset subject when changing department
                              setNewTeacherAssignedClass(''); // Reset class when changing department
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                            required
                          >
                            <option value="">Select Department...</option>
                            <option value="Primary">Primary</option>
                            <option value="JHS">JHS</option>
                          </select>
                        </div>
                        
                        {newTeacherDepartment === 'JHS' && (
                          <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Subject *</label>
                            <select
                              value={newTeacherSubject}
                              onChange={(e) => setNewTeacherSubject(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                              required
                            >
                              <option value="">Select Subject...</option>
                              <option value="English Language">English Language</option>
                              <option value="Mathematics">Mathematics</option>
                              <option value="Science">Science</option>
                              <option value="Social Studies">Social Studies</option>
                              <option value="Religious and Moral Education">Religious and Moral Education</option>
                              <option value="Computing">Computing</option>
                              <option value="Creative Arts and Design">Creative Arts and Design</option>
                              <option value="Career Technology">Career Technology</option>
                              <option value="French">French</option>
                              <option value="Ghanaian Language">Ghanaian Language</option>
                            </select>
                          </div>
                        )}
                        
                        {newTeacherDepartment === 'Primary' && (
                          <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Assigned Class</label>
                            <select
                              value={newTeacherAssignedClass}
                              onChange={(e) => setNewTeacherAssignedClass(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                            >
                              <option value="">Select Class...</option>
                              <option value="Basic 1">Basic 1</option>
                              <option value="Basic 2">Basic 2</option>
                              <option value="Basic 3">Basic 3</option>
                              <option value="Basic 4">Basic 4</option>
                              <option value="Basic 5">Basic 5</option>
                              <option value="Basic 6">Basic 6</option>
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 mt-2 bg-amber-50 border border-amber-100 p-3 rounded-xl">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isClassTeacher"
                            checked={newTeacherIsClassTeacher}
                            onChange={(e) => setNewTeacherIsClassTeacher(e.target.checked)}
                            className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                          />
                          <label htmlFor="isClassTeacher" className="text-xs text-amber-900 font-semibold cursor-pointer">
                            Assign Class Teacher Role
                          </label>
                        </div>
                        {newTeacherIsClassTeacher && newTeacherDepartment === 'JHS' && (
                          <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-amber-700/80 mb-1.5 mt-2">Class (For Class Teacher)</label>
                            <select
                              value={newTeacherAssignedClass}
                              onChange={(e) => setNewTeacherAssignedClass(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                            >
                              <option value="">Select Class...</option>
                              <option value="JHS 1">JHS 1</option>
                              <option value="JHS 2">JHS 2</option>
                              <option value="JHS 3">JHS 3</option>
                            </select>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={creatingTeacher}
                        className="w-full bg-slate-900 hover:bg-slate-850 text-white font-semibold py-2 px-3 rounded-xl transition shadow-sm dark:shadow-none flex items-center justify-center gap-1.5 cursor-pointer text-xs disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {creatingTeacher ? 'Registering...' : 'Create Teacher Account'}
                        <PlusCircle className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>

                  {/* Registered Teachers List */}
                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none space-y-4">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h3 className="font-display font-semibold text-slate-900 dark:text-white">Registered School Teachers</h3>
                      <p className="text-slate-400 text-xs">Currently registered teacher roles associated with this {school.name} portal.</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                            <th className="py-2">Name</th>
                            <th className="py-2">Email</th>
                            <th className="py-2">Subject / Class</th>
                            <th className="py-2">Registered At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingTeachers ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-400 font-mono">Loading teachers list...</td>
                            </tr>
                          ) : teachers.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-400 font-mono">No teachers registered yet. Create one on the left.</td>
                            </tr>
                          ) : (
                            teachers.map((t) => (
                              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950/50">
                                <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                  {t.fullName}
                                  {t.isClassTeacher && (
                                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                      Class Teacher
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 font-mono text-slate-600 dark:text-slate-400">{t.email}</td>
                                <td className="py-2.5 text-slate-600 dark:text-slate-400">
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200 dark:border-slate-700">
                                      {t.department || 'Not Set'}
                                    </span>
                                    {t.department === 'JHS' && t.subject && (
                                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-medium">
                                        {t.subject}
                                      </span>
                                    )}
                                    {t.assignedClass && (
                                      <span className="bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded text-[10px] font-medium">
                                        Class: {t.assignedClass}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <BillingComponent school={school} students={students} />
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Settings Header */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5 text-amber-500 animate-pulse" />
                    Official School Configurations
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                    Manage your Ghana Education Service multi-tenant registration details, primary branding, and institutional metadata.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active ID: {school.id}
                </div>
              </div>

              {/* Settings Form */}
              <form onSubmit={handleSaveSchoolSettings} className="space-y-6">
                {settingsSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3.5 rounded-2xl text-xs flex items-center gap-2.5 shadow-sm dark:shadow-none animate-in fade-in">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">Settings Updated!</span> {settingsSuccess}
                    </div>
                  </div>
                )}

                {settingsError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3.5 rounded-2xl text-xs flex items-center gap-2.5 shadow-sm dark:shadow-none animate-in fade-in">
                    <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-bold">Update Failed:</span> {settingsError}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: School Profile Details & Headmaster Info */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Institutional Details */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none space-y-4">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h3 className="font-display font-semibold text-slate-900 dark:text-white text-sm">Institutional Profile</h3>
                        <p className="text-slate-400 text-xs">Primary GEDA school details stored in registry.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Official School Name</label>
                          <input
                            type="text"
                            required
                            value={settingsName}
                            onChange={(e) => setSettingsName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">EMIS Code</label>
                          <input
                            type="text"
                            placeholder="e.g. 20120405"
                            value={settingsEmisCode}
                            onChange={(e) => setSettingsEmisCode(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Region Registry</label>
                          <select
                            value={settingsRegion}
                            onChange={(e) => setSettingsRegion(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                          >
                            <option value="Greater Accra">Greater Accra</option>
                            <option value="Ashanti">Ashanti</option>
                            <option value="Northern">Northern</option>
                            <option value="Eastern">Eastern</option>
                            <option value="Western">Western</option>
                            <option value="Volta">Volta</option>
                            <option value="Central">Central</option>
                            <option value="Bono">Bono</option>
                            <option value="Bono East">Bono East</option>
                            <option value="Ahafo">Ahafo</option>
                            <option value="Savannah">Savannah</option>
                            <option value="North East">North East</option>
                            <option value="Oti">Oti</option>
                            <option value="Western North">Western North</option>
                            <option value="Upper East">Upper East</option>
                            <option value="Upper West">Upper West</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">District Assembly</label>
                          <input
                            type="text"
                            required
                            value={settingsDistrict}
                            onChange={(e) => setSettingsDistrict(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Year of Establishment</label>
                          <input
                            type="text"
                            placeholder="e.g. 1994"
                            value={settingsYearOfEstablishment}
                            onChange={(e) => setSettingsYearOfEstablishment(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Head Teacher Details */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none space-y-4">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h3 className="font-display font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                          <GraduationCap className="h-4.5 w-4.5 text-amber-500" />
                          Head Teacher / Headmaster Details
                        </h3>
                        <p className="text-slate-400 text-xs">Official academic signatory credentials used for letters and certifications.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Full Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Rev. Kofi Osei Bonsu"
                            value={settingsHeadTeacherName}
                            onChange={(e) => setSettingsHeadTeacherName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Staff ID Code</label>
                          <input
                            type="text"
                            placeholder="e.g. GES-TCH-1940"
                            value={settingsHeadTeacherStaffId}
                            onChange={(e) => setSettingsHeadTeacherStaffId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Contact Phone Number</label>
                          <input
                            type="tel"
                            placeholder="e.g. 0244123456"
                            value={settingsHeadTeacherPhone}
                            onChange={(e) => setSettingsHeadTeacherPhone(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Active Academic Session Details */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none space-y-4">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h3 className="font-display font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                          <GraduationCap className="h-4.5 w-4.5 text-amber-500" />
                          Active Academic Session Config
                        </h3>
                        <p className="text-slate-400 text-xs">Configure the current active academic year and term to be applied dynamically on all official admission templates.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Active Academic Year</label>
                          <input
                            type="text"
                            placeholder="e.g. 2026/2027"
                            required
                            value={settingsAcademicYear}
                            onChange={(e) => setSettingsAcademicYear(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Active Academic Term</label>
                          <select
                            value={settingsAcademicTerm}
                            onChange={(e) => setSettingsAcademicTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                          >
                            <option value="First">First Term</option>
                            <option value="Second">Second Term</option>
                            <option value="Third">Third Term</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Term Reopening Date</label>
                          <input
                            type="date"
                            value={settingsReopeningDate}
                            onChange={(e) => setSettingsReopeningDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Term Vacation Date</label>
                          <input
                            type="date"
                            value={settingsVacationDate}
                            onChange={(e) => setSettingsVacationDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:bg-slate-900 transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Branding (Logo Upload & Color Choice) */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Visual Branding Settings */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none space-y-4">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h3 className="font-display font-semibold text-slate-900 dark:text-white text-sm">Visual Identity</h3>
                        <p className="text-slate-400 text-xs">Configure custom colors and school crest emblem.</p>
                      </div>

                      {/* Primary Colour Picker & Swatches */}
                      <div className="space-y-2.5">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">School Primary Color</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { hex: '#0f172a', name: 'Slate' },
                            { hex: '#047857', name: 'Emerald' },
                            { hex: '#b45309', name: 'Gold' },
                            { hex: '#1d4ed8', name: 'Royal' },
                            { hex: '#be123c', name: 'Crimson' },
                            { hex: '#6366f1', name: 'Indigo' },
                          ].map((col) => (
                            <button
                              key={col.hex}
                              type="button"
                              onClick={() => setSettingsPrimaryColor(col.hex)}
                              className={`w-7 h-7 rounded-full cursor-pointer transition flex items-center justify-center border-2 ${
                                settingsPrimaryColor === col.hex ? 'border-amber-500 scale-110 shadow-sm dark:shadow-none' : 'border-transparent hover:scale-105'
                              }`}
                              style={{ backgroundColor: col.hex }}
                              title={col.name}
                            >
                              {settingsPrimaryColor === col.hex && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900"></span>
                              )}
                            </button>
                          ))}

                          <div className="flex items-center gap-1.5 ml-auto">
                            <input
                              type="color"
                              value={settingsPrimaryColor}
                              onChange={(e) => setSettingsPrimaryColor(e.target.value)}
                              className="w-7 h-7 rounded cursor-pointer border border-slate-200 dark:border-slate-700"
                            />
                            <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">{settingsPrimaryColor.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>

                      {/* School Emblem Drag & Drop Upload */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">School Emblem Logo</label>
                        
                        <div
                          onDragEnter={handleDragLogo}
                          onDragOver={handleDragLogo}
                          onDragLeave={handleDragLogo}
                          onDrop={handleDropLogo}
                          className={`border-2 border-dashed rounded-2xl p-4 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                            dragActive
                              ? 'border-amber-500 bg-amber-50/50'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950/50'
                          }`}
                          onClick={() => document.getElementById('logo-upload-input')?.click()}
                        >
                          <input
                            type="file"
                            id="logo-upload-input"
                            accept="image/*"
                            className="absolute opacity-0 pointer-events-none -z-50"
                            onChange={handleLogoFileChange}
                          />

                          {settingsLogo ? (
                            <div className="relative group">
                              <img
                                src={settingsLogo}
                                alt="Selected emblem"
                                className="h-16 w-16 object-contain rounded border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1"
                              />
                              <div className="absolute inset-0 bg-slate-900/60 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[9px] font-bold">
                                Replace
                              </div>
                            </div>
                          ) : (
                            <SchoolIcon className="h-8 w-8 text-slate-300" />
                          )}

                          <div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Drag & drop logo here</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">or click to browse (max 2MB)</span>
                          </div>
                        </div>

                        {/* Preset Crests if they want to choose one quickly */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">GEDA Standard Presets</span>
                          <div className="flex gap-2">
                            {[
                              { label: 'Crest A', initials: 'GHS', desc: 'Ghana High School standard emblem' },
                              { label: 'Crest B', initials: 'GMS', desc: 'Ghana Methodist standard emblem' },
                              { label: 'Crest C', initials: 'GPS', desc: 'Ghana Presbyterian standard emblem' },
                            ].map((preset, idx) => {
                              // SVG initials avatar representing standard presets
                              const presetDataUri = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="46" fill="%230f172a" stroke="%23f59e0b" stroke-width="4"/><text x="50" y="58" font-family="system-ui, sans-serif" font-size="32" font-weight="bold" fill="%23ffffff" text-anchor="middle">${preset.initials}</text></svg>`;
                              
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSettingsLogo(presetDataUri)}
                                  className={`flex-1 border text-[10px] py-1.5 px-2 rounded-xl text-slate-600 dark:text-slate-400 font-medium transition cursor-pointer flex flex-col items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950 ${
                                    settingsLogo === presetDataUri ? 'border-amber-500 bg-amber-50/20 text-amber-900 font-bold' : 'border-slate-200 dark:border-slate-700'
                                  }`}
                                  title={preset.desc}
                                >
                                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-bold text-[8px] flex items-center justify-center border border-amber-400">{preset.initials}</span>
                                  {preset.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Live Brand Preview Card */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Live Brand Preview</span>
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none overflow-hidden">
                          <div className="h-2" style={{ backgroundColor: settingsPrimaryColor }}></div>
                          <div className="p-3 flex items-center gap-3">
                            <div className="text-white p-1 rounded flex items-center justify-center overflow-hidden h-8 w-8 shadow-inner" style={{ backgroundColor: settingsPrimaryColor }}>
                              {settingsLogo ? (
                                <img src={settingsLogo} alt="Emblem preview" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <SchoolIcon className="h-4.5 w-4.5 text-amber-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate block">{settingsName || 'School Name'}</span>
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 block">District: {settingsDistrict || 'District'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Controls */}
                <div className="flex items-center justify-end gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsName(school.name);
                      setSettingsRegion(school.region);
                      setSettingsDistrict(school.district);
                      setSettingsLogo(school.logo || '');
                      setSettingsPrimaryColor(school.primaryColor || '#0f172a');
                      setSettingsEmisCode(school.emisCode || '');
                      setSettingsYearOfEstablishment(school.yearOfEstablishment || '');
                      setSettingsHeadTeacherName(school.headTeacherName || '');
                      setSettingsHeadTeacherStaffId(school.headTeacherStaffId || '');
                      setSettingsHeadTeacherPhone(school.headTeacherPhone || '');
                      setSettingsAcademicYear(school.academicYear || '2026/2027');
                      setSettingsAcademicTerm(school.academicTerm || 'First');
                      setSettingsSuccess('');
                      setSettingsError('');
                    }}
                    className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold py-2 px-4 rounded-xl transition cursor-pointer text-xs"
                  >
                    Reset Changes
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-6 rounded-xl transition shadow-sm dark:shadow-none flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {savingSettings ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Saving Configurations...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        Save Configurations
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

            {/* MODAL: Edit Student */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full m-auto border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-950 py-4 px-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white">Edit Student</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update the information for {editingStudent.fullName}</p>
              </div>
              <button onClick={() => setEditingStudent(null)} className="p-2 hover:bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer text-slate-500 dark:text-slate-400 transition">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpdateStudent} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Student Full Name *</label>
                    <input
                      type="text"
                      value={editingStudent.fullName}
                      onChange={(e) => setEditingStudent({...editingStudent, fullName: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Date of Birth *</label>
                    <input
                      type="date"
                      value={editingStudent.dob}
                      onChange={(e) => setEditingStudent({...editingStudent, dob: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Gender *</label>
                    <select
                      value={editingStudent.gender}
                      onChange={(e) => setEditingStudent({...editingStudent, gender: e.target.value as 'Male' | 'Female'})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs transition appearance-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Class Level *</label>
                    <select
                      value={editingStudent.classLevel}
                      onChange={(e) => setEditingStudent({...editingStudent, classLevel: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs transition appearance-none"
                    >
                      <option value="Class 1">Class 1</option>
                      <option value="Class 2">Class 2</option>
                      <option value="Class 3">Class 3</option>
                      <option value="Class 4">Class 4</option>
                      <option value="Class 5">Class 5</option>
                      <option value="Class 6">Class 6</option>
                      <option value="JHS 1">JHS 1</option>
                      <option value="JHS 2">JHS 2</option>
                      <option value="JHS 3">JHS 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Boarding Status *</label>
                    <select
                      value={editingStudent.boardingStatus}
                      onChange={(e) => setEditingStudent({...editingStudent, boardingStatus: e.target.value as 'Day' | 'Boarding'})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs transition appearance-none"
                    >
                      <option value="Day">Day</option>
                      <option value="Boarding">Boarding</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Fee Total (GH₵) *</label>
                    <input
                      type="number"
                      value={editingStudent.feeTotal}
                      onChange={(e) => setEditingStudent({...editingStudent, feeTotal: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Guardian Name *</label>
                    <input
                      type="text"
                      value={editingStudent.guardianName}
                      onChange={(e) => setEditingStudent({...editingStudent, guardianName: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Guardian Phone *</label>
                    <input
                      type="tel"
                      value={editingStudent.guardianPhone}
                      onChange={(e) => setEditingStudent({...editingStudent, guardianPhone: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs transition"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <div className="shrink-0 w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                    {editingStudent.passportPicture ? (
                      <img src={editingStudent.passportPicture} alt="Passport Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Update Passport Picture</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageUpload}
                      className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:bg-slate-800 file:text-slate-700 dark:text-slate-300 hover:file:bg-slate-200 dark:bg-slate-700 transition cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setEditingStudent(null)} className="px-5 py-2.5 rounded-xl font-semibold text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950 transition cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 dark:text-white transition cursor-pointer">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Student Confirm */}
      {historyStudent && (
        <StudentHistoryModal 
          school={school} 
          student={historyStudent} 
          onClose={() => setHistoryStudent(null)} 
        />
      )}
      
      {isDeletingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full m-auto border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 p-6 text-center space-y-4">
            <div className="bg-red-50 text-red-500 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Delete Student?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete this student? This action cannot be undone and will permanently erase their academic and fee records.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <button onClick={() => setIsDeletingStudent(null)} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950 transition cursor-pointer">
                Cancel
              </button>
              <button onClick={() => handleDeleteStudent(isDeletingStudent)} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-xs bg-red-600 hover:bg-red-700 text-white transition cursor-pointer">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL: printable official Ghana Education Service Admission Letter */}
      {letterStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex overflow-y-auto no-print p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full m-auto border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
            
            {/* Modal Controls Bar */}
            <div className="bg-slate-50 dark:bg-slate-950 py-3 px-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveLetterTab('letter')}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                    activeLetterTab === 'letter'
                      ? 'bg-slate-900 text-white shadow-sm dark:shadow-none'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  1. Admission Letter
                </button>
                <button
                  onClick={() => setActiveLetterTab('slip')}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                    activeLetterTab === 'slip'
                      ? 'bg-slate-950 text-white shadow-sm dark:shadow-none'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  2. Standalone Acceptance Slip
                </button>
              </div>

              <div className="flex flex-col items-end gap-2 self-end sm:self-auto">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrint()}
                    className="bg-brand-green-700 hover:bg-brand-green-800 text-white text-xs font-semibold py-1.5 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm dark:shadow-none"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print {activeLetterTab === 'letter' ? 'Admission Letter' : 'Acceptance Slip'}
                  </button>
                  <button
                    onClick={() => setLetterStudent(null)}
                    className="text-slate-400 hover:text-slate-700 dark:text-slate-300 text-xs font-semibold py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950 cursor-pointer transition"
                  >
                    Close
                  </button>
                </div>
                {showPrintWarning && (
                  <p className="text-[10px] text-amber-600 max-w-[250px] text-right leading-tight">
                    Printing is restricted in this preview. Please click the <b>Open in new tab</b> icon at the top right of the screen to print.
                  </p>
                )}
              </div>
            </div>

            {/* Customizer sidebar drawer built in Modal */}
            <div className="p-4 bg-amber-50/50 border-b border-slate-100 dark:border-slate-800 grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Custom Headmaster Name Signature</label>
                <input
                  type="text"
                  value={headmasterName}
                  onChange={(e) => setHeadmasterName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Custom Letter Remarks (Appends to body)</label>
                <input
                  type="text"
                  value={letterCustomNotes}
                  onChange={(e) => setLetterCustomNotes(e.target.value)}
                  placeholder="e.g. Please bring original BECE transcripts..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Printable Area Wrapper */}
            <div className="p-10 bg-white dark:bg-slate-900 overflow-auto flex-1">
              
              <div className="max-w-2xl mx-auto border-4 border-double border-brand-green-900 p-8 space-y-6 text-slate-900 dark:text-white bg-white dark:bg-slate-900 shadow-inner">
                
                {/* GES official Header with School Logo / Letterhead */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-brand-green-900">
                  <div className="flex items-center gap-3">
                    <div className="text-white p-1 rounded-xl flex items-center justify-center overflow-hidden h-14 w-14 shadow-inner border" style={{ backgroundColor: school.primaryColor || '#0f172a' }}>
                      {school.logo ? (
                        <img src={school.logo} alt="School Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <SchoolIcon className="h-8 w-8 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg tracking-tight text-slate-950 dark:text-white uppercase">{school.name}</h3>
                      <span className="block text-[9px] font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase">GHANA EDUCATION SERVICE (GES) DISTRICT DIVISION</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">P.O. Box 45, {school.district} • {school.region} Region</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{school.headTeacherPhone || '0244123456'} | {school.email || `info@${school.slug}.edu.gh`}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[9px] text-slate-400 self-center">
                    <p className="font-bold text-slate-700 dark:text-slate-300">EMIS: {school.emisCode || '20120405'}</p>
                    <p>ESTD: {school.yearOfEstablishment || '1994'}</p>
                  </div>
                </div>

                {activeLetterTab === 'letter' ? (
                  <>
                    {/* Date & Ref block */}
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                      <span>Ref No: <b>GEDA/{school.id.slice(0,3).toUpperCase()}/2026/{letterStudent.admissionNo || 'PENDING'}</b></span>
                      <span>Date: <b>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</b></span>
                    </div>

                    {/* Recipient Details */}
                    <div className="space-y-1 text-xs">
                      <p className="text-slate-500 dark:text-slate-400">To the Parent/Guardian of:</p>
                      <p className="text-sm font-bold text-slate-950 dark:text-white">{letterStudent.guardianName || 'Parent / Guardian'}</p>
                      <p className="text-slate-600 dark:text-slate-400">{school.district}, {school.region} Region, Ghana</p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <p>Student Candidate: <b>{letterStudent.fullName}</b> (Age DOB: {letterStudent.dob})</p>
                    </div>

                    {/* Letter Body Text */}
                    <div className="space-y-4 text-xs leading-relaxed text-slate-800 dark:text-slate-200 text-justify">
                      <h4 className="font-display font-bold text-slate-950 dark:text-white underline text-center uppercase tracking-wide">
                        OFFER OF ADMISSION FOR THE {school.academicYear || '2026/2027'} ACADEMIC YEAR
                      </h4>

                      <p>Dear Sir/Madam,</p>

                      <p>
                        We are pleased to inform you that your child/ward, <b>{letterStudent.fullName}</b>, has been offered admission into <b>{school.name}</b> to pursue studies at the <b>{letterStudent.classLevel}</b> level (Class/Form: <b>{letterStudent.classLevel}</b>), starting in the <b>{school.academicTerm || 'First'}</b> Term of the <b>{school.academicYear || '2026/2027'}</b> Academic Year.
                      </p>

                      <p>
                        This offer is made based on the vacancy available and the student's eligibility under the Ghana Education Service (GES) guidelines.
                      </p>

                      <p className="font-bold text-slate-950 dark:text-white">
                        Please take note of the following important resumption and registration details:
                      </p>

                      <div className="space-y-3 pl-2">
                        <p>
                          <b>1. Academic Resumption:</b><br />
                          The school term officially begins on <b>{school.reopeningDate ? new Date(school.reopeningDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Tuesday, September 8, 2026'}</b> at <b>7:30 AM</b>. Your child is expected to report to their assigned classroom facilitator by this date.
                        </p>

                        <p>
                          <b>2. Required Registration Documents:</b><br />
                          Upon arrival, please submit the following documents to the administration office if you have not already done so:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>A photocopy of the child's Birth Certificate (or Weighing Card for KG admissions).</li>
                          <li>Standard passport-sized photographs (<b>4</b> copies).</li>
                          <li>Transfer Certificate and last academic report sheet (for transfer students).</li>
                          <li>Completed Student Health & Emergency Contact Form.</li>
                        </ul>

                        <p>
                          <b>3. School Uniforms and Materials:</b><br />
                          Students are expected to strictly adhere to the approved GES uniform codes for basic schools.
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li><b>Regular Uniform days:</b> Mondays to Thursdays.</li>
                          <li><b>Friday Wear/Sports Wear:</b> Fridays.</li>
                        </ul>
                        <p>
                          Details of the school's approved uniform design, textbooks, and exercise books list are attached to this letter.
                        </p>

                        <p>
                          <b>4. Rules and Conduct:</b><br />
                          Our school maintains high academic standards, strict discipline, and moral values. Both parents and students are expected to cooperate fully with school authorities and abide by the rules and regulations outlined in the School's Parent-Teacher Association (PTA) handbook.
                        </p>
                      </div>

                      <p>
                        To accept this offer, please complete, sign, and return the Acceptance Slip to the Head Teacher's office on or before <b>{school.reopeningDate ? new Date(new Date(school.reopeningDate).getTime() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Friday, September 4, 2026'}</b>.
                      </p>

                      <p>
                        We look forward to welcoming <b>{letterStudent.fullName}</b> into our academic community and working together to ensure their success.
                      </p>

                      {letterCustomNotes && (
                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 italic">
                          <b>Additional Custom Directives:</b> {letterCustomNotes}
                        </div>
                      )}

                      <p className="text-right">
                        Yours faithfully,
                      </p>
                      
                      <div className="pt-2 flex flex-col items-end">
                        <div className="border-b border-slate-300 dark:border-slate-600 w-44 h-8 flex items-center justify-center font-mono text-[10px] text-slate-400 italic">
                          [Signature Stamp]
                        </div>
                        <div className="text-right pt-1.5">
                          <p className="font-bold text-slate-900 dark:text-white">{school.headTeacherName || headmasterName}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-[10px]">Head Teacher, {school.name}</p>
                          {school.headTeacherStaffId && (
                            <p className="text-slate-400 text-[9px] font-mono">Staff ID: {school.headTeacherStaffId}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Standalone Acceptance Slip */}
                    {/* Date & Ref block */}
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                      <span>Ref No: <b>GEDA/{school.id.slice(0,3).toUpperCase()}/2026/{letterStudent.admissionNo || 'PENDING'}/ACC</b></span>
                      <span>Date: <b>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</b></span>
                    </div>

                    <div className="text-center py-2 border-y border-slate-100 dark:border-slate-800">
                      <h4 className="font-display font-bold text-slate-950 dark:text-white underline uppercase tracking-wide">
                        OFFICIAL ADMISSION ACCEPTANCE SLIP
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        ACADEMIC YEAR: {school.academicYear || '2026/2027'} | ACTIVE TERM: {school.academicTerm || 'First'} TERM
                      </p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-slate-500 dark:text-slate-400">Student Candidate Details:</p>
                      <p className="text-sm font-bold text-slate-950 dark:text-white">{letterStudent.fullName}</p>
                      <p className="text-slate-600 dark:text-slate-400">Assigned Grade/Form: <b>{letterStudent.classLevel}</b> • Admission No: <b>{letterStudent.admissionNo || 'PENDING'}</b></p>
                    </div>

                    <div className="space-y-4 text-xs leading-relaxed text-slate-800 dark:text-slate-200 text-justify">
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-loose">
                        I, Mr./Mrs./Ms. <span className="border-b border-slate-300 dark:border-slate-600 inline-block w-64">&nbsp;</span>, Parent/Guardian of the student named above, hereby state my decision regarding the offer of admission granted into <b>{school.name}</b> for the <b>{school.academicYear || '2026/2027'}</b> Academic Year:
                      </p>

                      <div className="space-y-3.5 text-xs text-slate-800 dark:text-slate-200 pl-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input type="checkbox" className="mt-0.5 accent-brand-green-700" defaultChecked disabled />
                          <span><b>[  ] ACCEPT</b> the offer of admission granted to my child/ward under the terms and conditions stated in the Official Admission Letter.</span>
                        </label>
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input type="checkbox" className="mt-0.5 accent-brand-green-700" disabled />
                          <span><b>[  ] DECLINE</b> the offer of admission and relinquish the allocated seat.</span>
                        </label>
                      </div>

                      <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                        By accepting this offer, I agree to abide by all the school regulations, cooperate with the school authorities, and fulfill the requisite financial obligations as outlined in the terminal fees schedule.
                      </p>

                      <div className="grid grid-cols-2 gap-6 text-xs pt-4">
                        <div className="space-y-4">
                          <div>
                            <p className="text-slate-800 dark:text-slate-200 font-semibold">Parent/Guardian's Signature:</p>
                            <div className="border-b border-slate-300 dark:border-slate-600 w-full h-8"></div>
                          </div>
                          <div>
                            <p className="text-slate-800 dark:text-slate-200 font-semibold">Contact Number:</p>
                            <div className="border-b border-slate-300 dark:border-slate-600 w-full h-8"></div>
                          </div>
                        </div>
                        <div className="space-y-4 flex flex-col justify-between">
                          <div>
                            <p className="text-slate-800 dark:text-slate-200 font-semibold">Date Signed:</p>
                            <div className="border-b border-slate-300 dark:border-slate-600 w-full h-8"></div>
                          </div>
                          <div className="text-right pt-2">
                            <p className="font-bold text-slate-900 dark:text-white">{school.headTeacherName || headmasterName}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px]">Head Teacher, {school.name}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/50 text-[11px] text-amber-900 space-y-1.5">
                      <h5 className="font-bold uppercase tracking-wider text-[10px]">Important Return Guidelines:</h5>
                      <p>
                        Please carefully complete, sign, and return this slip physically to the Head Teacher's / Administration office of <b>{school.name}</b> on or before <b>{school.reopeningDate ? new Date(new Date(school.reopeningDate).getTime() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Friday, September 4, 2026'}</b>.
                      </p>
                      <p className="text-[10px] text-amber-800">
                        * Failure to submit this acceptance slip before the deadline may result in forfeiture of the admission slot to candidates on the waitlist.
                      </p>
                    </div>
                  </>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL: TEACHER REMARKS & ACADEMIC DATA */}
      {gradeStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex p-4 no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full m-auto border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Academic & Attendance Record</h3>
              <p className="text-xs text-slate-400">Record academic performance and attendance for {gradeStudent.fullName}.</p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Attendance Inputs */}
              <div>
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">School Attendance Tracker</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Days Present</label>
                    <input
                      type="number"
                      placeholder="e.g. 45"
                      value={tempAttPresent}
                      onChange={(e) => setTempAttPresent(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Total Term Days</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={tempAttTotal}
                      onChange={(e) => setTempAttTotal(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Assessment Grades */}
              <div>
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Academic Assessment (WASSCE / SBA)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">SBA Score (Max 30)</label>
                    <input
                      type="number"
                      placeholder="e.g. 24"
                      value={tempSbaScore}
                      min={0}
                      max={30}
                      onChange={(e) => setTempSbaScore(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Exam Score (Max 70)</label>
                    <input
                      type="number"
                      placeholder="e.g. 58"
                      value={tempExamScore}
                      min={0}
                      max={70}
                      onChange={(e) => setTempExamScore(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Aptitude & Conduct Remarks */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aptitude & Conduct Indicator</label>
                <textarea
                  rows={3}
                  value={tempRemarks}
                  onChange={(e) => setTempRemarks(e.target.value)}
                  placeholder="e.g. Exceptional pupil, demonstrates excellent aptitude. High potential."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setGradeStudent(null)}
                className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold px-3 py-2 rounded-xl transition"
              >
                Dismiss
              </button>
              <button
                onClick={handleSaveAcademicRecord}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 dark:text-white font-bold px-4 py-2 rounded-xl transition"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable layout for raw letter prints */}
      {letterStudent && (
        <div className="absolute opacity-0 pointer-events-none -z-50">
          <div ref={printRef} className="p-8 print:p-0 space-y-6 print:space-y-3 text-black bg-white dark:bg-slate-900 print-card">
            
            {/* Header / Letterhead */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-black">
              <div className="flex items-center gap-3">
                <div className="text-black p-1 rounded border border-black flex items-center justify-center overflow-hidden h-14 w-14">
                  {school.logo ? (
                    <img src={school.logo} alt="School Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <SchoolIcon className="h-8 w-8 text-black" />
                  )}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg uppercase">{school.name}</h3>
                  <span className="block text-[8px] font-mono tracking-wider uppercase text-gray-700">GHANA EDUCATION SERVICE (GES) DISTRICT DIVISION</span>
                  <p className="text-[9px] text-gray-600">P.O. Box 45, {school.district} • {school.region} Region</p>
                  <p className="text-[9px] text-gray-600">{school.headTeacherPhone || '0244123456'} | {school.email || `info@${school.slug}.edu.gh`}</p>
                </div>
              </div>
              <div className="text-right font-mono text-[8px] text-gray-500 self-center">
                <p className="font-bold text-black">EMIS: {school.emisCode || '20120405'}</p>
                <p>ESTD: {school.yearOfEstablishment || '1994'}</p>
              </div>
            </div>

            {activeLetterTab === 'letter' ? (
              <>
                {/* Date & Ref block */}
                <div className="flex justify-between text-xs font-mono">
                  <span>Ref No: <b>GEDA/{school.id.slice(0,3).toUpperCase()}/2026/{letterStudent.admissionNo || 'PENDING'}</b></span>
                  <span>Date: <b>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</b></span>
                </div>

                {/* Recipient Details */}
                <div className="space-y-1 text-xs">
                  <p className="text-gray-500">To the Parent/Guardian of:</p>
                  <p className="text-sm font-bold">{letterStudent.guardianName || 'Parent / Guardian'}</p>
                  <p className="text-gray-600">{school.district}, {school.region} Region, Ghana</p>
                </div>

                <div className="text-xs text-gray-500 font-mono">
                  <p>Student Candidate: {letterStudent.fullName} (Age DOB: {letterStudent.dob})</p>
                </div>

                {/* Letter Body Text */}
                <div className="space-y-4 print:space-y-2 text-xs leading-relaxed print:leading-normal text-justify text-black">
                  <h4 className="font-bold underline text-center uppercase tracking-wide">
                    OFFER OF ADMISSION FOR THE {school.academicYear || '2026/2027'} ACADEMIC YEAR
                  </h4>

                  <p>Dear Sir/Madam,</p>

                  <p>
                    We are pleased to inform you that your child/ward, <b>{letterStudent.fullName}</b>, has been offered admission into <b>{school.name}</b> to pursue studies at the <b>{letterStudent.classLevel}</b> level (Class/Form: <b>{letterStudent.classLevel}</b>), starting in the <b>{school.academicTerm || 'First'}</b> Term of the <b>{school.academicYear || '2026/2027'}</b> Academic Year.
                  </p>

                  <p>
                    This offer is made based on the vacancy available and the student's eligibility under the Ghana Education Service (GES) guidelines.
                  </p>

                  <p className="font-bold">
                    Please take note of the following important resumption and registration details:
                  </p>

                  <div className="space-y-2 print:space-y-1 pl-2">
                    <p>
                      <b>1. Academic Resumption:</b><br />
                      The school term officially begins on <b>{school.reopeningDate ? new Date(school.reopeningDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Tuesday, September 8, 2026'}</b> at <b>7:30 AM</b>. Your child is expected to report to their assigned classroom facilitator by this date.
                    </p>

                    <p>
                      <b>2. Required Registration Documents:</b><br />
                      Upon arrival, please submit the following documents to the administration office if you have not already done so:
                    </p>
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li>A photocopy of the child's Birth Certificate (or Weighing Card for KG admissions).</li>
                      <li>Standard passport-sized photographs (<b>4</b> copies).</li>
                      <li>Transfer Certificate and last academic report sheet (for transfer students).</li>
                      <li>Completed Student Health & Emergency Contact Form.</li>
                    </ul>

                    <p>
                      <b>3. School Uniforms and Materials:</b><br />
                      Students are expected to strictly adhere to the approved GES uniform codes for basic schools.
                    </p>
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li><b>Regular Uniform days:</b> Mondays to Thursdays.</li>
                      <li><b>Friday Wear/Sports Wear:</b> Fridays.</li>
                    </ul>
                    <p>
                      Details of the school's approved uniform design, textbooks, and exercise books list are attached to this letter.
                    </p>

                    <p>
                      <b>4. Rules and Conduct:</b><br />
                      Our school maintains high academic standards, strict discipline, and moral values. Both parents and students are expected to cooperate fully with school authorities and abide by the rules and regulations outlined in the School's Parent-Teacher Association (PTA) handbook.
                    </p>
                  </div>

                  <p>
                    To accept this offer, please complete, sign, and return the Acceptance Slip to the Head Teacher's office on or before <b>{school.reopeningDate ? new Date(new Date(school.reopeningDate).getTime() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Friday, September 4, 2026'}</b>.
                  </p>

                  <p>
                    We look forward to welcoming <b>{letterStudent.fullName}</b> into our academic community and working together to ensure their success.
                  </p>

                  {letterCustomNotes && (
                    <div className="bg-gray-50 print:bg-transparent p-2.5 rounded border border-gray-200 text-[10px] italic">
                      <b>Additional Custom Directives:</b> {letterCustomNotes}
                    </div>
                  )}

                  <p className="text-right pt-2 print:pt-0">
                    Yours faithfully,
                  </p>
                  
                  <div className="pt-2 flex flex-col items-end">
                    <div className="border-b border-gray-400 w-44 h-8 flex items-center justify-center font-mono text-[9px] text-gray-500 italic">
                      [Signature Stamp]
                    </div>
                    <div className="text-right pt-1.5">
                      <p className="font-bold">{school.headTeacherName || headmasterName}</p>
                      <p className="text-gray-600 text-[10px]">Head Teacher, {school.name}</p>
                      {school.headTeacherStaffId && (
                        <p className="text-gray-500 text-[9px] font-mono">Staff ID: {school.headTeacherStaffId}</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Standalone Acceptance Slip */}
                {/* Date & Ref block */}
                <div className="flex justify-between text-xs font-mono">
                  <span>Ref No: <b>GEDA/{school.id.slice(0,3).toUpperCase()}/2026/{letterStudent.admissionNo || 'PENDING'}/ACC</b></span>
                  <span>Date: <b>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</b></span>
                </div>

                <div className="text-center py-2 border-y border-black">
                  <h4 className="font-display font-bold text-slate-950 dark:text-white underline uppercase tracking-wide">
                    OFFICIAL ADMISSION ACCEPTANCE SLIP
                  </h4>
                  <p className="text-[10px] font-mono mt-0.5">
                    ACADEMIC YEAR: {school.academicYear || '2026/2027'} | ACTIVE TERM: {school.academicTerm || 'First'} TERM
                  </p>
                </div>

                <div className="space-y-1 text-xs pt-2">
                  <p className="text-gray-500">Student Candidate Details:</p>
                  <p className="text-sm font-bold">{letterStudent.fullName}</p>
                  <p className="text-gray-600">Assigned Grade/Form: <b>{letterStudent.classLevel}</b> • Admission No: <b>{letterStudent.admissionNo || 'PENDING'}</b></p>
                </div>

                <div className="space-y-4 print:space-y-3 text-xs leading-relaxed print:leading-normal text-justify text-black pt-4 print:pt-2">
                  <p className="text-xs leading-loose print:leading-normal">
                    I, Mr./Mrs./Ms. ________________________________________, Parent/Guardian of the student named above, hereby state my decision regarding the offer of admission granted into <b>{school.name}</b> for the <b>{school.academicYear || '2026/2027'}</b> Academic Year:
                  </p>

                  <div className="space-y-3 print:space-y-2 pl-4 py-3 print:py-2 border border-black rounded">
                    <p className="flex items-start gap-2">
                      <span><b>[  ] ACCEPT</b> the offer of admission granted to my child/ward under the terms and conditions stated in the Official Admission Letter.</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span><b>[  ] DECLINE</b> the offer of admission and relinquish the allocated seat.</span>
                    </p>
                  </div>

                  <p className="text-gray-700 text-[11px]">
                    By accepting this offer, I agree to abide by all the school regulations, cooperate with the school authorities, and fulfill the requisite financial obligations as outlined in the terminal fees schedule.
                  </p>

                  <div className="grid grid-cols-2 gap-6 text-xs pt-4 print:pt-2">
                    <div className="space-y-4 print:space-y-3">
                      <div>
                        <p className="text-black font-semibold">Parent/Guardian's Signature:</p>
                        <div className="border-b border-black w-full h-8 print:h-6"></div>
                      </div>
                      <div>
                        <p className="text-black font-semibold">Contact Number:</p>
                        <div className="border-b border-black w-full h-8 print:h-6"></div>
                      </div>
                    </div>
                    <div className="space-y-4 print:space-y-3 flex flex-col justify-between">
                      <div>
                        <p className="text-black font-semibold">Date Signed:</p>
                        <div className="border-b border-black w-full h-8 print:h-6"></div>
                      </div>
                      <div className="text-right pt-2">
                        <p className="font-bold">{school.headTeacherName || headmasterName}</p>
                        <p className="text-gray-600 text-[10px]">Head Teacher, {school.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-black p-4 rounded text-[11px] text-gray-800 space-y-1.5 mt-6">
                  <h5 className="font-bold uppercase tracking-wider text-[10px]">Important Return Guidelines:</h5>
                  <p>
                    Please carefully complete, sign, and return this slip physically to the Head Teacher's / Administration office of <b>{school.name}</b> on or before <b>{school.reopeningDate ? new Date(new Date(school.reopeningDate).getTime() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Friday, September 4, 2026'}</b>.
                  </p>
                  <p className="text-[10px]">
                    * Failure to submit this acceptance slip before the deadline may result in forfeiture of the admission slot to candidates on the waitlist.
                  </p>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
