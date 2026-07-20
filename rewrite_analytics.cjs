const fs = require('fs');
const content = `import React, { useEffect, useState } from 'react';
import { School, Student, AcademicRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

export default function AnalyticsCenter({ school, students, isOffline }: { school: School, students: Student[], isOffline: boolean }) {
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllRecords = async () => {
      if (isOffline) return;
      setLoading(true);
      try {
        const res = await fetch(\`/api/v1/academic-records?schoolId=\${school.id}\`);
        if (res.ok) {
          const data = await res.json();
          setRecords(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllRecords();
  }, [school.id, isOffline]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="mb-6">
        <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">School Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Overview of academic performance and enrollment trends</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-pulse text-slate-400">Loading analytics data...</div></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnrollmentGrowthChart students={students} />
          <PerformanceTrendsChart records={records} />
          <div className="lg:col-span-2">
            <SubjectScoreDistributionChart records={records} />
          </div>
        </div>
      )}
    </div>
  );
}

function EnrollmentGrowthChart({ students }: { students: Student[] }) {
  const [data, setData] = useState<{ year: string; count: number }[]>([]);

  useEffect(() => {
    if (students.length === 0) return;
    const counts: Record<string, number> = {};
    students.forEach(s => {
      const year = new Date(s.createdAt).getFullYear().toString();
      counts[year] = (counts[year] || 0) + 1;
    });
    const parsedData = Object.entries(counts)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));
    setData(parsedData);
  }, [students]);

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
      <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-4">Enrollment Growth</h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip 
              cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }} 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PerformanceTrendsChart({ records }: { records: AcademicRecord[] }) {
  const [data, setData] = useState<{ term: string; avgScore: number }[]>([]);

  useEffect(() => {
    if (records.length === 0) return;
    const termScores: Record<string, { total: number; count: number }> = {};
    
    records.forEach(r => {
      const termKey = \`\${r.academicYear} \${r.academicTerm}\`;
      r.scores.forEach(s => {
        const total = (s.cat1 || 0) + (s.cat2 || 0) + (s.groupWork || 0) + (s.projectWork || 0) + (s.exam || 0);
        if (!termScores[termKey]) {
          termScores[termKey] = { total: 0, count: 0 };
        }
        termScores[termKey].total += total;
        termScores[termKey].count++;
      });
    });

    const parsedData = Object.entries(termScores)
      .map(([term, { total, count }]) => ({ term, avgScore: Number((total / count).toFixed(1)) }))
      .sort((a, b) => a.term.localeCompare(b.term));
    setData(parsedData);
  }, [records]);

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
      <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-4">Performance Trends over Terms</h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
            <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Line type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SubjectScoreDistributionChart({ records }: { records: AcademicRecord[] }) {
  const [data, setData] = useState<{ subject: string; avgScore: number }[]>([]);

  useEffect(() => {
    if (records.length === 0) return;
    const subjectScores: Record<string, { total: number; count: number }> = {};
    
    records.forEach(r => {
      r.scores.forEach(s => {
        const total = (s.cat1 || 0) + (s.cat2 || 0) + (s.groupWork || 0) + (s.projectWork || 0) + (s.exam || 0);
        if (!subjectScores[s.subject]) {
          subjectScores[s.subject] = { total: 0, count: 0 };
        }
        subjectScores[s.subject].total += total;
        subjectScores[s.subject].count++;
      });
    });

    const parsedData = Object.entries(subjectScores)
      .map(([subject, { total, count }]) => ({ subject, avgScore: Number((total / count).toFixed(1)) }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10);
    setData(parsedData);
  }, [records]);

  return (
    <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
      <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-4">Subject-wise Aggregate Score Distributions</h3>
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
            <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip 
              cursor={{ fill: 'rgba(56, 189, 248, 0.1)' }} 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="avgScore" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/AnalyticsCenter.tsx', content);
