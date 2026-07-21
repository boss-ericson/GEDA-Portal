import React, { useState, useEffect } from 'react';
import { School, Student, AttendanceRecord } from '../types';
import { CheckCircle2, XCircle, Clock, Save, RefreshCw } from 'lucide-react';

interface AttendanceTrackerProps {
  school: School;
  students: Student[];
  isOffline: boolean;
  user?: any;
  role?: string;
}

export default function AttendanceTracker({ school, students, isOffline, user, role }: AttendanceTrackerProps) {
  const [loading, setLoading] = useState(false);
  const [activeClass, setActiveClass] = useState<string>('JHS 1');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [term, setTerm] = useState<string>(school.academicTerm || 'First');
  const [year, setYear] = useState<string>(school.academicYear || '2026/2027');
  
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [saving, setSaving] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const isAttendanceEditable = () => {
    if (role !== 'Teacher') return true;
    if (!user) return true;
    if (activeClass.startsWith('JHS')) {
      return user.isClassTeacher;
    }
    return true; // Primary teachers have full access to attendance
  };

  const fetchAttendance = async () => {
    if (isOffline) return;
    setLoading(true);
    setAttendance({}); // Clear stale data before fetch
    try {
      const res = await fetch(`/api/v1/attendance?schoolId=${school.id}&date=${date}`);
      if (res.ok) {
        const data: AttendanceRecord[] = await res.json();
        const map: Record<string, AttendanceRecord> = {};
        data.forEach(r => map[r.studentId] = r);
        setAttendance(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [school.id, date, isOffline]);

  const classStudents = students.filter(s => s.classLevel === activeClass);

  useEffect(() => {
    setSelectedStudents([]);
  }, [activeClass]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudents(classStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleMarkSelected = (status: 'Present' | 'Absent' | 'Late') => {
    if (selectedStudents.length === 0) return;
    const newAtt = { ...attendance };
    selectedStudents.forEach(id => {
      newAtt[id] = {
        ...newAtt[id],
        id: newAtt[id]?.id || '',
        schoolId: school.id,
        studentId: id,
        date,
        status,
        academicYear: year,
        academicTerm: term,
      };
    });
    setAttendance(newAtt);
    // setSelectedStudents([]); // optionally clear selection
  };

  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        id: prev[studentId]?.id || '',
        schoolId: school.id,
        studentId,
        date,
        status,
        academicYear: year,
        academicTerm: term,
      }
    }));
  };

  const handleMarkAll = (status: 'Present' | 'Absent') => {
    const newAtt = { ...attendance };
    classStudents.forEach(s => {
      newAtt[s.id] = {
        ...newAtt[s.id],
        id: newAtt[s.id]?.id || '',
        schoolId: school.id,
        studentId: s.id,
        date,
        status,
        academicYear: year,
        academicTerm: term,
      };
    });
    setAttendance(newAtt);
  };

  const handleSave = async () => {
    if (isOffline) return;
    setSaving(true);
    try {
      const recordsToSave = classStudents.map(s => attendance[s.id]).filter(Boolean);
      const res = await fetch('/api/v1/attendance/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: school.id, records: recordsToSave })
      });
      if (res.ok) {
        alert('Attendance saved successfully');
        fetchAttendance();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-950 dark:text-white">Daily Attendance</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Mark and manage student attendance records.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-amber-500" 
          />
          <button onClick={fetchAttendance} disabled={loading} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950 cursor-pointer">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none overflow-hidden flex flex-col md:flex-row">
        {/* Class Selector Sidebar */}
        <div className="w-full md:w-48 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-700 p-4 shrink-0">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Select Class</h3>
          <div className="space-y-1">
            {Array.from(new Set(['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'JHS 1', 'JHS 2', 'JHS 3', ...students.map(s => s.classLevel)])).filter(Boolean).filter(c => c !== 'Graduated').map(cls => (
              <button
                key={cls}
                onClick={() => setActiveClass(cls)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeClass === cls ? 'bg-amber-100 text-amber-900' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-700/50'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Student List & Actions */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg">{activeClass} Students</h3>
            <div className="flex gap-2">
              
              {isAttendanceEditable() && (
                <>
                  {selectedStudents.length > 0 && (
                    <>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 self-center mr-2">
                        {selectedStudents.length} selected
                      </span>
                      <button onClick={() => handleMarkSelected('Present')} disabled={loading} className="text-xs font-semibold px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition disabled:opacity-50">
                        Mark Selected Present
                      </button>
                      <button onClick={() => handleMarkSelected('Late')} disabled={loading} className="text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition disabled:opacity-50">
                        Mark Selected Late
                      </button>
                      <button onClick={() => handleMarkSelected('Absent')} disabled={loading} className="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition disabled:opacity-50">
                        Mark Selected Absent
                      </button>
                    </>
                  )}
                  {selectedStudents.length === 0 && (
                    <>
                      <button onClick={() => handleMarkAll('Present')} disabled={loading} className="text-xs font-semibold px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition disabled:opacity-50">
                        Mark All Present
                      </button>
                      <button onClick={() => handleMarkAll('Absent')} disabled={loading} className="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition disabled:opacity-50">
                        Mark All Absent
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 dark:border-slate-600 text-amber-500 focus:ring-amber-500 disabled:opacity-50"
                      checked={classStudents.length > 0 && selectedStudents.length === classStudents.length}
                      onChange={handleSelectAll}
                      disabled={!isAttendanceEditable() || loading}
                    />
                  </th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map(student => {
                  const record = attendance[student.id];
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950/50">
                      <td className="py-3 px-4 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 dark:border-slate-600 text-amber-500 focus:ring-amber-500 disabled:opacity-50"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                          disabled={!isAttendanceEditable() || loading}
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {student.fullName}
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-mono">{student.admissionNo}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {record ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            record.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' : 
                            record.status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {record.status}
                          </span>
                        ) : (
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">Not Marked</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isAttendanceEditable() && (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleStatusChange(student.id, 'Present')}
                              disabled={loading}
                              className={`p-1.5 rounded-lg transition disabled:opacity-50 ${record?.status === 'Present' ? 'bg-green-100 text-green-700' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800'}`}
                              title="Present"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.id, 'Late')}
                              disabled={loading}
                              className={`p-1.5 rounded-lg transition disabled:opacity-50 ${record?.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800'}`}
                              title="Late"
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.id, 'Absent')}
                              disabled={loading}
                              className={`p-1.5 rounded-lg transition disabled:opacity-50 ${record?.status === 'Absent' ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800'}`}
                              title="Absent"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {classStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">No students found in this class.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
            {isAttendanceEditable() && (
              <button 
                onClick={handleSave} 
                disabled={saving || classStudents.length === 0}
                className="px-5 py-2 rounded-xl font-semibold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 dark:text-white transition cursor-pointer shadow-sm dark:shadow-none flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
