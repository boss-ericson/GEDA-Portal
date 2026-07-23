import React, { useState, useEffect, useRef } from 'react';
import { School, Student, BeceMockRecord, BeceSubjectScore, Role } from '../types';
import { 
  GraduationCap, Award, BarChart3, TrendingUp, TrendingDown, BookOpen, 
  PlusCircle, Search, Save, Download, Printer, FileSpreadsheet, Sparkles, 
  Filter, CheckCircle2, AlertTriangle, ChevronRight, User, Users, RefreshCw, 
  Layers, Trophy, Target, ShieldCheck, Edit3, Trash2, ArrowRight
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import * as XLSX from 'xlsx';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useReactToPrint } from 'react-to-print';

interface BeceMockCenterProps {
  school: School;
  students: Student[];
  isOffline: boolean;
  user?: any;
  role?: Role;
}

export const BECE_CORE_SUBJECTS = [
  "English Language",
  "Mathematics",
  "Integrated Science",
  "Social Studies"
];

export const BECE_ELECTIVE_SUBJECTS = [
  "Computing",
  "Career Technology",
  "Creative Arts and Design",
  "Religious and Moral Education",
  "Ghanaian Language",
  "French",
  "Arabic"
];

export const DEFAULT_MOCK_NAMES = [
  "School Mock 1",
  "School Mock 2",
  "School Mock 3",
  "School Mock 4",
  "School Mock 5",
  "Municipal Mock 1",
  "Municipal Mock 2",
  "District Super Mock",
  "Regional Mock",
  "National Mock",
  "External Mock 1",
  "External Mock 2"
];

export const convertScoreToWaecGrade = (score: number) => {
  const s = Math.max(0, Math.min(100, Math.round(score || 0)));
  if (s >= 80) return { grade: 1, remark: 'Highest / Distinction', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  if (s >= 75) return { grade: 2, remark: 'Higher / Distinction', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' };
  if (s >= 70) return { grade: 3, remark: 'High / Credit', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  if (s >= 65) return { grade: 4, remark: 'High Average / Credit', color: 'bg-blue-500/15 text-blue-300 border-blue-500/20' };
  if (s >= 60) return { grade: 5, remark: 'Average / Credit', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
  if (s >= 55) return { grade: 6, remark: 'Low Average / Credit', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  if (s >= 50) return { grade: 7, remark: 'Low / Pass', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
  if (s >= 40) return { grade: 8, remark: 'Lower / Pass', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
  return { grade: 9, remark: 'Lowest / Fail', color: 'bg-red-600/30 text-red-400 border-red-500/40' };
};

export const calculateBeceAggregates = (scores: BeceSubjectScore[]) => {
  if (!scores || scores.length === 0) {
    return { actualAggregate: 54, best6Aggregate: 54, coreSum: 36, best2ElectiveSum: 18 };
  }

  // 1. Core Subjects Aggregate (Mandatory 4 Core)
  let coreSum = 0;
  BECE_CORE_SUBJECTS.forEach(coreSubj => {
    const found = scores.find(s => s.subject === coreSubj);
    coreSum += found ? (found.grade || 9) : 9;
  });

  // 2. Best 2 Electives
  const electives = scores.filter(s => !BECE_CORE_SUBJECTS.includes(s.subject));
  const electiveGrades = electives.map(s => s.grade || 9).sort((a, b) => a - b);
  const best2ElectiveSum = (electiveGrades[0] || 9) + (electiveGrades[1] || 9);

  // Actual Aggregate = 4 Core + 2 Best Electives
  const actualAggregate = coreSum + best2ElectiveSum;

  // 3. Best 6 Aggregate (Top 6 lowest numerical grades across ALL subjects)
  const allGrades = scores.map(s => s.grade || 9).sort((a, b) => a - b);
  let best6Aggregate = 0;
  for (let i = 0; i < 6; i++) {
    best6Aggregate += allGrades[i] !== undefined ? allGrades[i] : 9;
  }

  return { actualAggregate, best6Aggregate, coreSum, best2ElectiveSum };
};

export const getShsPlacementCategory = (actualAgg: number) => {
  if (actualAgg <= 12) return { category: "Category A SHS (Top Tier)", description: "Eligible for PRESEC, Achimota, Wesley Girls, Prempeh, Mfantsipim", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" };
  if (actualAgg <= 18) return { category: "Category B SHS (High Tier)", description: "Eligible for Ghana National, Opoku Ware, Aburi Girls, Mawuli", badge: "bg-blue-500/20 text-blue-400 border-blue-500/40" };
  if (actualAgg <= 24) return { category: "Category C SHS (Standard Tier)", description: "Eligible for Regional and District Model Senior High Schools", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" };
  if (actualAgg <= 36) return { category: "Category D SHS / Technical", description: "Eligible for Community Senior High & TVET Technical Institutes", badge: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
  return { category: "Remedial Support Required", description: "Aggregate exceeds pass threshold; needs focused revision", badge: "bg-rose-500/20 text-rose-400 border-rose-500/40" };
};

export default function BeceMockCenter({ school, students, isOffline, user, role }: BeceMockCenterProps) {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'scores' | 'rankings' | 'analytics' | 'slip'>('scores');
  
  // Mock Exam Selection
  const [mockList, setMockList] = useState<string[]>(DEFAULT_MOCK_NAMES);
  const [selectedMock, setSelectedMock] = useState<string>("School Mock 1");
  const [showAddMockModal, setShowAddMockModal] = useState(false);
  const [newMockInput, setNewMockInput] = useState('');

  // Filtering
  const [selectedClass, setSelectedClass] = useState<string>('JHS 3');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Records state
  const [mockRecords, setMockRecords] = useState<BeceMockRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Candidate Slip Selected Student
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  
  // Print reference for candidate slip
  const printSlipRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef: printSlipRef,
    documentTitle: `BECE_Candidate_Slip_${selectedCandidateId || 'Report'}`
  });

  // Filter students for JHS candidates
  const candidateStudents = students.filter(s => {
    if (s.admissionStatus === 'Rejected') return false;
    if (selectedClass === 'All JHS') {
      return s.classLevel?.toUpperCase().includes('JHS') || s.classLevel?.toUpperCase().includes('BASIC 7') || s.classLevel?.toUpperCase().includes('BASIC 8') || s.classLevel?.toUpperCase().includes('BASIC 9');
    }
    return s.classLevel?.toUpperCase() === selectedClass.toUpperCase();
  });

  const filteredCandidates = candidateStudents.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load records from Firestore / LocalStorage
  const fetchMockRecords = async () => {
    setLoading(true);
    try {
      const localKey = `geda_bece_mock_${school.id}`;
      const localData = localStorage.getItem(localKey);
      let loaded: BeceMockRecord[] = localData ? JSON.parse(localData) : [];

      if (!isOffline && db) {
        const q = query(collection(db, 'bece_mock_records'), where('schoolId', '==', school.id));
        const querySnapshot = await getDocs(q);
        const remoteData: BeceMockRecord[] = [];
        querySnapshot.forEach(docSnap => {
          remoteData.push({ id: docSnap.id, ...docSnap.data() } as BeceMockRecord);
        });
        if (remoteData.length > 0) {
          loaded = remoteData;
          localStorage.setItem(localKey, JSON.stringify(remoteData));
        }
      }

      setMockRecords(loaded);

      // Extract custom mock names if any exist in records
      const customMocks = Array.from(new Set(loaded.map(r => r.mockName))).filter(m => !DEFAULT_MOCK_NAMES.includes(m));
      if (customMocks.length > 0) {
        setMockList(prev => Array.from(new Set([...prev, ...customMocks])));
      }
    } catch (err: any) {
      console.error("Error fetching BECE mock records:", err);
      showNotification('error', 'Failed to sync with cloud DB. Using cached offline data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMockRecords();
  }, [school.id]);

  const showNotification = (type: 'success' | 'error' | 'info', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Add custom mock name
  const handleCreateMock = () => {
    if (!newMockInput.trim()) return;
    const name = newMockInput.trim();
    if (!mockList.includes(name)) {
      setMockList(prev => [...prev, name]);
    }
    setSelectedMock(name);
    setNewMockInput('');
    setShowAddMockModal(false);
    showNotification('success', `New Mock Exam "${name}" created and selected!`);
  };

  // Helper to get or build a record for a candidate in current selected mock
  const getRecordForStudent = (studentId: string): BeceMockRecord => {
    const existing = mockRecords.find(r => r.studentId === studentId && r.mockName === selectedMock);
    if (existing) return existing;

    // Create blank scores
    const allSubjects = [...BECE_CORE_SUBJECTS, ...BECE_ELECTIVE_SUBJECTS];
    const initialScores: BeceSubjectScore[] = allSubjects.map(subj => ({
      subject: subj,
      isCore: BECE_CORE_SUBJECTS.includes(subj),
      score: 0,
      grade: 9,
      gradeRemarks: 'Lowest / Fail'
    }));

    const studentObj = students.find(s => s.id === studentId);
    const aggs = calculateBeceAggregates(initialScores);

    return {
      id: `${school.id}_${studentId}_${selectedMock.replace(/\s+/g, '_')}`,
      studentId,
      schoolId: school.id,
      mockName: selectedMock,
      academicYear: school.academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      classLevel: studentObj?.classLevel || selectedClass,
      scores: initialScores,
      actualAggregate: aggs.actualAggregate,
      best6Aggregate: aggs.best6Aggregate,
      coreAggregate: aggs.coreSum,
      best2ElectiveAggregate: aggs.best2ElectiveSum,
      updatedAt: new Date().toISOString()
    };
  };

  // Handle score change for student & subject
  const handleScoreChange = (studentId: string, subjectName: string, rawScoreVal: string) => {
    const scoreNum = Math.max(0, Math.min(100, parseInt(rawScoreVal, 10) || 0));
    const gradeObj = convertScoreToWaecGrade(scoreNum);

    setMockRecords(prevRecords => {
      const existingIdx = prevRecords.findIndex(r => r.studentId === studentId && r.mockName === selectedMock);
      let targetRecord: BeceMockRecord;

      if (existingIdx >= 0) {
        targetRecord = JSON.parse(JSON.stringify(prevRecords[existingIdx]));
      } else {
        targetRecord = getRecordForStudent(studentId);
      }

      // Update subject score
      const subjIdx = targetRecord.scores.findIndex(s => s.subject === subjectName);
      if (subjIdx >= 0) {
        targetRecord.scores[subjIdx].score = scoreNum;
        targetRecord.scores[subjIdx].grade = gradeObj.grade;
        targetRecord.scores[subjIdx].gradeRemarks = gradeObj.remark;
      } else {
        targetRecord.scores.push({
          subject: subjectName,
          isCore: BECE_CORE_SUBJECTS.includes(subjectName),
          score: scoreNum,
          grade: gradeObj.grade,
          gradeRemarks: gradeObj.remark
        });
      }

      // Recalculate aggregates
      const aggs = calculateBeceAggregates(targetRecord.scores);
      targetRecord.actualAggregate = aggs.actualAggregate;
      targetRecord.best6Aggregate = aggs.best6Aggregate;
      targetRecord.coreAggregate = aggs.coreSum;
      targetRecord.best2ElectiveAggregate = aggs.best2ElectiveSum;
      targetRecord.updatedAt = new Date().toISOString();

      if (existingIdx >= 0) {
        const copy = [...prevRecords];
        copy[existingIdx] = targetRecord;
        return copy;
      } else {
        return [...prevRecords, targetRecord];
      }
    });
  };

  // Save all mock records to Firestore and LocalStorage
  const handleSaveAllRecords = async () => {
    setIsSaving(true);
    try {
      const localKey = `geda_bece_mock_${school.id}`;
      localStorage.setItem(localKey, JSON.stringify(mockRecords));

      if (!isOffline && db) {
        for (const record of mockRecords) {
          if (record.mockName === selectedMock) {
            const docRef = doc(db, 'bece_mock_records', record.id);
            await setDoc(docRef, record, { merge: true });
          }
        }
      }

      showNotification('success', `Successfully saved BECE Mock records for ${selectedMock}!`);
    } catch (err: any) {
      console.error("Save error:", err);
      showNotification('error', "Failed to save to cloud database. Saved to local device cache.");
    } finally {
      setIsSaving(false);
    }
  };

  // Seed realistic mock data generator for instant demo testing
  const handleSeedDemoData = () => {
    if (candidateStudents.length === 0) {
      showNotification('info', 'No candidates found in selected class to generate seed scores.');
      return;
    }

    const mocksToSeed = ["School Mock 1", "School Mock 2", "School Mock 3", "Municipal Mock 1"];
    const allSubjects = [...BECE_CORE_SUBJECTS, "Computing", "Career Technology", "Creative Arts and Design", "Religious and Moral Education", "Ghanaian Language"];

    const newRecords: BeceMockRecord[] = [...mockRecords];

    candidateStudents.forEach((student, idx) => {
      // Base student ability offset
      const basePerformance = 45 + ((idx * 17) % 45); // score between 45 and 90

      mocksToSeed.forEach((mName, mIdx) => {
        // Improvement factor per mock iteration
        const mockProgress = mIdx * 4;

        const scores: BeceSubjectScore[] = allSubjects.map(subj => {
          const isCore = BECE_CORE_SUBJECTS.includes(subj);
          // random variance
          const randomVar = (Math.sin(idx * 13 + subj.length + mIdx) * 12);
          const score = Math.max(35, Math.min(98, Math.round(basePerformance + mockProgress + randomVar)));
          const gObj = convertScoreToWaecGrade(score);

          return {
            subject: subj,
            isCore,
            score,
            grade: gObj.grade,
            gradeRemarks: gObj.remark
          };
        });

        const aggs = calculateBeceAggregates(scores);
        const recordId = `${school.id}_${student.id}_${mName.replace(/\s+/g, '_')}`;

        const recordObj: BeceMockRecord = {
          id: recordId,
          studentId: student.id,
          schoolId: school.id,
          mockName: mName,
          academicYear: school.academicYear || "2025/2026",
          classLevel: student.classLevel || selectedClass,
          scores,
          actualAggregate: aggs.actualAggregate,
          best6Aggregate: aggs.best6Aggregate,
          coreAggregate: aggs.coreSum,
          best2ElectiveAggregate: aggs.best2ElectiveSum,
          updatedAt: new Date().toISOString()
        };

        const existingIndex = newRecords.findIndex(r => r.id === recordId);
        if (existingIndex >= 0) {
          newRecords[existingIndex] = recordObj;
        } else {
          newRecords.push(recordObj);
        }
      });
    });

    setMockRecords(newRecords);
    localStorage.setItem(`geda_bece_mock_${school.id}`, JSON.stringify(newRecords));
    showNotification('success', `Generated sample scores for ${candidateStudents.length} candidates across 4 Mock Exams!`);
  };

  // Excel Export
  const handleExportExcel = () => {
    const exportData = filteredCandidates.map((s, idx) => {
      const rec = getRecordForStudent(s.id);
      const row: any = {
        'Index / Admission No': s.admissionNo,
        'Full Name': s.fullName,
        'Class Level': s.classLevel,
        'Gender': s.gender
      };

      // Add scores for each core
      BECE_CORE_SUBJECTS.forEach(cs => {
        const found = rec.scores.find(sc => sc.subject === cs);
        row[`${cs} (Score)`] = found ? found.score : 0;
        row[`${cs} (Grade)`] = found ? found.grade : 9;
      });

      // Add scores for electives
      BECE_ELECTIVE_SUBJECTS.forEach(es => {
        const found = rec.scores.find(sc => sc.subject === es);
        row[`${es} (Score)`] = found ? found.score : 0;
        row[`${es} (Grade)`] = found ? found.grade : 9;
      });

      row['Core Aggregate (4 Core)'] = rec.coreAggregate;
      row['2 Best Electives Sum'] = rec.best2ElectiveAggregate;
      row['ACTUAL BECE AGGREGATE (4 Core + 2 Best)'] = rec.actualAggregate;
      row['BEST 6 AGGREGATE (Top 6 Overall)'] = rec.best6Aggregate;
      row['SHS Category Forecast'] = getShsPlacementCategory(rec.actualAggregate).category;

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${selectedMock} Results`);
    XLSX.writeFile(workbook, `${school.slug || 'School'}_BECE_${selectedMock.replace(/\s+/g, '_')}_MasterSheet.xlsx`);
    showNotification('success', 'BECE Master Score Sheet exported to Excel!');
  };

  // Excel Import
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          showNotification('error', 'Excel file is empty.');
          return;
        }

        let updatedCount = 0;
        setMockRecords(prevRecords => {
          const newRecords = [...prevRecords];

          data.forEach(row => {
            const admNo = row['Index / Admission No'] || row['AdmissionNo'] || row['IndexNo'];
            const student = students.find(s => s.admissionNo === admNo || s.fullName.toLowerCase() === (row['Full Name'] || '').toLowerCase());
            
            if (student) {
              const recordId = `${school.id}_${student.id}_${selectedMock.replace(/\s+/g, '_')}`;
              const allSubjects = [...BECE_CORE_SUBJECTS, ...BECE_ELECTIVE_SUBJECTS];
              
              const scores: BeceSubjectScore[] = allSubjects.map(subj => {
                const score = parseInt(row[`${subj} (Score)`] || row[subj] || '0', 10) || 0;
                const gObj = convertScoreToWaecGrade(score);
                return {
                  subject: subj,
                  isCore: BECE_CORE_SUBJECTS.includes(subj),
                  score,
                  grade: gObj.grade,
                  gradeRemarks: gObj.remark
                };
              });

              const aggs = calculateBeceAggregates(scores);
              const recordObj: BeceMockRecord = {
                id: recordId,
                studentId: student.id,
                schoolId: school.id,
                mockName: selectedMock,
                academicYear: school.academicYear || "2025/2026",
                classLevel: student.classLevel,
                scores,
                actualAggregate: aggs.actualAggregate,
                best6Aggregate: aggs.best6Aggregate,
                coreAggregate: aggs.coreSum,
                best2ElectiveAggregate: aggs.best2ElectiveSum,
                updatedAt: new Date().toISOString()
              };

              const existingIdx = newRecords.findIndex(r => r.id === recordId);
              if (existingIdx >= 0) {
                newRecords[existingIdx] = recordObj;
              } else {
                newRecords.push(recordObj);
              }
              updatedCount++;
            }
          });

          return newRecords;
        });

        showNotification('success', `Imported score data for ${updatedCount} candidates successfully!`);
      } catch (err: any) {
        console.error("Excel import error:", err);
        showNotification('error', 'Failed to parse Excel file. Ensure valid headers.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Ranked Candidate List for Selected Mock
  const rankedCandidates = candidateStudents.map(student => {
    const rec = getRecordForStudent(student.id);
    return {
      student,
      record: rec,
      actualAgg: rec.actualAggregate,
      best6Agg: rec.best6Aggregate,
      coreAgg: rec.coreAggregate,
      best2ElectiveAgg: rec.best2ElectiveAggregate
    };
  }).sort((a, b) => a.actualAgg - b.actualAgg); // Lower aggregate is better

  // Summary Metrics
  const validRecords = rankedCandidates.filter(c => c.record.scores.some(s => s.score > 0));
  const avgActualAgg = validRecords.length > 0 ? (validRecords.reduce((acc, c) => acc + c.actualAgg, 0) / validRecords.length).toFixed(1) : '--';
  const avgBest6Agg = validRecords.length > 0 ? (validRecords.reduce((acc, c) => acc + c.best6Agg, 0) / validRecords.length).toFixed(1) : '--';
  const topCandidate = rankedCandidates[0];
  const passCandidates = validRecords.filter(c => c.actualAgg <= 36).length;
  const passRate = validRecords.length > 0 ? Math.round((passCandidates / validRecords.length) * 100) : 0;

  // Analytics Chart Data: Mock-to-Mock Progress for selected student or class average
  const getMockProgressChartData = () => {
    return mockList.map(mName => {
      const recordsForMock = mockRecords.filter(r => r.mockName === mName);
      if (recordsForMock.length === 0) return { name: mName, actualAgg: null, best6Agg: null };

      if (selectedCandidateId) {
        const studentRec = recordsForMock.find(r => r.studentId === selectedCandidateId);
        return {
          name: mName,
          actualAgg: studentRec ? studentRec.actualAggregate : null,
          best6Agg: studentRec ? studentRec.best6Aggregate : null
        };
      } else {
        const avgActual = recordsForMock.reduce((acc, r) => acc + r.actualAggregate, 0) / recordsForMock.length;
        const avgBest6 = recordsForMock.reduce((acc, r) => acc + r.best6Aggregate, 0) / recordsForMock.length;
        return {
          name: mName,
          actualAgg: parseFloat(avgActual.toFixed(1)),
          best6Agg: parseFloat(avgBest6.toFixed(1))
        };
      }
    }).filter(d => d.actualAgg !== null);
  };

  // Analytics Chart Data: Core Subjects Grade Breakdown
  const getCoreSubjectChartData = () => {
    return BECE_CORE_SUBJECTS.map(subj => {
      const currentMockRecs = mockRecords.filter(r => r.mockName === selectedMock);
      let totalScore = 0;
      let count = 0;

      currentMockRecs.forEach(r => {
        const s = r.scores.find(sc => sc.subject === subj);
        if (s && s.score > 0) {
          totalScore += s.score;
          count++;
        }
      });

      return {
        subject: subj.replace("Language", "").trim(),
        avgScore: count > 0 ? Math.round(totalScore / count) : 0
      };
    });
  };

  // Analytics Chart Data: SHS Category Distribution (Pie Chart)
  const getShsDistributionData = () => {
    const currentMockRecs = mockRecords.filter(r => r.mockName === selectedMock && r.scores.some(s => s.score > 0));
    let catA = 0, catB = 0, catC = 0, catD = 0, fail = 0;

    currentMockRecs.forEach(r => {
      const agg = r.actualAggregate;
      if (agg <= 12) catA++;
      else if (agg <= 18) catB++;
      else if (agg <= 24) catC++;
      else if (agg <= 36) catD++;
      else fail++;
    });

    return [
      { name: 'Cat A SHS (Agg 6-12)', value: catA, color: '#10b981' },
      { name: 'Cat B SHS (Agg 13-18)', value: catB, color: '#3b82f6' },
      { name: 'Cat C SHS (Agg 19-24)', value: catC, color: '#06b6d4' },
      { name: 'Cat D SHS (Agg 25-36)', value: catD, color: '#f59e0b' },
      { name: 'Remedial (Agg 37+)', value: fail, color: '#f43f5e' }
    ].filter(d => d.value > 0);
  };

  // Selected Candidate Object for Candidate Slip Tab
  const activeCandidateStudent = students.find(s => s.id === selectedCandidateId) || candidateStudents[0];
  const activeCandidateRecord = activeCandidateStudent ? getRecordForStudent(activeCandidateStudent.id) : null;
  const activeCandidatePlacement = activeCandidateRecord ? getShsPlacementCategory(activeCandidateRecord.actualAggregate) : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" /> WAEC BECE Standard
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2.5 py-0.5 rounded-full font-medium">
                Stanine Grading System (1 - 9)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-amber-400" />
              BECE Mock Exams Portal
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Comprehensive score collection, WAEC aggregate calculation (4 Core + 2 Best Electives vs Best 6), ranking analysis, and mock progress tracking for JHS candidates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSeedDemoData}
              className="bg-indigo-600/60 hover:bg-indigo-600 text-indigo-100 border border-indigo-400/30 text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              title="Generate sample mock scores for instant testing"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              Generate Demo Scores
            </button>

            <button
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="h-4 w-4" />
              Export Excel Sheet
            </button>

            <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              Import Excel
              <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between transition-all ${
          notification.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' :
          notification.type === 'error' ? 'bg-rose-950/40 border-rose-500/40 text-rose-200' :
          'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 text-rose-400" />}
            <span>{notification.text}</span>
          </div>
        </div>
      )}

      {/* Mock Exam Selector & Filters Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Selected Mock Exam Selector */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl p-1.5 pl-3">
            <span className="text-xs text-slate-400 font-medium">Mock Exam:</span>
            <select
              value={selectedMock}
              onChange={(e) => setSelectedMock(e.target.value)}
              className="bg-slate-900 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-amber-400"
            >
              {mockList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button
              onClick={() => setShowAddMockModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2.5 py-1.5 rounded-lg transition font-medium flex items-center gap-1 cursor-pointer"
              title="Add custom mock session"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>New Mock</span>
            </button>
          </div>

          {/* Target Class Filter */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl p-1.5 pl-3">
            <span className="text-xs text-slate-400 font-medium">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-900 text-slate-200 font-semibold text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-indigo-400"
            >
              <option value="JHS 3">JHS 3 (Basic 9 Candidate)</option>
              <option value="JHS 2">JHS 2 (Basic 8)</option>
              <option value="JHS 1">JHS 1 (Basic 7)</option>
              <option value="All JHS">All JHS Candidates</option>
            </select>
          </div>
        </div>

        {/* Quick Search and Save Button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 text-xs text-slate-200 placeholder-slate-400 pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleSaveAllRecords}
            disabled={isSaving}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Mock Records'}</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">BECE Candidates</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-xl font-bold text-white">{candidateStudents.length}</p>
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Actual Agg Avg (4C+2B)</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-xl font-bold text-amber-400">{avgActualAgg}</p>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Best 6 Agg Avg</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-xl font-bold text-emerald-400">{avgBest6Agg}</p>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Top Candidate</p>
          <div className="mt-1">
            <p className="text-xs font-bold text-white truncate">{topCandidate ? topCandidate.student.fullName : '--'}</p>
            <p className="text-[10px] font-bold text-emerald-400">{topCandidate ? `Agg ${String(topCandidate.actualAgg).padStart(2, '0')}` : '--'}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Pass Rate (Agg &le; 36)</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-xl font-bold text-cyan-400">{passRate}%</p>
            <Target className="h-4 w-4 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="border-b border-slate-800 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('scores')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'scores'
              ? 'border-amber-400 text-amber-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Edit3 className="h-4 w-4" />
          <span>1. Score Entry Grid</span>
        </button>

        <button
          onClick={() => setActiveTab('rankings')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'rankings'
              ? 'border-amber-400 text-amber-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>2. Candidates League & Rankings</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-amber-400 text-amber-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>3. Mock Progress & Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('slip')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'slip'
              ? 'border-amber-400 text-amber-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Printer className="h-4 w-4" />
          <span>4. Candidate Mock Result Slip</span>
        </button>
      </div>

      {/* TAB 1: SCORE ENTRY GRID */}
      {activeTab === 'scores' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Subject Score Entry Grid — {selectedMock}</span>
                <span className="text-xs font-normal text-slate-400">({filteredCandidates.length} candidates)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Enter percentage scores (0-100). WAEC Grade (1-9) and aggregates are calculated dynamically.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="inline-block w-3 h-3 bg-indigo-500/30 border border-indigo-400/50 rounded-sm"></span>
              <span>Mandatory Core Subjects (Eng, Math, Sci, Soc)</span>
            </div>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800">
              <User className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-medium">No candidates found in {selectedClass}</p>
              <p className="text-xs text-slate-500 mt-1">Register students in JHS 3 or switch the class filter above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 text-[11px] font-bold uppercase border-b border-slate-800">
                    <th className="p-2.5 sticky left-0 bg-slate-950 z-20 min-w-[180px]">Candidate Name</th>
                    
                    {/* Core Subjects Headers */}
                    {BECE_CORE_SUBJECTS.map(cs => (
                      <th key={cs} className="p-2 text-center bg-indigo-950/40 text-indigo-300 border-x border-slate-800 min-w-[90px]">
                        <div>{cs}</div>
                        <div className="text-[9px] text-indigo-400/80 font-normal">CORE</div>
                      </th>
                    ))}

                    {/* Elective Subjects Headers */}
                    {BECE_ELECTIVE_SUBJECTS.map(es => (
                      <th key={es} className="p-2 text-center text-slate-300 border-r border-slate-800 min-w-[90px]">
                        <div>{es}</div>
                        <div className="text-[9px] text-slate-500 font-normal">ELECTIVE</div>
                      </th>
                    ))}

                    <th className="p-2 text-center bg-amber-950/30 text-amber-300 min-w-[95px] border-l border-slate-800">
                      <div>ACTUAL AGG</div>
                      <div className="text-[9px] text-amber-400 font-normal">4 Core + 2 Best</div>
                    </th>

                    <th className="p-2 text-center bg-emerald-950/30 text-emerald-300 min-w-[95px]">
                      <div>BEST 6 AGG</div>
                      <div className="text-[9px] text-emerald-400 font-normal">Top 6 Overall</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredCandidates.map((student) => {
                    const record = getRecordForStudent(student.id);

                    return (
                      <tr key={student.id} className="hover:bg-slate-800/40 transition">
                        {/* Student Name */}
                        <td className="p-2.5 sticky left-0 bg-slate-900 z-10 font-semibold text-slate-200 border-r border-slate-800">
                          <div className="truncate max-w-[170px]">{student.fullName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{student.admissionNo}</div>
                        </td>

                        {/* Core Subject Score Inputs */}
                        {BECE_CORE_SUBJECTS.map(cs => {
                          const subjObj = record.scores.find(s => s.subject === cs);
                          const scoreVal = subjObj ? subjObj.score : 0;
                          const gObj = convertScoreToWaecGrade(scoreVal);

                          return (
                            <td key={cs} className="p-1.5 text-center bg-indigo-950/10 border-x border-slate-800">
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={scoreVal || ''}
                                  onChange={(e) => handleScoreChange(student.id, cs, e.target.value)}
                                  placeholder="0"
                                  className="w-16 bg-slate-950 text-center font-bold text-white border border-indigo-500/30 rounded py-1 text-xs focus:outline-none focus:border-indigo-400"
                                />
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${gObj.color}`}>
                                  Grade {gObj.grade}
                                </span>
                              </div>
                            </td>
                          );
                        })}

                        {/* Elective Subject Score Inputs */}
                        {BECE_ELECTIVE_SUBJECTS.map(es => {
                          const subjObj = record.scores.find(s => s.subject === es);
                          const scoreVal = subjObj ? subjObj.score : 0;
                          const gObj = convertScoreToWaecGrade(scoreVal);

                          return (
                            <td key={es} className="p-1.5 text-center border-r border-slate-800">
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={scoreVal || ''}
                                  onChange={(e) => handleScoreChange(student.id, es, e.target.value)}
                                  placeholder="0"
                                  className="w-16 bg-slate-950 text-center text-slate-200 border border-slate-700 rounded py-1 text-xs focus:outline-none focus:border-slate-500"
                                />
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${gObj.color}`}>
                                  Grade {gObj.grade}
                                </span>
                              </div>
                            </td>
                          );
                        })}

                        {/* Actual Aggregate (4 Core + 2 Best) */}
                        <td className="p-2 text-center bg-amber-950/20 font-extrabold text-amber-400 border-l border-slate-800">
                          <div className="text-base">{String(record.actualAggregate).padStart(2, '0')}</div>
                          <div className="text-[9px] text-slate-400 font-normal">Core: {record.coreAggregate} | Elect: {record.best2ElectiveAggregate}</div>
                        </td>

                        {/* Best 6 Aggregate */}
                        <td className="p-2 text-center bg-emerald-950/20 font-extrabold text-emerald-400">
                          <div className="text-base">{String(record.best6Aggregate).padStart(2, '0')}</div>
                          <button
                            onClick={() => {
                              setSelectedCandidateId(student.id);
                              setActiveTab('slip');
                            }}
                            className="text-[10px] text-indigo-400 hover:underline mt-0.5 block mx-auto cursor-pointer"
                          >
                            View Slip &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RANKINGS & LEAGUE TABLE */}
      {activeTab === 'rankings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                BECE Candidate Performance League Table — {selectedMock}
              </h3>
              <p className="text-xs text-slate-400">
                Sorted by Actual WAEC Aggregate (4 Core + 2 Best Electives). Lower aggregate indicates superior academic distinction.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 text-[11px] font-bold uppercase border-b border-slate-800">
                  <th className="p-3 w-12 text-center">Rank</th>
                  <th className="p-3">Index / Admission</th>
                  <th className="p-3">Candidate Full Name</th>
                  <th className="p-3 text-center">4 Core Grades</th>
                  <th className="p-3 text-center">Top 2 Electives</th>
                  <th className="p-3 text-center bg-amber-950/30 text-amber-300">Actual Agg (4C+2B)</th>
                  <th className="p-3 text-center bg-emerald-950/30 text-emerald-300">Best 6 Agg</th>
                  <th className="p-3">SHS Qualification Forecast</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {rankedCandidates.map((item, idx) => {
                  const place = getShsPlacementCategory(item.actualAgg);
                  const isTop3 = idx < 3;

                  // Find core breakdown
                  const coreGradesStr = BECE_CORE_SUBJECTS.map(cs => {
                    const found = item.record.scores.find(s => s.subject === cs);
                    return found ? found.grade : 9;
                  }).join(' - ');

                  // Find top 2 electives breakdown
                  const electives = item.record.scores.filter(s => !BECE_CORE_SUBJECTS.includes(s.subject));
                  const sortedElects = electives.map(s => s.grade).sort((a,b) => a-b);
                  const top2Str = `${sortedElects[0] || 9} - ${sortedElects[1] || 9}`;

                  return (
                    <tr key={item.student.id} className="hover:bg-slate-800/40 transition">
                      {/* Rank Position */}
                      <td className="p-3 text-center font-bold">
                        {isTop3 ? (
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full font-extrabold text-xs ${
                            idx === 0 ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' :
                            idx === 1 ? 'bg-slate-300 text-slate-950' :
                            'bg-amber-700/80 text-white'
                          }`}>
                            {idx + 1}
                          </span>
                        ) : (
                          <span className="text-slate-400">{idx + 1}th</span>
                        )}
                      </td>

                      <td className="p-3 font-mono text-slate-400">{item.student.admissionNo}</td>
                      
                      <td className="p-3 font-semibold text-white">
                        <div>{item.student.fullName}</div>
                        <div className="text-[10px] text-slate-400">{item.student.gender} &bull; {item.student.classLevel}</div>
                      </td>

                      <td className="p-3 text-center font-mono text-slate-300">{coreGradesStr}</td>
                      <td className="p-3 text-center font-mono text-slate-300">{top2Str}</td>

                      <td className="p-3 text-center bg-amber-950/20 font-black text-amber-400 text-sm">
                        {String(item.actualAgg).padStart(2, '0')}
                      </td>

                      <td className="p-3 text-center bg-emerald-950/20 font-black text-emerald-400 text-sm">
                        {String(item.best6Agg).padStart(2, '0')}
                      </td>

                      <td className="p-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${place.badge}`}>
                          {place.category}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedCandidateId(item.student.id);
                            setActiveTab('slip');
                          }}
                          className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition border border-indigo-500/30 cursor-pointer"
                        >
                          Result Slip
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MOCK PROGRESS & GRAPHICAL ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Candidate Progress Across Subsequent Mock Exams
                </h3>
                <p className="text-xs text-slate-400">
                  Track aggregate trend over time (Mock 1 &rarr; Mock 2 &rarr; Municipal Mock &rarr; National Mock). Lower aggregate trend indicates performance growth.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Filter Candidate:</span>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  className="bg-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-indigo-400"
                >
                  <option value="">All Candidates (Class Average)</option>
                  {candidateStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.admissionNo})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getMockProgressChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis domain={[6, 54]} reversed stroke="#94a3b8" tick={{ fontSize: 11 }} label={{ value: 'WAEC Aggregate (Lower is Better)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="actualAgg" name="Actual Aggregate (4 Core + 2 Best)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="best6Agg" name="Best 6 Aggregate" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Core Subject Average Scores */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-400" />
                Core Subjects Performance Breakdown — {selectedMock}
              </h3>
              <p className="text-xs text-slate-400 mb-4">Average score percentage across 4 compulsory BECE core subjects.</p>
              
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getCoreSubjectChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} />
                    <Bar dataKey="avgScore" name="Average Score (%)" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SHS Placement Category Pie Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                Predicted Senior High School Placement Categories
              </h3>
              <p className="text-xs text-slate-400 mb-4">Distribution of candidate aggregate rankings into WAEC SHS tiers.</p>
              
              <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getShsDistributionData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {getShsDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CANDIDATE MOCK RESULT SLIP */}
      {activeTab === 'slip' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Select Candidate:</span>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="bg-slate-800 text-white text-xs font-bold rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-amber-400"
              >
                {candidateStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.fullName} ({s.admissionNo})</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => reactToPrintFn && reactToPrintFn()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Printer className="h-4 w-4" />
              <span>Print Candidate Result Slip</span>
            </button>
          </div>

          {/* Printable Slip Container */}
          {activeCandidateStudent && activeCandidateRecord ? (
            <div ref={printSlipRef} className="print-slip-card bg-white text-slate-900 rounded-2xl p-5 md:p-6 shadow-2xl border border-slate-200 max-w-4xl mx-auto font-sans print:p-0 print:border-none print:shadow-none print:rounded-none">
              <style>{`
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 6mm 8mm;
                  }
                  body {
                    background: white !important;
                    color: black !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .print-slip-card {
                    padding: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    margin: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    page-break-inside: avoid;
                    break-inside: avoid;
                  }
                }
              `}</style>

              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-2 mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[9px] uppercase tracking-widest font-bold text-slate-500">WAEC BECE MOCK PERFORMANCE SLIP</div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{school.name}</h2>
                  <p className="text-[11px] text-slate-600">{school.district}, {school.region} Region &bull; Academic Year: {activeCandidateRecord.academicYear}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-slate-900 text-amber-400 text-xs font-black px-2.5 py-1 rounded uppercase tracking-wider">
                    {selectedMock}
                  </span>
                  <div className="text-[9px] text-slate-500 mt-0.5">Ref: BECE/MOCK/{new Date().getFullYear()}</div>
                </div>
              </div>

              {/* Candidate Info Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Candidate Name</span>
                  <span className="font-bold text-slate-900 text-xs">{activeCandidateStudent.fullName}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">BECE Index / Admission</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">{activeCandidateStudent.admissionNo}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Class & Gender</span>
                  <span className="font-medium text-slate-800 text-xs">{activeCandidateStudent.classLevel} &bull; {activeCandidateStudent.gender}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Guardian Contact</span>
                  <span className="font-medium text-slate-800 text-xs">{activeCandidateStudent.guardianPhone || 'N/A'}</span>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="mb-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 border-b pb-0.5">
                  BECE Subjects Performance Breakdown
                </h3>
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[10px]">
                      <th className="py-1.5 px-2">Subject</th>
                      <th className="py-1.5 px-2">Type</th>
                      <th className="py-1.5 px-2 text-center">Raw Score (%)</th>
                      <th className="py-1.5 px-2 text-center">WAEC Stanine Grade</th>
                      <th className="py-1.5 px-2">Remark / Interpretation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 border-b">
                    {activeCandidateRecord.scores.map(s => {
                      const gObj = convertScoreToWaecGrade(s.score);
                      return (
                        <tr key={s.subject} className="hover:bg-slate-50">
                          <td className="py-1 px-2 font-bold text-slate-900">{s.subject}</td>
                          <td className="py-1 px-2 text-slate-600 font-medium text-[10px]">
                            {s.isCore ? <span className="text-indigo-700 font-bold">CORE</span> : 'ELECTIVE'}
                          </td>
                          <td className="py-1 px-2 text-center font-semibold text-slate-800">{s.score}%</td>
                          <td className="py-1 px-2 text-center font-black text-slate-900">
                            <span className="inline-block bg-slate-100 text-slate-900 px-1.5 py-0.2 rounded border border-slate-300 font-extrabold text-[10px]">
                              Grade {s.grade}
                            </span>
                          </td>
                          <td className="py-1 px-2 font-medium text-slate-700 text-[10.5px]">{gObj.remark}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Aggregate Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-2 text-center">
                  <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider block">ACTUAL BECE AGGREGATE</span>
                  <span className="text-2xl font-black text-amber-900 leading-tight">{String(activeCandidateRecord.actualAggregate).padStart(2, '0')}</span>
                  <span className="text-[8px] font-bold text-amber-700 block">(4 Core + 2 Best Electives)</span>
                </div>

                <div className="bg-emerald-50 border-2 border-emerald-400 rounded-lg p-2 text-center">
                  <span className="text-[9px] font-black uppercase text-emerald-800 tracking-wider block">BEST 6 AGGREGATE</span>
                  <span className="text-2xl font-black text-emerald-900 leading-tight">{String(activeCandidateRecord.best6Aggregate).padStart(2, '0')}</span>
                  <span className="text-[8px] font-bold text-emerald-700 block">(Top 6 Overall Subjects)</span>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 text-center">
                  <span className="text-[9px] font-bold uppercase text-indigo-700 block">4 CORE SUM</span>
                  <span className="text-xl font-black text-indigo-900 leading-tight">{activeCandidateRecord.coreAggregate}</span>
                  <span className="text-[8px] text-indigo-600 block">Eng + Math + Sci + Soc</span>
                </div>

                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-2 text-center">
                  <span className="text-[9px] font-bold uppercase text-cyan-700 block">2 BEST ELECTIVES</span>
                  <span className="text-xl font-black text-cyan-900 leading-tight">{activeCandidateRecord.best2ElectiveAggregate}</span>
                  <span className="text-[8px] text-cyan-600 block">Top 2 Elective Grades</span>
                </div>
              </div>

              {/* Forecast Box */}
              {activeCandidatePlacement && (
                <div className="bg-slate-900 text-white rounded-lg p-2.5 mb-3">
                  <div className="text-[9px] uppercase font-bold text-amber-400 tracking-widest mb-0.5">SHS PLACEMENT PREDICTION & QUALIFICATION</div>
                  <div className="text-xs md:text-sm font-black text-white">{activeCandidatePlacement.category}</div>
                  <div className="text-[10.5px] text-slate-300 mt-0.5">{activeCandidatePlacement.description}</div>
                </div>
              )}

              {/* Signatures */}
              <div className="border-t border-slate-300 pt-2.5 grid grid-cols-2 gap-6 text-[10.5px] text-slate-700">
                <div>
                  <p className="font-bold text-slate-900">Form Teacher's Remarks & Signature:</p>
                  <p className="italic text-slate-600 mt-0.5 text-[10px]">"{activeCandidateRecord.actualAggregate <= 18 ? "An outstanding candidate. Keep up the high academic focus!" : "Good effort. Focus on core mathematical and scientific problem solving."}"</p>
                  <div className="mt-4 border-b border-dashed border-slate-400 w-40" />
                  <p className="text-[9px] text-slate-500 mt-0.5">Signature & Date</p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-slate-900">Headmaster / Principal Endorsement:</p>
                  <div className="mt-0.5 font-bold text-slate-900">{school.headTeacherName || 'Rev. Dr. Headmaster'}</div>
                  <div className="mt-4 border-b border-dashed border-slate-400 w-40 ml-auto" />
                  <p className="text-[9px] text-slate-500 mt-0.5">School Official Stamp & Signature</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400 text-xs">
              Select a candidate from the dropdown above to render their BECE Mock Result Slip.
            </div>
          )}
        </div>
      )}

      {/* Add Custom Mock Modal */}
      {showAddMockModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-amber-400" />
              Create Custom Mock Exam Session
            </h3>
            <p className="text-xs text-slate-400">
              Enter a custom name for your school, municipal, district, or external mock exam (e.g. "2026 District Super Mock").
            </p>

            <input
              type="text"
              placeholder="e.g. Municipal Mock 3 or Super Mock 2026"
              value={newMockInput}
              onChange={(e) => setNewMockInput(e.target.value)}
              className="w-full bg-slate-800 text-white text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddMockModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateMock}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Create Mock Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
