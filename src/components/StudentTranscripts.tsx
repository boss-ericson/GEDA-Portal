import React, { useState, useEffect } from 'react';
import { School, Student, AcademicRecord } from '../types';
import { Printer, Search, FileText } from 'lucide-react';

interface Props {
  school: School;
  students: Student[];
}

export default function StudentTranscripts({ school, students }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateSbaTotal = (score: any) => {
    const total = (score.cat1 || 0) + (score.groupWork || 0) + (score.cat2 || 0) + (score.projectWork || 0);
    return Math.round((total / 60) * 50) || 0;
  };

  const calculateExamTotal = (score: any) => {
    return Math.round(((score.exam || 0) / 100) * 50) || 0;
  };

  const getRemark = (total: number) => {
    if (total >= 80) return 'HIGHEST';
    if (total >= 70) return 'HIGH';
    if (total >= 60) return 'AVERAGE';
    if (total >= 50) return 'LOW';
    return 'LOWEST';
  };

  const getBECEGrade = (total: number) => {
    if (total >= 80) return 1;
    if (total >= 70) return 2;
    if (total >= 60) return 3;
    if (total >= 55) return 4;
    if (total >= 50) return 5;
    if (total >= 45) return 6;
    if (total >= 40) return 7;
    if (total >= 35) return 8;
    return 9;
  };

  useEffect(() => {
    if (selectedStudent) {
      setLoading(true);
      fetch(`/api/v1/academic-records?schoolId=${school.id}&studentId=${selectedStudent.id}`)
        .then(r => r.json())
        .then(data => {
          setRecords(data);
          setLoading(false);
        })
        .catch(console.error);
    }
  }, [school.id, selectedStudent]);

  const printTranscript = () => {
    if (!selectedStudent || records.length === 0) return;

    let html = `
      <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 2px solid #000080; color: #000;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px; color: #000080; text-transform: uppercase;">${school.name}</h1>
          <p style="margin: 5px 0; font-size: 14px; font-weight: bold;">ACADEMIC TRANSCRIPT</p>
          <p style="margin: 5px 0; font-size: 12px;">${school.district ? school.district : ''} | Contact: ${school.headTeacherPhone || ''}</p>
        </div>

        <div style="margin-bottom: 20px; font-size: 14px;">
          <table style="width: 100%;">
            <tr>
              <td><strong>Student Name:</strong> ${selectedStudent.fullName}</td>
              <td><strong>Admission No:</strong> ${selectedStudent.admissionNo}</td>
            </tr>
            <tr>
              <td><strong>Date of Birth:</strong> ${new Date(selectedStudent.dob).toLocaleDateString()}</td>
              <td><strong>Gender:</strong> ${selectedStudent.gender}</td>
            </tr>
          </table>
        </div>
    `;

    // Group records by Academic Year and Term
    records.sort((a, b) => {
      if (a.academicYear !== b.academicYear) return a.academicYear.localeCompare(b.academicYear);
      return a.academicTerm.localeCompare(b.academicTerm);
    });

    records.forEach(record => {
      const isJHS = record.classLevel.startsWith('JHS');
      
      html += `
        <div style="margin-bottom: 20px;">
          <h3 style="background-color: #f0f0f0; padding: 5px; margin: 0 0 10px 0; border: 1px solid #000;">
            ${record.academicYear} - ${record.academicTerm} Term (${record.classLevel})
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;" border="1">
            <thead>
              <tr style="background-color: #e0e0e0;">
                <th style="padding: 5px;">Subject</th>
                <th style="padding: 5px; text-align: center;">Class (50%)</th>
                <th style="padding: 5px; text-align: center;">Exam (50%)</th>
                <th style="padding: 5px; text-align: center;">Total (100%)</th>
                ${isJHS ? '<th style="padding: 5px; text-align: center;">Grade</th>' : ''}
                <th style="padding: 5px;">Remarks</th>
              </tr>
            </thead>
            <tbody>
      `;

      record.scores.forEach(s => {
        const sba = calculateSbaTotal(s);
        const exam = calculateExamTotal(s);
        const total = sba + exam;
        const remark = getRemark(total);
        let beceGradeStr = '';
        if (isJHS && total > 0) {
          beceGradeStr = getBECEGrade(total).toString();
        }

        html += `
          <tr>
            <td style="padding: 5px;">${s.subject}</td>
            <td style="padding: 5px; text-align: center;">${sba || '-'}</td>
            <td style="padding: 5px; text-align: center;">${exam || '-'}</td>
            <td style="padding: 5px; text-align: center; font-weight: bold;">${total || '-'}</td>
            ${isJHS ? '<td style="padding: 5px; text-align: center;">' + beceGradeStr + '</td>' : ''}
            <td style="padding: 5px;">${total ? remark : '-'}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    });

    html += `
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="text-align: center;">
            <p>__________________________</p>
            <p style="font-weight: bold; font-size: 12px;">Prepared By</p>
          </div>
          <div style="text-align: center;">
            <p>__________________________</p>
            <p style="font-weight: bold; font-size: 12px;">Head Teacher Signature</p>
          </div>
        </div>
      </div>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Transcript - ${selectedStudent.fullName}</title>
          </head>
          <body>
            ${html}
            <script>
              window.onload = () => { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-slate-950 dark:text-white">Student Transcripts</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Generate complete academic history transcripts for current and past students.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row h-[600px]">
        {/* Student List Sidebar */}
        <div className="w-full md:w-1/3 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-slate-950/50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search students..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-700 transition"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredStudents.map(student => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`w-full text-left p-3 rounded-xl transition ${
                  selectedStudent?.id === student.id 
                    ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-500/50' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-semibold text-sm">{student.fullName}</div>
                <div className="text-xs font-mono opacity-70">{student.admissionNo} • {student.classLevel}</div>
              </button>
            ))}
            {filteredStudents.length === 0 && (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">No students found.</div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
          {selectedStudent ? (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">{selectedStudent.fullName}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">
                    {selectedStudent.admissionNo} | {selectedStudent.classLevel} | {selectedStudent.gender}
                  </p>
                </div>
                <button
                  onClick={printTranscript}
                  disabled={loading || records.length === 0}
                  className="flex items-center gap-2 bg-brand-green-700 hover:bg-brand-green-800 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  <Printer className="h-4 w-4" />
                  Print Transcript
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex justify-center items-center h-32 text-slate-500 dark:text-slate-400">Loading records...</div>
                ) : records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
                    <FileText className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No academic records found</p>
                    <p className="text-xs text-slate-400 mt-1">This student hasn't been graded for any term yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Academic History</h4>
                    <div className="grid gap-4">
                      {records.sort((a, b) => {
                        if (a.academicYear !== b.academicYear) return b.academicYear.localeCompare(a.academicYear);
                        return b.academicTerm.localeCompare(a.academicTerm);
                      }).map((record, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{record.academicYear} - {record.academicTerm} Term</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Class: {record.classLevel}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{record.scores.length} Subjects Graded</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <FileText className="h-16 w-16 mb-4 text-slate-200" />
              <p className="text-lg font-medium">Select a student</p>
              <p className="text-sm">Choose a student from the list to view their transcript.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
