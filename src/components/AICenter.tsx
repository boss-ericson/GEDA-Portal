import { toast } from 'sonner';
import React from 'react';
import { Lock, Clock, Info } from 'lucide-react';
import { School, Student, Role } from '../types';

interface AICenterProps {
  school: School;
  students: Student[];
  user?: any;
  role: Role;
}

export default function AICenter({ school }: AICenterProps) {
  const handleShowNotice = () => {
    toast.info("AI Center will be available to you soon");
  };

  return (
    <div className="space-y-6 fade-in min-h-[480px] flex flex-col justify-center items-center py-12">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-10 text-center shadow-xs space-y-6">
        
        <div className="space-y-5">
          {/* Lock Icon */}
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-700">
            <Lock className="h-6 w-6" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>Coming Soon</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
              AI Center Module
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              The NaCCA AI Center is undergoing scheduled maintenance while we update curriculum standards and report generation rules for {school.name}.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <button
              onClick={handleShowNotice}
              className="px-5 py-2.5 bg-[#0B1E2D] hover:bg-[#13293D] text-white font-medium rounded-xl text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
            >
              <Info className="h-4 w-4" />
              <span>Check Module Availability</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

