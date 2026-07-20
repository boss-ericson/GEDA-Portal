import React, { useState, useEffect } from 'react';
import { School, Student, AcademicRecord, SubjectScore, Role } from '../types';
import { Award, PlusCircle, Printer, Search, RefreshCw, ChevronDown, ChevronRight, FileText } from 'lucide-react';

interface AcademicCenterProps {
  school: School;
  students: Student[];
  isOffline: boolean;
  user?: any;
  role?: Role;
}

const PRIMARY_SUBJECTS = [
  "English Language", "Mathematics", "Science", "Our World Our People", 
  "Religious and Moral Education", "Computing", "Creative Arts", 
  "Physical Education", "Ghanaian Language"
];


const ATTITUDES = [
  "Respectful and courteous",
  "Hardworking and diligent",
  "Attentive and focused",
  "Helpful and cooperative",
  "Needs to improve focus",
  "Easily distracted",
  "Shows leadership qualities"
];

const CONDUCTS = [
  "Excellent behavior",
  "Good behavior",
  "Satisfactory behavior",
  "Needs improvement",
  "Disruptive in class",
  "Follows school rules"
];

const INTERESTS = [
  "Sports and Athletics",
  "Reading and Literature",
  "Science and Nature",
  "Arts and Crafts",
  "Music and Drama",
  "Technology and Computing"
];

const JHS_SUBJECTS = [
  "English Language", "Mathematics", "Science", "Social Studies", 
  "Religious and Moral Education", "Computing", "Creative Arts and Design", 
  "Career Technology", "French", "Ghanaian Language"
];

export default function AcademicCenter({ school, students, isOffline, user, role }: AcademicCenterProps) {
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [termAttendance, setTermAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeClass, setActiveClass] = useState<string>('JHS 1');
  const [term, setTerm] = useState<string>(school.academicTerm || 'First');
  const [year, setYear] = useState<string>(school.academicYear || '2026/2027');
  const [nextTermBegins, setNextTermBegins] = useState<string>(school.reopeningDate || '');
  const [passMark, setPassMark] = useState<number>(400);
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editRecord, setEditRecord] = useState<AcademicRecord | null>(null);

  
  const [historicalClasses, setHistoricalClasses] = useState<Record<string, string>>({});

  const fetchRecords = async () => {
    if (isOffline) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/academic-records?schoolId=${school.id}&academicYear=${year}&academicTerm=${term}`);
      if (res.ok) {
        setRecords(await res.json());
      }
      
      const attRes = await fetch(`/api/v1/attendance?schoolId=${school.id}&academicYear=${year}&academicTerm=${term}`);
      if (attRes.ok) {
        setTermAttendance(await attRes.json());
      }

      const yearRes = await fetch(`/api/v1/academic-records?schoolId=${school.id}&academicYear=${year}`);
      if (yearRes.ok) {
        const yearRecords = await yearRes.json();
        const map: Record<string, string> = {};
        yearRecords.forEach((r: any) => {
          map[r.studentId] = r.classLevel;
        });
        setHistoricalClasses(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchRecords();
  }, [school.id, year, term, isOffline]);

  const isSubjectEditable = (subjectName: string) => {
    if (role !== 'Teacher') return true; // Admin/Staff has full access
    if (!user) return true;
    
    if (user.department === 'JHS') {
      if (activeClass.startsWith('JHS')) {
        if (user.isClassTeacher && user.assignedClass === activeClass) return true;
        return user.subject === subjectName;
      }
      return false;
    }

    if (user.department === 'Primary') {
      if (!activeClass.startsWith('JHS')) {
        return user.assignedClass === activeClass;
      }
      return false;
    }

    return true; // Fallback
  };

  const isOtherFieldsEditable = () => {
    if (role !== 'Teacher') return true;
    if (!user) return true;
    
    if (user.department === 'JHS') {
      if (activeClass.startsWith('JHS')) {
        return user.isClassTeacher && user.assignedClass === activeClass;
      }
      return false;
    }

    if (user.department === 'Primary') {
      if (!activeClass.startsWith('JHS')) {
        return user.assignedClass === activeClass;
      }
      return false;
    }
    
    return true;
  };

    const CLASS_PROGRESSION = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'JHS 1', 'JHS 2', 'JHS 3', 'Graduated'];
  
  const getStartYear = (y: string) => parseInt(y.split('/')[0]) || 0;
  
  const classStudents = students.filter(s => {
    const recordForThisTerm = records.find(r => r.studentId === s.id);
    if (recordForThisTerm) {
      return recordForThisTerm.classLevel === activeClass;
    }
    
    if (historicalClasses[s.id]) {
      return historicalClasses[s.id] === activeClass;
    }
    
    if (year === (school.academicYear || '2026/2027')) {
      return s.classLevel === activeClass;
    }
    
    const diff = getStartYear(school.academicYear || '2026/2027') - getStartYear(year);
    if (diff > 0) {
      const currentIdx = CLASS_PROGRESSION.indexOf(s.classLevel);
      if (currentIdx !== -1) {
        const targetIdx = currentIdx - diff;
        if (targetIdx >= 0) {
          return CLASS_PROGRESSION[targetIdx] === activeClass;
        }
      }
    } else if (diff < 0) {
      const currentIdx = CLASS_PROGRESSION.indexOf(s.classLevel);
      if (currentIdx !== -1) {
        const targetIdx = currentIdx - diff;
        if (targetIdx < CLASS_PROGRESSION.length) {
          return CLASS_PROGRESSION[targetIdx] === activeClass;
        }
      }
    }
    
    return s.classLevel === activeClass;
  });

  const handleEditScores = (student: Student) => {
    let rec = records.find(r => r.studentId === student.id);
    if (!rec) {
      const isJHS = activeClass.startsWith('JHS');
      const subjects = isJHS ? JHS_SUBJECTS : PRIMARY_SUBJECTS;
      rec = {
        id: '',
        schoolId: school.id,
        studentId: student.id,
        academicYear: year,
        academicTerm: term,
        classLevel: student.classLevel,
        scores: subjects.map(s => ({ subject: s })),
        updatedAt: ''
      };
    } else {
      // make sure subjects are populated
      const isJHS = student.classLevel.startsWith('JHS');
      const subjects = isJHS ? JHS_SUBJECTS : PRIMARY_SUBJECTS;
      const scores = [...rec.scores];
      subjects.forEach(sub => {
        if (!scores.find(s => s.subject === sub)) {
          scores.push({ subject: sub });
        }
      });
      rec = { ...rec, scores };
    }
    setSelectedStudent(student);
    setEditRecord(rec);
  };

  const handleScoreChange = (index: number, field: keyof SubjectScore, val: string) => {
    if (!editRecord) return;
    let num = val === '' ? undefined : Number(val);
    if (num !== undefined && isNaN(num)) return; // reject non-numeric input
    
    // Validation capping
    if (num !== undefined) {
      if (field === 'exam') {
        if (num > 100) num = 100;
        if (num < 0) num = 0;
      } else if (field === 'cat1' || field === 'groupWork' || field === 'cat2' || field === 'projectWork') {
        if (num > 15) num = 15;
        if (num < 0) num = 0;
      }
    }

    const newScores = [...editRecord.scores];
    newScores[index] = { ...newScores[index], [field]: num };
    setEditRecord({ ...editRecord, scores: newScores });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;
    if (isOffline) {
      alert('Cannot save academic records in offline mode.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/academic-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRecord)
      });
      if (res.ok) {
        const saved = await res.json();
        setRecords(prev => {
          const idx = prev.findIndex(r => r.id === saved.id || (r.studentId === saved.studentId && r.academicTerm === saved.academicTerm && r.academicYear === saved.academicYear));
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = saved;
            return copy;
          }
          return [...prev, saved];
        });
        setEditRecord(null);
        setSelectedStudent(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to save: ${errData.error || res.statusText}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Network error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateSbaTotal = (score: SubjectScore) => {
    const total = (score.cat1 || 0) + (score.groupWork || 0) + (score.cat2 || 0) + (score.projectWork || 0);
    // Max 60, scaled to 50
    return Math.round((total / 60) * 50) || 0;
  };

  const calculateExamTotal = (score: SubjectScore) => {
    // Max 100, scaled to 50
    return Math.round(((score.exam || 0) / 100) * 50) || 0;
  };

  const calculateTotal = (score: SubjectScore) => {
    return calculateSbaTotal(score) + calculateExamTotal(score);
  };

  const getGrade = (total: number) => {
    if (total >= 80) return '1';
    if (total >= 70) return '2';
    if (total >= 60) return '3';
    if (total >= 50) return '4';
    if (total >= 40) return '5';
    return '6';
  };

  const generateReportHTML = (student: Student, record: AcademicRecord | undefined, rank: number = 0) => {
    if (!record) return '<p>No records found.</p>';
    
    const isJHS = record.classLevel.startsWith('JHS');
    
    const studentAtt = termAttendance.filter(a => a.studentId === student.id);
    const attTotal = studentAtt.length;
    const attPresent = studentAtt.filter(a => a.status === 'Present' || a.status === 'Late').length;

    // Helper to get grade remarks
    const getRemark = (total: number) => {
      if (total >= 80) return 'HIGHEST';
      if (total >= 70) return 'HIGH';
      if (total >= 45) return 'CREDIT';
      if (total >= 35) return 'PASS';
      return 'FAIL';
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

    let coreGrades: number[] = [];
    let otherGrades: number[] = [];
    let totalRawScore: number = 0;

    let html = `
      <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 0; border: 2px solid #000080; color: #000;">
        <div style="text-align: center; padding: 5px 20px;">
          <h1 style="margin: 0; font-size: 22px; color: #000080; text-transform: uppercase;">${school.name}</h1>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
            <div style="width: 100px; height: 120px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; background: #f0f0f0; font-size: 10px; overflow: hidden;">
              ${student.passportPicture ? `<img src="${student.passportPicture}" style="width: 100%; height: 100%; object-fit: cover;" />` : 'Photo Space'}
            </div>
            <div style="flex-1; padding: 0 10px; font-weight: bold; font-size: 14px;">
              <p style="margin: 3px 0;">${school.district ? 'ADDRESS: ' + school.district : 'POST OFFICE BOX ...'}</p>
              <p style="margin: 3px 0;">CONTACT: ${school.headTeacherPhone || '+233...'}</p>
              <p style="margin: 3px 0;">MOTTO: RAISING GENERATIONAL THINKERS</p>
              <div style="background-color: #000080; color: white; padding: 8px; margin-top: 10px; font-size: 16px; font-weight: bold;">
                LEARNER'S TERMINAL REPORT
              </div>
            </div>
            <div style="width: 100px; height: 100px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; background: #f0f0f0; font-size: 10px; overflow: hidden;">
              ${school.logo ? `<img src="${school.logo}" style="width: 100%; height: 100%; object-fit: contain;" />` : 'School Logo'}
            </div>
          </div>
        </div>
        <div style="border-top: 2px solid #000; padding: 5px 20px; font-size: 12px; font-weight: bold;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <div>NAME: <span style="text-decoration: underline; text-transform: uppercase;">${student.fullName}</span></div>
            <div>CLASS: <span style="text-decoration: underline;">${record.classLevel}</span></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <div>NUMBER ON ROLL: <span style="text-decoration: underline;">${classStudents.length}</span></div>
            <div>POSITION IN CLASS: <span style="text-decoration: underline; width: 100px; display: inline-block;">${rank ? getOrdinalSuffix(rank) : ''}</span></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <div>ACADEMIC YEAR: <span style="text-decoration: underline;">${record.academicYear}</span></div>
            <div>TERM: <span style="text-decoration: underline; text-transform: uppercase;">${record.academicTerm}</span></div>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <div>NEXT TERM BEGINS: <span style="text-decoration: underline;">${nextTermBegins || school.reopeningDate || '...'}</span></div>
            <div>VACATION DATE: <span style="text-decoration: underline;">${school.vacationDate || '...'}</span></div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; border-top: 2px solid #000; border-bottom: 2px solid #000; font-size: 13px; text-align: center; font-weight: bold;">
          <thead>
            <tr style="background-color: #000080; color: white;">
              <th style="padding: 4px; border: 1px solid #000; text-align: left;">SUBJECT</th>
              <th style="padding: 4px; border: 1px solid #000; width: 80px;">CLASS SCORE<br/>(50%)</th>
              <th style="padding: 4px; border: 1px solid #000; width: 80px;">EXAM SCORE<br/>(50%)</th>
              <th style="padding: 4px; border: 1px solid #000; width: 80px;">TOTAL SCORE<br/>(100%)</th>
              <th style="padding: 4px; border: 1px solid #000; width: 80px;">${isJHS ? 'GRADE' : 'POSITION'}</th>
              <th style="padding: 4px; border: 1px solid #000; width: 100px;">REMARKS</th>
            </tr>
          </thead>
          <tbody>
    `;

    record.scores.forEach(s => {
      const sba = calculateSbaTotal(s);
      const exam = calculateExamTotal(s);
      const total = sba + exam;
      totalRawScore += total;
      const remark = getRemark(total);
      
      let column5 = '';
      if (isJHS) {
        if (total > 0) {
          const beceGrade = getBECEGrade(total);
          column5 = beceGrade.toString();
          if (['English Language', 'Mathematics', 'Science', 'Social Studies'].includes(s.subject)) {
            coreGrades.push(beceGrade);
          } else {
            otherGrades.push(beceGrade);
          }
        }
      } else {
        if (total > 0) {
          const subRank = getSubjectRank(student.id, s.subject);
          column5 = subRank > 0 ? getOrdinalSuffix(subRank) : '';
        }
      }

      html += `
        <tr>
          <td style="padding: 4px 6px; border: 1px solid #000; text-align: left; text-transform: uppercase;">${s.subject}</td>
          <td style="padding: 4px 6px; border: 1px solid #000;">${sba || ''}</td>
          <td style="padding: 4px 6px; border: 1px solid #000;">${exam || ''}</td>
          <td style="padding: 4px 6px; border: 1px solid #000;">${total || ''}</td>
          <td style="padding: 4px 6px; border: 1px solid #000;">${column5}</td>
          <td style="padding: 4px 6px; border: 1px solid #000;">${total ? remark : ''}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>

        <div style="padding: 10px 20px; font-size: 12px; font-weight: bold; line-height: 1.5;">
    `;

    if (isJHS) {
      const allGrades = [...coreGrades, ...otherGrades].sort((a, b) => a - b);
      const bestSix = allGrades.slice(0, 6).reduce((sum, g) => sum + g, 0);
      
      otherGrades.sort((a, b) => a - b);
      const coreSum = coreGrades.reduce((sum, g) => sum + g, 0);
      const twoBestOthersSum = otherGrades.slice(0, 2).reduce((sum, g) => sum + g, 0);
      const actualAgg = coreSum + twoBestOthersSum;

      html += `
          <div style="display: flex; gap: 20px; margin-bottom: 10px; background-color: #f8fafc; padding: 4px; border: 1px dashed #000080;">
            <div>BEST SIX AGGREGATE: <span style="text-decoration: underline;">${bestSix > 0 ? bestSix : '____'}</span></div>
            <div>ACTUAL AGGREGATE: <span style="text-decoration: underline;">${actualAgg > 0 ? actualAgg : '____'}</span></div>
            <div>RAW SCORE: <span style="text-decoration: underline;">${totalRawScore > 0 ? totalRawScore : '____'} / 1000</span></div>
          </div>
      `;
    }


    let nextClassStr = '______________________';
    if (record.academicTerm.toLowerCase().includes('third')) {
      const isPass = totalRawScore >= passMark;
      if (isPass) {
        const currentIdx = CLASS_PROGRESSION.indexOf(record.classLevel);
        if (currentIdx !== -1 && currentIdx < CLASS_PROGRESSION.length - 1) {
          nextClassStr = CLASS_PROGRESSION[currentIdx + 1];
        } else {
          nextClassStr = 'GRADUATED';
        }
      } else {
        nextClassStr = 'REPEATED THE CLASS';
      }
    }

    html += `
          <div style="display: flex; gap: 20px; margin-bottom: 5px;">
            <div style="flex: 1;">ATTENDANCE: <span style="text-decoration: underline;">${attPresent > 0 || attTotal > 0 ? attPresent : '____'}</span> OUT OF <span style="text-decoration: underline;">${attTotal > 0 ? attTotal : '____'}</span></div>
            <div style="flex: 1;">PROMOTED TO: <span style="text-decoration: underline;">${nextClassStr}</span></div>
          </div>
          <div style="display: flex; gap: 20px; margin-bottom: 5px;">
            <div style="flex: 1;">ATTITUDE: <span style=\"text-decoration: underline;\">${record.attitude || '_____________________'}</span></div>
            <div style="flex: 1;">CONDUCT: <span style=\"text-decoration: underline;\">${record.conduct || '_____________________'}</span></div>
          </div>
          <div style="display: flex; gap: 20px; margin-bottom: 5px;">
            <div style="flex: 1;">INTEREST: <span style=\"text-decoration: underline;\">${record.interest || '_____________________'}</span></div>
          </div>
          <div style="display: flex; gap: 20px; margin-top: 10px;">
            <div style="flex: 1;">CLASS TEACHER'S REMARKS: <span style=\"text-decoration: underline;\">${record.teacherRemarks || '___________________________________'}</span></div>
          </div>
          <div style="display: flex; gap: 20px; margin-top: 10px;">
            <div style="flex: 1;">HEADTEACHER'S SIGNATURE: ___________________________________</div>
          </div>
        </div>
      </div>
    `;
    return html;
  };

  const printReport = (student: Student, record: AcademicRecord | undefined) => {
    const html = generateReportHTML(student, record, getStudentRank(student.id));
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Report Card - ${student.fullName}</title>
            <style>
              @media print {
                body { -webkit-print-color-adjust: exact; }
              }
            </style>
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

  
  const getSubjectRank = (studentId: string, subject: string) => {
    const classStudentIds = classStudents.map(s => s.id);
    const classRecords = records.filter(r => classStudentIds.includes(r.studentId));
    
    const subjectTotals = classRecords.map(r => {
      const sScore = r.scores.find(s => s.subject === subject);
      let sum = 0;
      if (sScore) {
        sum = calculateSbaTotal(sScore) + calculateExamTotal(sScore);
      }
      return { studentId: r.studentId, total: sum };
    });
    
    subjectTotals.sort((a, b) => b.total - a.total);
    const rankings = new Map<string, number>();
    subjectTotals.forEach((t, index) => {
      if (index > 0 && t.total === subjectTotals[index - 1].total) {
        rankings.set(t.studentId, rankings.get(subjectTotals[index - 1].studentId) || 1);
      } else {
        rankings.set(t.studentId, index + 1);
      }
    });
    return rankings.get(studentId) || 0;
  };

  const getStudentRank = (studentId: string) => {
    const classStudentIds = classStudents.map(s => s.id);
    const classRecords = records.filter(r => classStudentIds.includes(r.studentId));
    
    const totals = classRecords.map(r => {
      let sum = 0;
      r.scores.forEach(s => sum += calculateSbaTotal(s) + calculateExamTotal(s));
      return { studentId: r.studentId, total: sum };
    });

    totals.sort((a, b) => b.total - a.total);
    
    let currentRank = 1;
    let previousTotal = -1;
    let studentsWithSameRank = 0;
    const rankings = new Map<string, number>();
    
    totals.forEach((t, index) => {
      if (index > 0 && t.total === totals[index - 1].total) {
        rankings.set(t.studentId, rankings.get(totals[index - 1].studentId) || 1);
      } else {
        rankings.set(t.studentId, index + 1);
      }
    });
    
    return rankings.get(studentId) || 0;
  };

  const getOrdinalSuffix = (i: number) => {
    if (i === 0) return '';
    const j = i % 10, k = i % 100;
    if (j === 1 && k !== 11) return i + "st";
    if (j === 2 && k !== 12) return i + "nd";
    if (j === 3 && k !== 13) return i + "rd";
    return i + "th";
  };

  
  const printBroadSheet = () => {
    const classStudentIds = classStudents.map(s => s.id);
    const classRecords = records.filter(r => classStudentIds.includes(r.studentId));
    
    const data = classStudents.map(student => {
      const record = classRecords.find(r => r.studentId === student.id);
      let totalScore = 0;
      if (record) {
        record.scores.forEach(s => totalScore += calculateSbaTotal(s) + calculateExamTotal(s));
      }
      return { student, totalScore, rank: getStudentRank(student.id) };
    });
    
    data.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.student.fullName.localeCompare(b.student.fullName);
    });

    let html = `
      <html>
        <head>
          <title>Broad Sheet - ${activeClass}</title>
          <style>
            @media print { body { -webkit-print-color-adjust: exact; } }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-family: sans-serif; font-size: 12px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
            h2 { text-align: center; font-family: sans-serif; margin-bottom: 5px; }
            p { text-align: center; font-family: sans-serif; margin-top: 0; }
          </style>
        </head>
        <body>
          <h2>${school.name}</h2>
          <p>BROAD SHEET - ${activeClass} (${term} Term, ${year})</p>
          <table>
            <thead>
              <tr>
                <th>POSITION</th>
                <th>STUDENT NAME</th>
                <th>ADMISSION NO</th>
                <th>TOTAL SCORE (MAX 1000)</th>
                <th>REMARKS</th>
              </tr>
            </thead>
            <tbody>
    `;

    data.forEach(d => {
      html += `
        <tr>
          <td><strong>${d.rank ? getOrdinalSuffix(d.rank) : '-'}</strong></td>
          <td>${d.student.fullName}</td>
          <td>${d.student.admissionNo}</td>
          <td>${d.totalScore}</td>
          <td style="font-weight: bold; color: ${d.totalScore >= passMark ? 'green' : 'red'};">${d.totalScore >= passMark ? 'Pass' : 'Fail'}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <script>
            window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
          </script>
        </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const printBulkReports = () => {
    let combinedHTML = '';
    classStudents.forEach((student, index) => {
      const record = records.find(r => r.studentId === student.id);
      let html = generateReportHTML(student, record, getStudentRank(student.id));
      if (index < classStudents.length - 1) {
        html += '<div style="page-break-after: always; height: 0; clear: both;"></div>';
      }
      combinedHTML += html;
    });

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Bulk Reports - ${activeClass}</title>
            <style>
              @media print {
                body { -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${combinedHTML}
            <script>
              window.onload = () => { 
                setTimeout(() => {
                  window.print(); 
                  window.close(); 
                }, 500);
              }
            </script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };


  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-950 dark:text-white">Exams/Academic Center</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">Manage student SBA, Exam Records, and terminal reports.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <select value={year} onChange={e => setYear(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1 sm:flex-initial">
            <option value="2025/2026">2025/2026</option>
            <option value="2026/2027">2026/2027</option>
          </select>
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1 sm:flex-initial">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">Pass:</span>
            <input 
              type="number" 
              value={passMark}
              onChange={e => setPassMark(Number(e.target.value))}
              className="w-12 text-center font-bold text-slate-700 dark:text-slate-300 outline-none"
              min="0"
              max="1000"
            />
          </div>
          <select value={term} onChange={e => setTerm(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1 sm:flex-initial">
            <option value="First">First Term</option>
            <option value="Second">Second Term</option>
            <option value="Third">Third Term</option>
          </select>
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1 sm:flex-initial">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">Next Term:</span>
            <input 
              type="date" 
              value={nextTermBegins}
              onChange={e => setNextTermBegins(e.target.value)}
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none w-28 bg-transparent"
            />
          </div>
          <button onClick={fetchRecords} disabled={loading} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950 cursor-pointer">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none overflow-hidden flex flex-col md:flex-row">
        {/* Class Selector Sidebar - horizontal row on mobile, sidebar on desktop */}
        <div className="w-full md:w-48 bg-slate-50 dark:bg-slate-950 border-r border-b md:border-b-0 border-slate-200 dark:border-slate-700 p-4 shrink-0">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 hidden md:block">Select Class</h3>
          <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
            {Array.from(new Set([...CLASS_PROGRESSION, ...students.map(s => s.classLevel)])).filter(Boolean).map(cls => (
              <button
                key={cls}
                onClick={() => setActiveClass(cls)}
                className={`px-3 py-1.5 md:py-2 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 whitespace-nowrap text-center ${
                  activeClass === cls ? 'bg-amber-100 text-amber-900 border border-amber-200 md:border-none' : 'text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 md:bg-transparent hover:bg-slate-200 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 md:border-none'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Student List & Actions */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-base sm:text-lg">{activeClass} Students</h3>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                onClick={printBroadSheet}
                disabled={classStudents.length === 0}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Printer className="h-3 w-3" />
                <span>Broad Sheet</span>
              </button>
              <button
                onClick={printBulkReports}
                disabled={classStudents.length === 0}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Printer className="h-3 w-3" />
                <span>Bulk Reports</span>
              </button>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">{classStudents.length} Total</span>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-mono text-[9px] sm:text-[10px]">
                  <tr>
                    <th className="py-2.5 px-2 sm:py-3 sm:px-4">Student Name</th>
                    <th className="py-2.5 px-2 sm:py-3 sm:px-4 text-center">Status</th>
                    <th className="py-2.5 px-2 sm:py-3 sm:px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map(student => {
                    const hasRecord = records.some(r => r.studentId === student.id);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950/50">
                        <td className="py-2.5 px-2 sm:py-3 sm:px-4 font-medium text-slate-900 dark:text-white">
                          <span className="text-xs sm:text-sm">{student.fullName}</span>
                          <span className="block text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono">{student.admissionNo}</span>
                        </td>
                        <td className="py-2.5 px-2 sm:py-3 sm:px-4 text-center">
                          {hasRecord ? (
                            <span className="bg-green-50 text-green-700 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-200">Recorded</span>
                          ) : (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">Pending</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 sm:py-3 sm:px-4 text-right">
                          <div className="flex justify-end gap-1.5 sm:gap-2">
                            <button
                              onClick={() => handleEditScores(student)}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                            >
                              {hasRecord ? 'Edit' : 'Enter'}
                            </button>
                            <button
                              onClick={() => printReport(student, records.find(r => r.studentId === student.id))}
                              disabled={!hasRecord}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1 whitespace-nowrap"
                            >
                              <Printer className="h-3 w-3" />
                              <span className="hidden sm:inline">Report</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {classStudents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 text-xs">No students found in this class.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Edit Scores */}
      {selectedStudent && editRecord && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex sm:items-center sm:justify-center p-0 sm:p-4">
          <div className="absolute inset-0 sm:relative sm:inset-auto bg-white dark:bg-slate-900 w-full sm:h-auto sm:max-h-[92vh] sm:rounded-3xl sm:max-w-5xl border-0 sm:border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-950 py-3.5 px-5 sm:py-4 sm:px-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm sm:text-base">Academic Records - {selectedStudent.fullName}</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">{activeClass} | {term} Term, {year}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-1.5 sm:p-2 hover:bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer text-slate-500 dark:text-slate-400 transition text-lg leading-none">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 pb-2 shrink-0">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 sm:p-3 flex gap-2 sm:gap-3 text-[11px] sm:text-xs text-amber-800 items-start">
                  <Award className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                  <p>
                    <strong>SBA:</strong> CAT 1, Grp Work, CAT 2, Project (Max 15 each). Total 60 scaled to 50%.<br/>
                    <strong>Exam:</strong> Raw score out of 100 scaled to 50%.
                  </p>
                </div>
              </div>

              <div className="flex-1 w-full overflow-hidden relative">
                <div className="absolute inset-0 overflow-auto px-4 sm:px-6 pb-4">
                <div className="min-w-[800px] sm:min-w-[900px]">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.1)] before:content-[''] before:absolute before:inset-0 before:bg-slate-50 dark:bg-slate-950 before:-z-10">
                      <tr>
                        <th className="p-2 border border-slate-200 dark:border-slate-700">Subject</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700 w-16 sm:w-20 text-center" title="Class Assessment Task 1 (Max 15)">CAT 1<br/>(15)</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700 w-16 sm:w-20 text-center" title="Group Work (Max 15)">Grp Work<br/>(15)</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700 w-16 sm:w-20 text-center" title="Class Assessment Task 2 (Max 15)">CAT 2<br/>(15)</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700 w-16 sm:w-20 text-center" title="Project Work (Max 15)">Project<br/>(15)</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700 bg-amber-50 w-16 sm:w-20 text-center">SBA<br/>(50%)</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700 w-20 sm:w-24 text-center" title="Exam Score (Max 100)">Exam<br/>(100)</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700 bg-amber-50 w-16 sm:w-20 text-center">Exam<br/>(50%)</th>
                        <th className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white w-20 sm:w-24 text-center">Total<br/>(100%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editRecord.scores.map((score, idx) => {
                        const sbaTotal = calculateSbaTotal(score);
                        const examTotal = calculateExamTotal(score);
                        const finalTotal = sbaTotal + examTotal;
                        
                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950/30">
                            <td className="p-2 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white text-[11px] sm:text-xs">{score.subject}</td>
                            <td className="p-1 sm:p-1.5 border border-slate-200 dark:border-slate-700">
                              <input disabled={!isSubjectEditable(score.subject)} type="text" inputMode="numeric" pattern="[0-9]*" value={score.cat1 ?? ''} onChange={e => handleScoreChange(idx, 'cat1', e.target.value)} className="w-full p-2 sm:p-1 text-center text-base sm:text-xs border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-500 disabled:opacity-100" />
                            </td>
                            <td className="p-1 sm:p-1.5 border border-slate-200 dark:border-slate-700">
                              <input disabled={!isSubjectEditable(score.subject)} type="text" inputMode="numeric" pattern="[0-9]*" value={score.groupWork ?? ''} onChange={e => handleScoreChange(idx, 'groupWork', e.target.value)} className="w-full p-2 sm:p-1 text-center text-base sm:text-xs border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-500 disabled:opacity-100" />
                            </td>
                            <td className="p-1 sm:p-1.5 border border-slate-200 dark:border-slate-700">
                              <input disabled={!isSubjectEditable(score.subject)} type="text" inputMode="numeric" pattern="[0-9]*" value={score.cat2 ?? ''} onChange={e => handleScoreChange(idx, 'cat2', e.target.value)} className="w-full p-2 sm:p-1 text-center text-base sm:text-xs border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-500 disabled:opacity-100" />
                            </td>
                            <td className="p-1 sm:p-1.5 border border-slate-200 dark:border-slate-700">
                              <input disabled={!isSubjectEditable(score.subject)} type="text" inputMode="numeric" pattern="[0-9]*" value={score.projectWork ?? ''} onChange={e => handleScoreChange(idx, 'projectWork', e.target.value)} className="w-full p-2 sm:p-1 text-center text-base sm:text-xs border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-500 disabled:opacity-100" />
                            </td>
                            <td className="p-2 border border-slate-200 dark:border-slate-700 bg-amber-50 text-center font-bold text-slate-700 dark:text-slate-300 text-xs">{sbaTotal}</td>
                            <td className="p-1 sm:p-1.5 border border-slate-200 dark:border-slate-700">
                              <input disabled={!isSubjectEditable(score.subject)} type="text" inputMode="numeric" pattern="[0-9]*" value={score.exam ?? ''} onChange={e => handleScoreChange(idx, 'exam', e.target.value)} className="w-full p-2 sm:p-1 text-center text-base sm:text-xs border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-500 disabled:opacity-100" />
                            </td>
                            <td className="p-2 border border-slate-200 dark:border-slate-700 bg-amber-50 text-center font-bold text-slate-700 dark:text-slate-300 text-xs">{examTotal}</td>
                            <td className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-center font-bold text-slate-900 dark:text-white text-xs">{finalTotal} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 ml-1">({getGrade(finalTotal)})</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-50 dark:bg-slate-950 shrink-0">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Attitude</label>
                  <select 
                    disabled={!isOtherFieldsEditable()}
                    value={editRecord.attitude || ''} 
                    onChange={e => setEditRecord({...editRecord, attitude: e.target.value})}
                    className="w-full p-2 sm:p-2 border border-slate-200 dark:border-slate-700 rounded text-base sm:text-xs outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-500 disabled:opacity-100"
                  >
                    <option value="">Select Attitude...</option>
                    {ATTITUDES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Conduct</label>
                  <select 
                    disabled={!isOtherFieldsEditable()}
                    value={editRecord.conduct || ''} 
                    onChange={e => setEditRecord({...editRecord, conduct: e.target.value})}
                    className="w-full p-2 sm:p-2 border border-slate-200 dark:border-slate-700 rounded text-base sm:text-xs outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-500 disabled:opacity-100"
                  >
                    <option value="">Select Conduct...</option>
                    {CONDUCTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Interest</label>
                  <select 
                    disabled={!isOtherFieldsEditable()}
                    value={editRecord.interest || ''} 
                    onChange={e => setEditRecord({...editRecord, interest: e.target.value})}
                    className="w-full p-2 sm:p-2 border border-slate-200 dark:border-slate-700 rounded text-base sm:text-xs outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-500 disabled:opacity-100"
                  >
                    <option value="">Select Interest...</option>
                    {INTERESTS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Teacher Remarks</label>
                  <input 
                    disabled={!isOtherFieldsEditable()}
                    type="text"
                    value={editRecord.teacherRemarks || ''} 
                    onChange={e => setEditRecord({...editRecord, teacherRemarks: e.target.value})}
                    className="w-full p-2 sm:p-2 border border-slate-200 dark:border-slate-700 rounded text-base sm:text-xs outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-500 disabled:opacity-100"
                    placeholder="Enter custom remarks..."
                  />
                                </div>
              </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-700 p-3 sm:p-4 flex justify-end gap-2.5 sm:gap-3 shrink-0">
                <button type="button" onClick={() => setSelectedStudent(null)} className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-semibold text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 transition cursor-pointer">
                  Cancel
                </button>
                <button disabled={isSaving} type="submit" className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-semibold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 dark:text-white transition cursor-pointer shadow-sm dark:shadow-none disabled:opacity-75 disabled:cursor-not-allowed">
                  {isSaving ? 'Saving...' : 'Save Academic Records'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
