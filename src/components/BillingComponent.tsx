import React, { useState } from 'react';
import { School, Student } from '../types';
import { CreditCard, CheckCircle2, ShieldCheck, Calculator, AlertTriangle, Phone, Mail, MessageSquare } from 'lucide-react';

interface BillingComponentProps {
  school: School;
  students: Student[];
}

export default function BillingComponent({ school, students }: BillingComponentProps) {
  const [successMsg, setSuccessMsg] = useState('');
  
  // Calculate active students
  const activeStudents = students.filter(s => s.admissionStatus === 'Admitted').length;
  const paidStudents = school.paidStudentCount || 0;
  const unpaidStudents = Math.max(0, activeStudents - paidStudents);
  
  const pricePerStudent = 10; // e.g., 10 GHS per student
  const totalAmount = unpaidStudents * pricePerStudent;

  const waMessage = `Hello Super Admin! My school, *${school.name}* (${school.region}/${school.district}), has completed payment for the Blaze Plan.\n\n*Billing Details*:\n- Unpaid New Students: ${unpaidStudents}\n- Amount Paid: GHS ${totalAmount.toFixed(2)}\n\nPlease verify our transaction and enable Full access for our school space. Thank you!`;
  const waUrl = `https://wa.me/233241828473?text=${encodeURIComponent(waMessage)}`;

  const handleVerifyPayment = () => {
    setSuccessMsg(
      'Payment verification request initiated! A WhatsApp chat has been opened to send details to our Super Admin (+233 24 182 8473) for quick activation. If the window did not open, click the button on the right.'
    );
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-500 animate-pulse" />
            Billing & Usage (Blaze Plan)
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Manage your school's platform subscription and view usage details based on student capacity.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          Blaze Plan
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm dark:shadow-none animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block text-slate-900 dark:text-white">Verification Chat Initiated</span>
              <span className="text-slate-600 dark:text-slate-400 mt-0.5 block">{successMsg}</span>
            </div>
          </div>
          <a 
            href={waUrl}
            target="_blank" 
            rel="noreferrer" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-[11px] flex items-center gap-1.5 shrink-0 self-start md:self-auto transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Send via WhatsApp
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="font-display font-semibold text-slate-900 dark:text-white text-sm">Usage Overview</h3>
            <p className="text-slate-400 text-xs">Your current term billing metrics.</p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Calculator className="h-5 w-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Admitted Students</span>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{activeStudents}</span>
            </div>

            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Previously Paid For</span>
              </div>
              <span className="text-lg font-bold text-emerald-600">{paidStudents}</span>
            </div>

            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cost Per New Student</span>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">GHS {pricePerStudent.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between bg-amber-50 p-4 rounded-xl border border-amber-200">
              <span className="text-sm font-bold text-amber-900">Total Amount Due ({unpaidStudents} unpaid)</span>
              <span className="text-2xl font-bold text-amber-600">GHS {totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            {unpaidStudents === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-sm flex items-center justify-center gap-2 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                All caught up! No payment required.
              </div>
            ) : (
              <>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Manual Payment & Negotiation Options</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                  We understand you may prefer alternative payment methods. You can pay via direct Mobile Money/Bank Transfer, or reach out to negotiate your billing.
                </p>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                   <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                     <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">MTN Mobile Money</span>
                     <span className="block font-mono text-sm font-bold text-slate-800 dark:text-slate-200">024 182 8473</span>
                     <span className="block text-[10px] text-slate-500 dark:text-slate-400">Name: Eric Yeboah</span>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                     <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Bank Transfer</span>
                     <span className="block font-mono text-sm font-bold text-slate-800 dark:text-slate-200">5061120001127</span>
                     <span className="block text-[10px] text-slate-500 dark:text-slate-400">Name: Eric Yeboah<br/>Bank: GCB</span>
                   </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button 
                      onClick={handleVerifyPayment}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      I've Paid via MoMo / Bank (Verify)
                    </button>
                    <div className="flex gap-2">
                      <a href="https://wa.me/233241828473?text=Hello,%20I%20would%20like%20to%20discuss%20my%20billing%20plan%20for%20GEDA%20Systems." target="_blank" rel="noreferrer" className="flex-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-medium py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                      <a href="mailto:billing@geda.edu.gh?subject=Negotiate Billing Plan" className="flex-1 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        Email Sales
                      </a>
                    </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
            <h3 className="font-display font-semibold text-slate-900 dark:text-white text-sm">Why the Blaze Plan?</h3>
          </div>
          <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Scale seamlessly as your student enrollment grows.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Priority 24/7 technical support for your administrators.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Access to advanced analytics and offline data synchronization.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Automated secure cloud backups to prevent data loss.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
