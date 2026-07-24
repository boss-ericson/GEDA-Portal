import React from 'react';
import { Sparkles, Lock, Clock } from 'lucide-react';
import { School, Student, Role } from '../types';

interface AICenterProps {
  school: School;
  students: Student[];
  user?: any;
  role: Role;
}

export default function AICenter({ school }: AICenterProps) {
  const handleShowNotice = () => {
    alert("AI Center will be available to you soon");
  };

  return (
    <div className="space-y-6 fade-in min-h-[500px] flex flex-col justify-center items-center py-12">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-xl space-y-6 relative overflow-hidden">
        
        {/* Background ambient glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-brand-green-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          {/* Lock Icon */}
          <div className="inline-flex items-center justify-center p-5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-3xl shadow-inner mx-auto">
            <Lock className="h-12 w-12 text-amber-500" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" />
              <span>Coming Soon</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-950 dark:text-white tracking-tight">
              AI Center will be available to you soon
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              The NaCCA AI Center is locked while we upgrade our AI document generation engines and align with updated GES curriculum standards.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <button
              onClick={handleShowNotice}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Check AI Status</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
