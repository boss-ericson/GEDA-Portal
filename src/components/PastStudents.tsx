import React, { useState } from 'react';
import { School, Student } from '../types';
import { Search, GraduationCap } from 'lucide-react';

interface PastStudentsProps {
  school: School;
  students: Student[];
}

export default function PastStudents({ school, students }: PastStudentsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const pastStudents = students.filter(s => s.classLevel === 'Graduated');
  
  const filteredStudents = pastStudents.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-950 dark:text-white">Past Students</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">View records of graduated and past students.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none overflow-hidden p-6">
        <div className="flex items-center gap-3 mb-6 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
          <Search className="h-4 w-4 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Search past students by name or ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full font-medium"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4 text-center">Admission No</th>
                <th className="py-3 px-4 text-center">Gender</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950/50">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{student.fullName}</td>
                  <td className="py-3 px-4 text-center font-mono text-xs text-slate-500 dark:text-slate-400">{student.admissionNo}</td>
                  <td className="py-3 px-4 text-center">{student.gender}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center justify-center gap-1 w-max mx-auto">
                      <GraduationCap className="h-3 w-3" />
                      Graduated
                    </span>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">No past students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
