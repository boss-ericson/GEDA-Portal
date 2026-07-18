import React, { useState, useEffect } from 'react';
import { School } from '../types';
import { ShieldAlert, LogOut, CheckCircle2, Search, Power, PowerOff, Building2, Users, Bell } from 'lucide-react';

interface SchoolWithStats extends School {
  studentCount: number;
}

export default function SuperAdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [schools, setSchools] = useState<SchoolWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/superadmin/schools');
      if (res.ok) {
        const data = await res.json();
        setSchools(data);
      } else {
        throw new Error('Failed to fetch schools');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleToggleStatus = async (schoolId: string, currentStatus?: string) => {
    const newStatus = currentStatus === 'Deactivated' ? 'Active' : 'Deactivated';

    try {
      const res = await fetch(`/api/v1/superadmin/schools/${schoolId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, status: newStatus } : s));
      } else {
        const data = await res.json();
        console.error(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Network error while updating status');
    }
  };

  const handleToggleAccess = async (schoolId: string, currentAccess?: string) => {
    const newAccess = currentAccess === 'Restricted' ? 'Full' : 'Restricted';

    try {
      const res = await fetch(`/api/v1/superadmin/schools/${schoolId}/access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessLevel: newAccess })
      });
      if (res.ok) {
        setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, accessLevel: newAccess } : s));
      } else {
        const data = await res.json();
        console.error(data.error || 'Failed to update access level');
      }
    } catch (err) {
      console.error('Network error while updating access level');
    }
  };

  const handleVerifyPayment = async (schoolId: string, currentStudents: number) => {
    try {
      const res = await fetch(`/api/v1/superadmin/schools/${schoolId}/verify-payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidStudentCount: currentStudents })
      });
      if (res.ok) {
        setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, accessLevel: 'Full', paidStudentCount: currentStudents, billingNotice: '' } : s));
      } else {
        const data = await res.json();
        console.error(data.error || 'Failed to verify payment');
      }
    } catch (err) {
      console.error('Network error while verifying payment');
    }
  };

  const handleSendNotice = async (schoolId: string, unpaidStudents: number) => {
    if (unpaidStudents <= 0) return;
    const message = `Notice: You have ${unpaidStudents} new student(s) unpaid for. Please make payment to avoid access restriction.`;
    try {
      const res = await fetch(`/api/v1/superadmin/schools/${schoolId}/billing-notice`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingNotice: message })
      });
      if (res.ok) {
        setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, billingNotice: message } : s));
        alert('Notice sent successfully to the school dashboard.');
      } else {
        const data = await res.json();
        console.error(data.error || 'Failed to send notice');
        alert('Failed to send notice.');
      }
    } catch (err) {
      console.error('Network error while sending notice');
      alert('Network error while sending notice.');
    }
  };

  const filteredSchools = schools.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()));

  const totalStudents = schools.reduce((sum, s) => sum + (s.studentCount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans">
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-900 dark:text-white p-2 rounded">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-white font-display font-bold text-lg leading-tight">GEDA Super Admin</h1>
            <p className="text-xs text-slate-400">Developer Root Access</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded transition text-xs font-semibold cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Exit Root</span>
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="bg-slate-800 p-3 rounded-xl text-amber-500">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tenants</p>
              <p className="text-3xl font-display font-bold text-white">{schools.length}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="bg-slate-800 p-3 rounded-xl text-emerald-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
              <p className="text-3xl font-display font-bold text-white">{totalStudents}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-center gap-2">
            <div className="text-xs text-slate-400">
              Data is End-to-End Encrypted. Only high-level analytics and access controls are available to the Root Developer.
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-lg font-display font-bold text-white">Registered Schools Ledger</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                placeholder="Search tenants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-5 border-b border-slate-800">School / Tenant ID</th>
                  <th className="py-3 px-5 border-b border-slate-800">Contact Email</th>
                  <th className="py-3 px-5 border-b border-slate-800">Location</th>
                  <th className="py-3 px-5 border-b border-slate-800 text-right">Students</th>
                  <th className="py-3 px-5 border-b border-slate-800 text-center">Status</th>
                  <th className="py-3 px-5 border-b border-slate-800 text-center">Access</th>
                  <th className="py-3 px-5 border-b border-slate-800 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">Loading tenants...</td>
                  </tr>
                ) : filteredSchools.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">No matching tenants found.</td>
                  </tr>
                ) : (
                  filteredSchools.map((school) => {
                    const isActive = school.status !== 'Deactivated';
                    return (
                      <tr key={school.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3 px-5">
                          <div className="font-semibold text-white">{school.name}</div>
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{school.id}</div>
                        </td>
                        <td className="py-3 px-5 text-slate-400 text-xs">{school.email}</td>
                        <td className="py-3 px-5 text-slate-400 text-xs">{school.district}, {school.region}</td>
                        <td className="py-3 px-5 text-right font-mono text-xs">
                          <span className="font-medium text-slate-300">{school.studentCount}</span>
                          <span className="text-slate-600 dark:text-slate-400 mx-1">/</span>
                          <span className="font-medium text-emerald-500" title="Paid Students">{school.paidStudentCount || 0} paid</span>
                        </td>
                        <td className="py-3 px-5 text-center">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Deactivated
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-center">
                          <button
                            onClick={() => handleToggleAccess(school.id, school.accessLevel)}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${school.accessLevel === 'Restricted' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'}`}
                            title={school.accessLevel === 'Restricted' ? 'Grant Full Access' : 'Restrict Access'}
                          >
                            {school.accessLevel === 'Restricted' ? 'Restricted' : 'Full Access'}
                          </button>
                        </td>
                        <td className="py-3 px-5 text-center flex justify-center gap-2">
                          <button
                            onClick={() => handleSendNotice(school.id, Math.max(0, school.studentCount - (school.paidStudentCount || 0)))}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg text-amber-500 hover:bg-slate-800 transition cursor-pointer disabled:opacity-30"
                            title="Send Payment Notice for Unpaid Students"
                            disabled={school.studentCount <= (school.paidStudentCount || 0)}
                          >
                            <Bell className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(school.id, school.studentCount)}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg text-emerald-500 hover:bg-slate-800 transition cursor-pointer"
                            title="Verify Payment (Sets Paid Students = Current Students)"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(school.id, school.status)}
                            className={`inline-flex items-center justify-center p-1.5 rounded-lg transition cursor-pointer ${school.status !== 'Deactivated' ? 'text-slate-400 hover:bg-slate-800 hover:text-red-400' : 'text-slate-400 hover:bg-slate-800 hover:text-emerald-400'}`}
                            title={school.status !== 'Deactivated' ? 'Deactivate School' : 'Reactivate School'}
                          >
                            {school.status !== 'Deactivated' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
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
      </main>
    </div>
  );
}
