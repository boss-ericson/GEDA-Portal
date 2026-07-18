import React, { useState } from 'react';
import { School, Student } from '../types';
import { Users, GraduationCap, CheckCircle2 } from 'lucide-react';

const CLASS_PROGRESSION = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'JHS 1', 'JHS 2', 'JHS 3'];

interface PromotionsManagerProps {
  school: School;
  students: Student[];
  onPromote: (studentIds: string[], targetClass: string) => void;
}

export default function PromotionsManager({ school, students, onPromote }: PromotionsManagerProps) {
  const [selectedClass, setSelectedClass] = useState<string>('Class 1');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const classStudents = students.filter(s => s.classLevel === selectedClass);
  const nextClassIndex = CLASS_PROGRESSION.indexOf(selectedClass) + 1;
  const targetClass = nextClassIndex < CLASS_PROGRESSION.length ? CLASS_PROGRESSION[nextClassIndex] : 'Graduated';

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudents(classStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const [isConfirming, setIsConfirming] = useState(false);

  const handlePromote = () => {
    if (selectedStudents.length === 0) return;
    setIsConfirming(true);
  };

  const confirmPromote = () => {
    onPromote(selectedStudents, targetClass);
    setSelectedStudents([]);
    setIsConfirming(false);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-950 dark:text-white">Promotions & Graduations</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Promote students to the next class or graduate JHS 3 students.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none overflow-hidden flex flex-col md:flex-row">
        {/* Class Selector Sidebar */}
        <div className="w-full md:w-48 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-700 p-4 shrink-0">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Select Class</h3>
          <div className="space-y-1">
            {Array.from(new Set([...CLASS_PROGRESSION, ...students.map(s => s.classLevel)])).filter(Boolean).filter(c => c !== 'Graduated').map(cls => (
              <button
                key={cls}
                onClick={() => {
                  setSelectedClass(cls);
                  setSelectedStudents([]);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedClass === cls ? 'bg-amber-100 text-amber-900' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-700/50'
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
            <div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg">{selectedClass} Students</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Target Class: <strong className="text-amber-600">{targetClass}</strong></p>
            </div>
            <div className="flex gap-2 items-center">
              {selectedStudents.length > 0 && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-2">{selectedStudents.length} selected</span>
              )}
              {!isConfirming ? (
                <button 
                  onClick={handlePromote}
                  disabled={selectedStudents.length === 0}
                  className="text-xs font-semibold px-4 py-2 bg-amber-500 text-slate-950 dark:text-white rounded-xl hover:bg-amber-600 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {targetClass === 'Graduated' ? <GraduationCap className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                  {targetClass === 'Graduated' ? 'Graduate Selected' : 'Promote Selected'}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-bold">Are you sure?</span>
                  <button 
                    onClick={confirmPromote}
                    className="text-xs font-semibold px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Yes, Confirm
                  </button>
                  <button 
                    onClick={() => setIsConfirming(false)}
                    className="text-xs font-semibold px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 transition"
                  >
                    Cancel
                  </button>
                </div>
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
                      className="rounded border-slate-300 dark:border-slate-600 text-amber-500 focus:ring-amber-500"
                      checked={classStudents.length > 0 && selectedStudents.length === classStudents.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Admission No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950/50">
                    <td className="py-3 px-4 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 dark:border-slate-600 text-amber-500 focus:ring-amber-500"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{student.fullName}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">{student.admissionNo}</td>
                  </tr>
                ))}
                {classStudents.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 text-xs">No students found in {selectedClass}.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
