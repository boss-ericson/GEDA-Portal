import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`shimmer-effect bg-slate-200/80 dark:bg-slate-700/60 rounded-lg ${className}`}
      style={style}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-36 rounded-lg" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

export function ChartWidgetSkeleton({ title = "Loading Chart..." }: { title?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      </div>
      {/* Chart Canvas Area */}
      <div className="h-64 w-full pt-4 flex flex-col justify-between">
        <div className="flex justify-between items-end h-48 gap-3 px-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          {[40, 65, 30, 85, 55, 90, 45, 70, 60, 80, 50, 95].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end items-center h-full">
              <Skeleton className={`w-full rounded-t-md`} style={{ height: `${h}%` } as React.CSSProperties} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs pt-2">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
      {/* Table Header Filter Controls */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="p-3.5">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: rows }).map((_, rIndex) => (
              <tr key={rIndex} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="p-3.5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </td>
                <td className="p-3.5">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="p-3.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="p-3.5">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MetricsCenterSkeleton() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 4 Top Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* 2 Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartWidgetSkeleton title="Revenue & Enrollment" />
        </div>
        <div className="lg:col-span-1">
          <ChartWidgetSkeleton title="Payment Methods" />
        </div>
      </div>

      {/* Table Widget */}
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}

export function StudentRegistrySkeleton() {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Table */}
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}

export function AnalyticsCenterSkeleton() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidgetSkeleton title="Class Roster Breakdown" />
        <ChartWidgetSkeleton title="Gender Ratio Analysis" />
      </div>
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}

export function GenericWidgetSkeleton({ title = "Loading Section" }: { title?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
