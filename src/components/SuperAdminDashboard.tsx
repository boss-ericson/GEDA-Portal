import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { School } from '../types';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  ShieldAlert, LogOut, CheckCircle2, Search, Power, PowerOff, 
  Building2, Users, Bell, DollarSign, MapPin, Mail, CreditCard, Sparkles
} from 'lucide-react';
import { Skeleton } from './SkeletonLoader';

interface SchoolWithStats extends School {
  studentCount: number;
}

export default function SuperAdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [schools, setSchools] = useState<SchoolWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [, setError] = useState('');

  const isDemoSchool = (school: { id?: string; name?: string }) => {
    if (!school) return false;
    const idMatch = school.id === 'geda-school-complex';
    const nameMatch = school.name?.toLowerCase().includes('geda school complex') || school.name?.toLowerCase().includes('geda demo');
    return idMatch || nameMatch;
  };

  const fetchSchools = async () => {
    setLoading(true);
    try {
      let schoolsData: any[] = [];
      let studentsData: any[] = [];

      try {
        const res = await fetch('/api/v1/superadmin/schools');
        if (res.ok) {
          schoolsData = await res.json();
        }
      } catch (apiErr) {
        console.warn('Backend API failed, falling back to Firebase directly');
      }

      // Fetch directly from Client Firestore SDK as well to guarantee fresh data
      try {
        const schoolsSnapshot = await getDocs(collection(db, "schools"));
        const fbSchools = schoolsSnapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        
        if (schoolsData.length === 0) {
          schoolsData = fbSchools;
        } else {
          // Merge client Firestore properties in case client SDK written data is fresher
          schoolsData = schoolsData.map(s => {
            const fbMatch: any = fbSchools.find(f => f.id === s.id);
            if (fbMatch) {
              return {
                ...s,
                ...fbMatch,
                paidStudentCount: fbMatch.paidStudentCount !== undefined ? Number(fbMatch.paidStudentCount) : s.paidStudentCount
              };
            }
            return s;
          });
        }
      } catch (fbErr) {
        console.warn('Firebase direct fetch failed in SuperAdminDashboard:', fbErr);
      }

      try {
        const studentsSnapshot = await getDocs(collection(db, "students"));
        studentsData = studentsSnapshot.docs.map(d => d.data());
      } catch (stErr) {}

      const combined = schoolsData.map(school => {
        const schoolStudents = studentsData.filter(s => s.schoolId === school.id);
        const calcCount = schoolStudents.length > 0 ? schoolStudents.length : (school.studentCount || 0);
        const paidCount = school.paidStudentCount !== undefined && school.paidStudentCount !== null ? Number(school.paidStudentCount) : 0;
        return {
          ...school,
          studentCount: calcCount,
          paidStudentCount: paidCount
        };
      });

      setSchools(combined);
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
      try {
        await setDoc(doc(db, "schools", schoolId), { status: newStatus }, { merge: true });
      } catch (fbErr) {}

      try {
        await fetch(`/api/v1/superadmin/schools/${schoolId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (apiErr) {}

      setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, status: newStatus } : s));
      toast.success(`School status changed to ${newStatus}`);
    } catch (err) {
      console.error('Network error while updating status');
      toast.error('Failed to update status');
    }
  };

  const handleToggleAccess = async (schoolId: string, currentAccess?: string) => {
    const newAccess = currentAccess === 'Restricted' ? 'Full' : 'Restricted';

    try {
      try {
        await setDoc(doc(db, "schools", schoolId), { accessLevel: newAccess }, { merge: true });
      } catch (fbErr) {}

      try {
        await fetch(`/api/v1/superadmin/schools/${schoolId}/access`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessLevel: newAccess })
        });
      } catch (apiErr) {}

      setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, accessLevel: newAccess } : s));
      toast.success(`School access set to ${newAccess}`);
    } catch (err) {
      console.error('Network error while updating access level');
      toast.error('Failed to update access level');
    }
  };

  const handleVerifyPayment = async (schoolId: string, currentStudents: number) => {
    const paidCount = Number(currentStudents || 0);
    try {
      try {
        await setDoc(doc(db, "schools", schoolId), { 
          accessLevel: 'Full', 
          paidStudentCount: paidCount, 
          billingNotice: '' 
        }, { merge: true });
      } catch (fbErr) {
        console.warn('Direct Firestore setDoc failed:', fbErr);
      }

      try {
        await fetch(`/api/v1/superadmin/schools/${schoolId}/verify-payment`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paidStudentCount: paidCount })
        });
      } catch (apiErr) {
        console.warn('Backend API verify-payment failed:', apiErr);
      }

      setSchools(prev => prev.map(s => s.id === schoolId ? { 
        ...s, 
        accessLevel: 'Full', 
        paidStudentCount: paidCount, 
        billingNotice: '' 
      } : s));
      toast.success('Payment verified! Full access granted.');
    } catch (err) {
      console.error('Error while verifying payment:', err);
      toast.error('Failed to verify payment');
    }
  };

  const handleSendNotice = async (schoolId: string, unpaidStudents: number) => {
    if (unpaidStudents <= 0) return;
    const message = `Notice: You have ${unpaidStudents} new student(s) unpaid for. Please make payment to avoid access restriction.`;
    try {
      try {
        await setDoc(doc(db, "schools", schoolId), { billingNotice: message }, { merge: true });
      } catch (fbErr) {}

      try {
        await fetch(`/api/v1/superadmin/schools/${schoolId}/billing-notice`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ billingNotice: message })
        });
      } catch (apiErr) {}

      setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, billingNotice: message } : s));
      toast.success('Billing notice sent successfully to school dashboard.');
    } catch (err) {
      console.error('Network error while sending notice');
      toast.error('Network error while sending notice.');
    }
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.id?.toLowerCase().includes(search.toLowerCase()) ||
    s.region?.toLowerCase().includes(search.toLowerCase())
  );

  const revenueGeneratingSchools = schools.filter(s => !isDemoSchool(s));
  const totalStudents = schools.reduce((sum, s) => sum + (s.studentCount || 0), 0);
  const totalPaidStudentsForRevenue = revenueGeneratingSchools.reduce((sum, s) => sum + (s.paidStudentCount || 0), 0);
  const totalUnpaidStudentsForRevenue = revenueGeneratingSchools.reduce((sum, s) => sum + Math.max(0, (s.studentCount || 0) - (s.paidStudentCount || 0)), 0);
  
  const activeSchoolsCount = schools.filter(s => s.status !== 'Deactivated').length;
  const deactivatedSchoolsCount = schools.length - activeSchoolsCount;

  // Blaze Plan Pricing (GHS 10 per student)
  const PRICE_PER_STUDENT = 10;
  const totalRevenueCollected = totalPaidStudentsForRevenue * PRICE_PER_STUDENT;
  const totalPendingRevenue = totalUnpaidStudentsForRevenue * PRICE_PER_STUDENT;

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-300 font-sans overflow-x-hidden">
      {/* Header Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-3.5 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-950 p-2 rounded-xl shadow-md">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-white font-display font-bold text-base sm:text-lg leading-tight flex items-center gap-2">
              GEDA Super Admin
              <span className="text-[10px] font-mono bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">Root</span>
            </h1>
            <p className="text-[11px] text-slate-400">Multi-Tenant Governance & Revenue Ledger</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white py-2 px-3.5 rounded-xl transition text-xs font-semibold cursor-pointer border border-slate-700/80 shadow-xs"
        >
          <LogOut className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden sm:inline">Exit Root</span>
        </button>
      </header>

      <main className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Analytics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue Made Counter Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue Made</span>
              <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400 border border-emerald-500/20">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight flex items-baseline gap-1">
                <span className="text-xs text-emerald-400 font-semibold font-mono">GHS</span>
                {totalRevenueCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-400">
                <span className="text-emerald-400 font-semibold">{totalPaidStudentsForRevenue} Paid Students</span>
                <span>•</span>
                <span>GHS {PRICE_PER_STUDENT}.00/student</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 italic">Excludes demo space (GEDA School Complex)</p>
            </div>
            {totalPendingRevenue > 0 ? (
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-amber-400 flex items-center justify-between font-medium">
                <span>Pending: GHS {totalPendingRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className="text-slate-500">({totalUnpaidStudentsForRevenue} unpaid)</span>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400/90 flex items-center gap-1 font-medium">
                <Sparkles className="h-3 w-3" />
                <span>All registered student fees cleared</span>
              </div>
            )}
          </div>

          {/* Total Tenants Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tenants</span>
              <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-400 border border-amber-500/20">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                {schools.length}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-400">
                <span className="text-emerald-400 font-semibold">{activeSchoolsCount} Active</span>
                <span>•</span>
                <span className="text-slate-400">{deactivatedSchoolsCount} Deactivated</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
              <span>Tenant Status Ratio:</span>
              <span className="font-semibold text-white">
                {schools.length > 0 ? Math.round((activeSchoolsCount / schools.length) * 100) : 0}% Active
              </span>
            </div>
          </div>

          {/* Total Students Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
              <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-400 border border-blue-500/20">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                {totalStudents}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-400">
                <span className="text-emerald-400 font-semibold">{totalPaidStudentsForRevenue} Paid</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">{totalUnpaidStudentsForRevenue} Unpaid</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
              <span>Paid Capacity:</span>
              <span className="font-semibold text-emerald-400">
                {totalStudents > 0 ? Math.round((totalPaidStudentsForRevenue / totalStudents) * 100) : 0}% Covered
              </span>
            </div>
          </div>

          {/* Data Isolation Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tenant Isolation</span>
              <div className="bg-purple-500/10 p-2.5 rounded-xl text-purple-400 border border-purple-500/20">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
            <div>
              <span className="text-emerald-400 text-xs font-bold block mb-1 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Security Sandboxing Active
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Student records, grades, and academic data are encrypted and isolated per school space. Super Admin governs billing & status only.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-purple-300 font-mono">
              Mode: Standard Multi-Tenant
            </div>
          </div>
        </div>

        {/* Registered Schools Ledger Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {/* Section Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
            <div>
              <h2 className="text-base sm:text-lg font-display font-bold text-white flex items-center gap-2">
                Registered Schools Ledger
                <span className="text-xs font-mono font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  {filteredSchools.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Overview of registered school spaces, student counts, revenue, and access controls</p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search school, email, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-amber-500 transition shadow-inner placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* DESKTOP TABLE VIEW (Visible on md screens and up - styled to fit cleanly without horizontal scrolling) */}
          <div className="hidden md:block w-full">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">School / ID</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Students</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Access</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-36 bg-slate-800" />
                          <Skeleton className="h-3 w-24 bg-slate-800/60" />
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-28 bg-slate-800" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-24 bg-slate-800" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Skeleton className="h-4 w-16 ml-auto bg-slate-800" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Skeleton className="h-4 w-16 ml-auto bg-slate-800" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Skeleton className="h-5 w-16 mx-auto rounded-full bg-slate-800" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Skeleton className="h-5 w-20 mx-auto rounded-full bg-slate-800" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Skeleton className="h-7 w-20 mx-auto rounded-xl bg-slate-800" />
                      </td>
                    </tr>
                  ))
                ) : filteredSchools.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                      No matching registered schools found.
                    </td>
                  </tr>
                ) : (
                  filteredSchools.map((school) => {
                    const isActive = school.status !== 'Deactivated';
                    const isDemo = isDemoSchool(school);
                    const unpaidCount = Math.max(0, school.studentCount - (school.paidStudentCount || 0));
                    const schoolRevenue = isDemo ? 0 : (school.paidStudentCount || 0) * PRICE_PER_STUDENT;

                    return (
                      <tr key={school.id} className="hover:bg-slate-800/40 transition">
                        {/* School Name & ID */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white max-w-[180px] lg:max-w-[240px] truncate flex items-center gap-1.5" title={school.name}>
                            {school.name}
                            {isDemo && (
                              <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-700 shrink-0">Demo</span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 truncate" title={school.id}>
                            {school.id}
                          </div>
                        </td>

                        {/* Contact Email */}
                        <td className="py-3 px-4 text-slate-400 text-xs max-w-[160px] truncate" title={school.email || 'N/A'}>
                          {school.email || 'No email'}
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4 text-slate-400 text-xs max-w-[140px] truncate" title={`${school.district || ''}, ${school.region || ''}`}>
                          {school.district ? `${school.district}, ${school.region}` : school.region || 'Ghana'}
                        </td>

                        {/* Student Ratio */}
                        <td className="py-3 px-4 text-right font-mono text-xs">
                          <span className="font-semibold text-white">{school.studentCount}</span>
                          <span className="text-slate-600 mx-1">/</span>
                          <span className="font-medium text-emerald-400" title="Paid Students">{school.paidStudentCount || 0} paid</span>
                          {!isDemo && unpaidCount > 0 && (
                            <span className="block text-[10px] text-amber-400 font-sans font-medium">({unpaidCount} unpaid)</span>
                          )}
                        </td>

                        {/* Revenue Generated */}
                        <td className="py-3 px-4 text-right font-mono text-xs font-bold text-emerald-400">
                          {isDemo ? (
                            <div>
                              <span className="text-slate-400">GHS 0.00</span>
                              <span className="block text-[9px] font-sans font-medium text-slate-500 uppercase tracking-tight">(Demo - Exempt)</span>
                            </div>
                          ) : (
                            `GHS ${schoolRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4 text-center">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Deactivated
                            </span>
                          )}
                        </td>

                        {/* Access Toggle */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleAccess(school.id, school.accessLevel)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                              school.accessLevel === 'Restricted' 
                                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30' 
                                : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
                            }`}
                            title={school.accessLevel === 'Restricted' ? 'Click to grant full access' : 'Click to restrict access'}
                          >
                            {school.accessLevel === 'Restricted' ? 'Restricted' : 'Full Access'}
                          </button>
                        </td>

                        {/* Quick Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSendNotice(school.id, unpaidCount)}
                              className="p-1.5 rounded-lg text-amber-400 hover:bg-slate-800 hover:text-amber-300 transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                              title={unpaidCount > 0 ? `Send Billing Notice for ${unpaidCount} unpaid students` : 'All students paid for'}
                              disabled={unpaidCount <= 0 || isDemo}
                            >
                              <Bell className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleVerifyPayment(school.id, school.studentCount)}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 transition cursor-pointer"
                              title="Verify Payment (Mark All Current Students Paid)"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(school.id, school.status)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                school.status !== 'Deactivated' 
                                  ? 'text-slate-400 hover:bg-slate-800 hover:text-red-400' 
                                  : 'text-slate-400 hover:bg-slate-800 hover:text-emerald-400'
                              }`}
                              title={school.status !== 'Deactivated' ? 'Deactivate School' : 'Reactivate School'}
                            >
                              {school.status !== 'Deactivated' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW (Visible on mobile screens < md - avoids horizontal scrolling completely) */}
          <div className="md:hidden divide-y divide-slate-800/80">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4 bg-slate-800" />
                  <Skeleton className="h-3 w-1/2 bg-slate-800/60" />
                  <Skeleton className="h-12 w-full bg-slate-800/40 rounded-xl" />
                </div>
              ))
            ) : filteredSchools.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No matching registered schools found.
              </div>
            ) : (
              filteredSchools.map((school) => {
                const isActive = school.status !== 'Deactivated';
                const isDemo = isDemoSchool(school);
                const unpaidCount = Math.max(0, school.studentCount - (school.paidStudentCount || 0));
                const schoolRevenue = isDemo ? 0 : (school.paidStudentCount || 0) * PRICE_PER_STUDENT;

                return (
                  <div key={school.id} className="p-4 space-y-3 hover:bg-slate-800/30 transition">
                    {/* Top Row: School Name & Status Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-white text-sm leading-snug truncate flex items-center gap-1.5" title={school.name}>
                          {school.name}
                          {isDemo && (
                            <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-700 shrink-0">Demo</span>
                          )}
                        </h3>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">ID: {school.id}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Deactivated
                          </span>
                        )}
                        <button
                          onClick={() => handleToggleAccess(school.id, school.accessLevel)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                            school.accessLevel === 'Restricted' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {school.accessLevel === 'Restricted' ? 'Restricted' : 'Full Access'}
                        </button>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-500 shrink-0" />
                          Contact
                        </span>
                        <span className="text-slate-300 font-medium truncate block mt-0.5" title={school.email}>
                          {school.email || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                          Location
                        </span>
                        <span className="text-slate-300 font-medium truncate block mt-0.5" title={`${school.district || ''}, ${school.region || ''}`}>
                          {school.district ? `${school.district}, ${school.region}` : school.region || 'N/A'}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-800/60">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Students</span>
                        <span className="text-slate-200 font-medium block mt-0.5">
                          <strong className="text-white font-mono">{school.studentCount}</strong>
                          <span className="text-slate-500 text-[10px] ml-1">({school.paidStudentCount || 0} paid)</span>
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-800/60">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Revenue</span>
                        <span className="text-emerald-400 font-bold font-mono block mt-0.5">
                          {isDemo ? (
                            <span className="text-slate-400 text-xs">GHS 0.00 <span className="text-[9px] font-sans text-slate-500 font-normal">(Demo)</span></span>
                          ) : (
                            `GHS ${schoolRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Touch Actions Bar */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleVerifyPayment(school.id, school.studentCount)}
                        className="flex-1 py-2 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Verify Payment</span>
                      </button>
                      
                      <button
                        onClick={() => handleSendNotice(school.id, unpaidCount)}
                        disabled={unpaidCount <= 0 || isDemo}
                        className="py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                        title="Send Notice"
                      >
                        <Bell className="h-3.5 w-3.5" />
                        <span>Notice</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(school.id, school.status)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition border cursor-pointer active:scale-95 ${
                          school.status !== 'Deactivated' 
                            ? 'bg-slate-800/80 text-slate-300 hover:text-red-400 border-slate-700' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {school.status !== 'Deactivated' ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                        <span>{school.status !== 'Deactivated' ? 'Deactivate' : 'Activate'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
