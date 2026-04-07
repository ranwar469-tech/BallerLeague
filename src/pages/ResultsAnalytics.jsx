import React from 'react';
import { CheckCircle } from 'lucide-react';
import { MatchEntryCard } from '../components/MatchEntryCard';
import { StandingsCard } from '../components/StandingsCard';
import { PerformanceTrendCard } from '../components/PerformanceTrendCard';

export function ResultsAnalytics() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Results & Standings Analytics
            </h1>
            <p className="text-slate-500 mt-1">Module Variant 4 of 4 • Advanced Statistical Processing</p>
          </div>
          
          <div className="flex items-center gap-3 bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-800/50">
            <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={16} />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
              Standings Up to Date
            </span>
          </div>
        </div>
        
        {/* Record Result Section */}
        <MatchEntryCard />
        
        {/* Bottom Section: Standings & Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <StandingsCard />
          <PerformanceTrendCard />
        </div>
      </div>
    </main>
  );
}
