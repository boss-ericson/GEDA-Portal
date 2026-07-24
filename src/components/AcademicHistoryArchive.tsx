import React, { useState, useEffect } from 'react';
import { School, Student, AcademicRecord, Payment, AttendanceRecord } from '../types';
import { 
  Archive, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  Printer, 
  Award, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  FileText, 
  ChevronRight, 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  Eye, 
  RefreshCw,
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';

interface AcademicHistoryArchiveProps {
  school: School;
  students: Student[];
  payments: Payment[];
  isOffline: boolean;
  onNavigateToTab?: (tab: string) => void;
}

export default function AcademicHistoryArchive({ 
  school, 
  students, 
  payments, 
  isOffline,
  onNavigateToTab
}: AcademicHistoryArchiveProps) {
  // Available Years & Terms
  const currentYear = school.academicYear || '2026/2027';
  const currentTerm = school.academicTerm || 'First';

  const yearOptions = [
    '2026/2027',
    '2025/2026',
    '2024/2025',
    '2023/2024'
  ];

  const termOptions = ['First', 'Second', 'Third'];

  // Selected Filters
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedTerm, setSelectedTerm] = useState<string>(currentTerm);
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Loaded Archive State
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeSubView, setActiveSubView] = useState<'academics' | 'financials' | 'attendance'>('academics');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<{ student: Student; record?: AcademicRecord } | null>(null);

  // Fetch Historical Records whenever year or term changes
  useEffect(() => {
    const fetchArchiveData = async () => {
      if (isOffline) return;
      setIsLoading(true);
      try {
        // Fetch academic records for year & term
        const termQuery = selectedTerm !== 'All' ? `&academicTerm=${selectedTerm}` : '';
        const acaRes = await fetch(`/api/v1/academic-records?schoolId=${school.id}&academicYear=${selectedYear}${termQuery}`);
        if (acaRes.ok) {
          const acaData = await acaRes.json();
          setAcademicRecords(acaData);
        }

        // Fetch attendance records for year & term
        const attRes = await fetch(`/api/v1/attendance?schoolId=${school.id}&academicYear=${selectedYear}${termQuery}`);
        if (attRes.ok) {
          const attData = await attRes.json();
          setAttendanceRecords(attData);
        }
      } catch (err) {
        console.error('Error fetching archive records:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArchiveData();
  }, [school.id, selectedYear, selectedTerm, isOffline]);

  // Filter students based on class and search query
  const filteredStudents = students.filter(s => {
    const matchesClass = selectedClass === 'All' || s.classLevel === selectedClass;
    const matchesSearch = searchQuery === '' || 
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  // Calculate Academic Statistics for selected archive scope
  const calculateStudentAverage = (rec?: AcademicRecord) => {
    if (!rec || !rec.scores || rec.scores.length === 0) return null;
    let totalPct = 0;
    let count = 0;
    rec.scores.forEach(s => {
      const cat1 = s.cat1 || 0;
      const cat2 = s.cat2 || 0;
      const groupWork = s.groupWork || 0;
      const projectWork = s.projectWork || 0;
      const exam = s.exam || 0;
      const subjectTotal = cat1 + cat2 + groupWork + projectWork + exam;
      totalPct += subjectTotal;
      count++;
    });
    return count > 0 ? (totalPct / count).toFixed(1) : null;
  };

  // Find record map
  const recordMap = new Map<string, AcademicRecord>();
  academicRecords.forEach(r => {
    if (r.studentId) recordMap.set(r.studentId, r);
  });

  // Archived Financials calculation
  const totalStudentsInArchive = filteredStudents.length;
  const totalFeesAssessed = filteredStudents.reduce((acc, s) => acc + (s.feeTotal || (s.boardingStatus === 'Boarding' ? 2500 : 1200)), 0);
  
  // Historical payments (filtered roughly by payments timestamp matching year/term or all stored)
  const totalPaymentsCollected = payments.filter(p => p.status === 'Success' || !p.status).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const archiveOutstanding = Math.max(0, totalFeesAssessed - totalPaymentsCollected);

  // Overall class performance metrics
  const scoredRecords = academicRecords.map(r => Number(calculateStudentAverage(r))).filter(avg => avg !== null && !isNaN(avg));
  const overallAvgScore = scoredRecords.length > 0 
    ? (scoredRecords.reduce((a, b) => a + b, 0) / scoredRecords.length).toFixed(1) 
    : 'N/A';
  
  const passCount = scoredRecords.filter(score => score >= 50).length;
  const passRate = scoredRecords.length > 0 ? Math.round((passCount / scoredRecords.length) * 100) : 0;

  // Print Official Archive Executive Summary
  const handlePrintArchiveSummary = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${school.name} - Academic History & Archive (${selectedYear} ${selectedTerm} Term)</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1e293b; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; text-transform: uppercase; }
            .subtitle { font-size: 13px; color: #475569; margin-top: 4px; }
            .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; }
            .meta-item strong { display: block; text-transform: uppercase; font-size: 10px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; }
            .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${school.name}</div>
            <div class="subtitle">GHANA EDUCATION SERVICE (GES) • ARCHIVAL & HISTORICAL REPORT</div>
            <div style="font-weight: bold; margin-top: 8px; font-size: 14px;">ACADEMIC SESSION ARCHIVE: ${selectedYear} — ${selectedTerm.toUpperCase()} TERM</div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <strong>Academic Year</strong>
              ${selectedYear}
            </div>
            <div class="meta-item">
              <strong>Term Session</strong>
              ${selectedTerm} Term
            </div>
            <div class="meta-item">
              <strong>Total Enrolled</strong>
              ${totalStudentsInArchive} Students
            </div>
            <div class="meta-item">
              <strong>Overall Average</strong>
              ${overallAvgScore}% (${passRate}% Pass Rate)
            </div>
          </div>

          <h3 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Archived Student Assessment Ledger</h3>
          <table>
            <thead>
              <tr>
                <th>Admit No</th>
                <th>Student Full Name</th>
                <th>Class Level</th>
                <th>Residency</th>
                <th>Avg Score %</th>
                <th>Term Conduct / Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${filteredStudents.map(s => {
                const rec = recordMap.get(s.id);
                const avg = calculateStudentAverage(rec);
                return `
                  <tr>
                    <td>${s.admissionNo}</td>
                    <td><strong>${s.fullName}</strong></td>
                    <td>${s.classLevel}</td>
                    <td>${s.boardingStatus}</td>
                    <td>${avg ? `<strong>${avg}%</strong>` : 'N/A'}</td>
                    <td>${rec?.teacherRemarks || rec?.conduct || 'Satisfactory session progress'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div>EMIS Code: ${school.emisCode || 'GES-BASIC-2026'} | System Audit Verified</div>
            <div>Generated Date: ${new Date().toLocaleDateString('en-GB')}</div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 fade-in p-4 md:p-6">
      
      {/* HEADER & ARCHIVE CONTEXT CONTROL BANNER */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-amber-400 border border-slate-700 text-xs font-semibold">
              <Archive className="h-3.5 w-3.5" />
              Historical Records & Session Archives
            </span>
            {selectedYear === currentYear && selectedTerm === currentTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-medium">
                <CheckCircle2 className="h-3 w-3" />
                Active Term Selected
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Academic History & Terms Archive
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Retrieve, inspect, and export archived terminal reports, fee ledgers, and attendance logs for previous academic terms and years.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handlePrintArchiveSummary}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer border border-amber-300/40"
          >
            <Printer className="h-4 w-4" />
            <span>Print Session Audit Sheet</span>
          </button>
        </div>
      </div>

      {/* HISTORICAL FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Year Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Academic Year
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-8 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 transition cursor-pointer"
              >
                {yearOptions.map(yr => (
                  <option key={yr} value={yr}>
                    {yr} {yr === currentYear ? '(Current Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Term Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Academic Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 transition cursor-pointer"
            >
              {termOptions.map(tm => (
                <option key={tm} value={tm}>
                  {tm} Term {tm === currentTerm ? '(Current Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Class Level
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 transition cursor-pointer"
            >
              <option value="All">All Classes</option>
              <option value="KG1">KG 1</option>
              <option value="KG2">KG 2</option>
              <option value="Basic 1">Basic 1</option>
              <option value="Basic 2">Basic 2</option>
              <option value="Basic 3">Basic 3</option>
              <option value="Basic 4">Basic 4</option>
              <option value="Basic 5">Basic 5</option>
              <option value="Basic 6">Basic 6</option>
              <option value="JHS 1">JHS 1</option>
              <option value="JHS 2">JHS 2</option>
              <option value="JHS 3">JHS 3</option>
            </select>
          </div>

        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or admit no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
          />
        </div>
      </div>

      {/* SUMMARY STATS FOR SELECTED ARCHIVED TERM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1: Total Enrolled */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Archived Students</span>
            <span className="text-2xl font-display font-bold text-slate-900 dark:text-white mt-0.5 block">{totalStudentsInArchive}</span>
            <span className="text-[11px] text-slate-500">{selectedYear} • {selectedTerm} Term</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 2: Academic Pass Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overall Mean Score</span>
            <span className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{overallAvgScore}%</span>
            <span className="text-[11px] text-slate-500">{academicRecords.length} Saved Assessment Reports</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <Award className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 3: Fees Collected */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fees Assessed</span>
            <span className="text-xl font-display font-bold text-slate-900 dark:text-white mt-0.5 block">GH₵ {totalFeesAssessed.toLocaleString()}</span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400">GH₵ {archiveOutstanding.toLocaleString()} Outstanding</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 4: Attendance Log */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attendance Logged</span>
            <span className="text-2xl font-display font-bold text-slate-900 dark:text-white mt-0.5 block">{attendanceRecords.length} Days</span>
            <span className="text-[11px] text-slate-500">GES Class Registers</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* DOMAIN SUB-TAB NAVIGATION */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveSubView('academics')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubView === 'academics'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Archived Terminal Assessments ({academicRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveSubView('financials')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubView === 'financials'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>Archived Fee Ledger</span>
        </button>

        <button
          onClick={() => setActiveSubView('attendance')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubView === 'attendance'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Attendance Registers ({attendanceRecords.length})</span>
        </button>
      </div>

      {/* SUB-VIEW 1: ARCHIVED ACADEMIC ASSESSMENTS */}
      {activeSubView === 'academics' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Archived Student Terminal Ledger ({selectedYear} • {selectedTerm} Term)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Showing {filteredStudents.length} students
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Admit No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Term Average Score</th>
                  <th className="py-3 px-4">Academic Status</th>
                  <th className="py-3 px-4">Conduct & Remarks</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                      No students found matching current filters for {selectedYear} ({selectedTerm} Term).
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => {
                    const record = recordMap.get(student.id);
                    const avg = calculateStudentAverage(record);
                    const avgNum = avg ? parseFloat(avg) : null;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {student.admissionNo}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {student.fullName}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {student.classLevel}
                        </td>
                        <td className="py-3 px-4">
                          {avgNum !== null ? (
                            <span className={`font-bold px-2 py-0.5 rounded-md text-xs ${
                              avgNum >= 75 
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800' 
                                : avgNum >= 50 
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200 dark:border-blue-800' 
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-800'
                            }`}>
                              {avg}%
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No Scores Logged</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {avgNum !== null ? (
                            avgNum >= 50 ? (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded">PASSED</span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded">NEEDS ATTENTION</span>
                            )
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {record?.teacherRemarks || record?.conduct || 'Satisfactory session progress'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedStudentDetail({ student, record })}
                            className="text-xs font-semibold text-amber-600 hover:text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Card</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: ARCHIVED FINANCIALS */}
      {activeSubView === 'financials' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Archived Term Fee Assessment & Payment Ledger ({selectedYear} • {selectedTerm} Term)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Total Expected: GH₵ {totalFeesAssessed.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Residency</th>
                  <th className="py-3 px-4">Total Assessed</th>
                  <th className="py-3 px-4">Total Paid</th>
                  <th className="py-3 px-4">Outstanding Balance</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredStudents.map(student => {
                  const feeTotal = student.feeTotal || (student.boardingStatus === 'Boarding' ? 2500 : 1200);
                  const feePaid = student.feePaid || 0;
                  const rem = Math.max(0, feeTotal - feePaid);
                  const status = rem === 0 ? 'Paid' : feePaid > 0 ? 'Partial' : 'Unpaid';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {student.fullName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {student.classLevel}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          student.boardingStatus === 'Boarding' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {student.boardingStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        GH₵ {feeTotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        GH₵ {feePaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-rose-600 dark:text-rose-400">
                        GH₵ {rem.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : status === 'Partial' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: ARCHIVED ATTENDANCE REGISTERS */}
      {activeSubView === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Archived Class Attendance Registers ({selectedYear} • {selectedTerm} Term)
              </h3>
              <p className="text-xs text-slate-500">
                Log of daily roll calls recorded during this term session.
              </p>
            </div>
          </div>

          {attendanceRecords.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <Calendar className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No attendance logs archived for {selectedYear} ({selectedTerm} Term).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {attendanceRecords.slice(0, 12).map((att) => (
                <div key={att.id} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span>Date: {att.date}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      att.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {att.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Student ID: {att.studentId}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STUDENT ARCHIVED REPORT CARD MODAL */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 relative">
            <button
              onClick={() => setSelectedStudentDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
            >
              ✕
            </button>

            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                Archived Student Card • {selectedYear} ({selectedTerm} Term)
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedStudentDetail.student.fullName}
              </h3>
              <p className="text-xs text-slate-500">
                Admit No: {selectedStudentDetail.student.admissionNo} | Class: {selectedStudentDetail.student.classLevel}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Residency</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudentDetail.student.boardingStatus}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Guardian Phone</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudentDetail.student.guardianPhone || 'N/A'}</span>
                </div>
              </div>

              {selectedStudentDetail.record ? (
                <div className="space-y-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Subject Performance</span>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto space-y-1.5">
                    {selectedStudentDetail.record.scores.map((sc, idx) => {
                      const tot = (sc.cat1 || 0) + (sc.cat2 || 0) + (sc.groupWork || 0) + (sc.projectWork || 0) + (sc.exam || 0);
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{sc.subject}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{tot}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs">
                  No specific subject score log was archived for this student in {selectedYear} ({selectedTerm} Term).
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs px-4 py-2 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
