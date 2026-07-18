import React, { useState, useEffect } from 'react';
import { School, Student, AcademicRecord } from '../types';
import { X, Printer, Calendar, BookOpen, Award } from 'lucide-react';

interface Props {
  school: School;
  student: Student;
  onClose: () => void;
}

const calculateSbaTotal = (score: any) => {
  const total = (score.cat1 || 0) + (score.groupWork || 0) + (score.cat2 || 0) + (score.projectWork || 0);
  return Math.round((total / 60) * 50) || 0;
};
const calculateExamTotal = (score: any) => {
  return Math.round(((score.exam || 0) / 100) * 50) || 0;
};

export default function StudentHistoryModal({ school, student, onClose }: Props) {
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/academic-records?schoolId=${school.id}&studentId=${student.id}`)
      .then(r => r.json())
      .then(data => {
        setRecords(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [school.id, student.id]);

  const printReport = async (record: AcademicRecord) => {
    try {
      const attRes = await fetch(`/api/v1/attendance?schoolId=${school.id}&studentId=${student.id}&academicYear=${record.academicYear}&academicTerm=${record.academicTerm}`);
      const attData = await attRes.json();
      const attTotal = attData.length;
      const attPresent = attData.filter((a: any) => a.status === 'Present' || a.status === 'Late').length;

      const yearRes = await fetch(`/api/v1/academic-records?schoolId=${school.id}&academicYear=${record.academicYear}&academicTerm=${record.academicTerm}`);
      const yearData = await yearRes.json();
      const classSize = yearData.filter((r: any) => r.classLevel === record.classLevel).length;

      const isJHS = record.classLevel.startsWith('JHS');
      
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

      let coreGrades: number[] = [];
      let otherGrades: number[] = [];

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
            <div>NUMBER ON ROLL: <span style="text-decoration: underline;">${classSize}</span></div>
            <div>POSITION IN CLASS: <span style="text-decoration: underline; width: 100px; display: inline-block;"></span></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <div>ACADEMIC YEAR: <span style="text-decoration: underline;">${record.academicYear}</span></div>
            <div>TERM: <span style="text-decoration: underline; text-transform: uppercase;">${record.academicTerm}</span></div>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <div>NEXT TERM BEGINS: <span style="text-decoration: underline;">${school.reopeningDate || '...'}</span></div>
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
          </div>
        `;
      }
      html += `
          <div style="display: flex; gap: 20px; margin-bottom: 5px;">
            <div style="flex: 1;">ATTENDANCE: <span style="text-decoration: underline;">${attPresent > 0 || attTotal > 0 ? attPresent : '____'}</span> OUT OF <span style="text-decoration: underline;">${attTotal > 0 ? attTotal : '____'}</span></div>
            <div style="flex: 1;">PROMOTED TO: ______________________</div>
          </div>
          <div style="display: flex; gap: 20px; margin-bottom: 5px;">
            <div style="flex: 1;">ATTITUDE: <span style="text-decoration: underline;">${record.attitude || '_____________________'}</span></div>
            <div style="flex: 1;">CONDUCT: <span style="text-decoration: underline;">${record.conduct || '_____________________'}</span></div>
          </div>
          <div style="display: flex; gap: 20px; margin-bottom: 5px;">
            <div style="flex: 1;">INTEREST: <span style="text-decoration: underline;">${record.interest || '_____________________'}</span></div>
          </div>
          <div style="display: flex; gap: 20px; margin-top: 10px;">
            <div style="flex: 1;">CLASS TEACHER'S REMARKS: <span style="text-decoration: underline;">${record.teacherRemarks || '___________________________________'}</span></div>
          </div>
          <div style="display: flex; gap: 20px; margin-top: 10px;">
            <div style="flex: 1;">HEADTEACHER'S SIGNATURE: ___________________________________</div>
          </div>
        </div>
      </div>
      `;

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
    } catch (err) {
      console.error(err);
      alert('Failed to generate report card.');
    }
  };
return (
    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex p-4 overflow-y-auto fade-in no-print">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full m-auto border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Academic History</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">All historical records for {student.fullName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading historical records...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
              <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Records Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">This student has no past academic records in the system.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {records.sort((a, b) => b.academicYear.localeCompare(a.academicYear)).map(record => (
                <div key={record.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm dark:shadow-none flex flex-col justify-between hover:border-amber-300 transition-colors">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {record.academicYear}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{record.academicTerm} Term</span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="h-4 w-4 text-slate-400" />
                      Class: {record.classLevel}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Recorded: {new Date(record.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => printReport(record)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Report Card
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
