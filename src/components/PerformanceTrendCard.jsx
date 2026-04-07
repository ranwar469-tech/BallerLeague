import React from 'react';

export function PerformanceTrendCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-6">Performance Trend</h3>
      
      <div className="h-48 flex items-end justify-between gap-1 relative border-b border-l border-slate-100 dark:border-slate-800">
        <div className="w-full h-full absolute inset-0 pt-4 px-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100" preserveAspectRatio="none">
            {/* Current Season Line */}
            <path 
              d="M0,80 L40,60 L80,45 L120,50 L160,20 L200,10" 
              fill="none" 
              stroke="#2563eb" 
              strokeLinecap="round" 
              strokeWidth="3"
            />
            {/* Previous Season Line */}
            <path 
              d="M0,90 L40,85 L80,70 L120,65 L160,55 L200,45" 
              fill="none" 
              stroke="#94a3b8" 
              strokeDasharray="4" 
              strokeWidth="2"
            />
            {/* End Dot */}
            <circle cx="200" cy="10" fill="#2563eb" r="4" />
          </svg>
        </div>
      </div>
      
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-blue-600"></div>
            <span className="text-slate-600 dark:text-slate-400">Current Paces</span>
          </div>
          <span className="font-bold text-emerald-600">+12%</span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-slate-400"></div>
            <span className="text-slate-600 dark:text-slate-400">Previous Season</span>
          </div>
          <span className="font-bold text-slate-500">Avg</span>
        </div>
      </div>
      
      <div className="mt-8 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <p className="text-[11px] text-slate-500 italic">
          "Manchester Eagles are projected to finish with 82 points based on current win rate."
        </p>
      </div>
    </div>
  );
}
