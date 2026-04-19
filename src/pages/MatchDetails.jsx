import React from 'react';
import { MatchEntryCard } from '../components/MatchEntryCard';

export function MatchDetails() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Match Details
            </h1>
          </div>
        </div>

        <MatchEntryCard />
      </div>
    </main>
  );
}
