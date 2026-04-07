import React, { useState } from 'react';
import { BarChart3, Shield, Save } from 'lucide-react';

export function MatchEntryCard() {
  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="text-blue-600" size={24} />
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Record Match Result</h2>
      </div>
      
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-3">
            <div className="size-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Shield className="text-slate-400" size={32} />
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300">Manchester Eagles</span>
            <input 
              type="number" 
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              className="w-24 h-16 text-center text-3xl font-black rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-blue-600 focus:border-blue-600 text-slate-900 dark:text-slate-100" 
              placeholder="0" 
            />
          </div>
          
          {/* VS */}
          <div className="flex flex-col items-center">
            <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold text-slate-500 uppercase">vs</div>
            <p className="text-xs text-slate-400 mt-2">Old Trafford, Manchester</p>
            <p className="text-[10px] text-slate-400">Matchday 24 • Final</p>
          </div>
          
          {/* Away Team */}
          <div className="flex flex-col items-center gap-3">
            <div className="size-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Shield className="text-slate-400" size={32} />
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300">London Lions</span>
            <input 
              type="number" 
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="w-24 h-16 text-center text-3xl font-black rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-blue-600 focus:border-blue-600 text-slate-900 dark:text-slate-100" 
              placeholder="0" 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Scorers</span>
            <input 
              type="text" 
              className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-blue-600 focus:border-blue-600 py-3 px-4 text-slate-900 dark:text-slate-100" 
              placeholder="e.g. Rashford 24', Fernandes 67'" 
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Assists</span>
            <input 
              type="text" 
              className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-blue-600 focus:border-blue-600 py-3 px-4 text-slate-900 dark:text-slate-100" 
              placeholder="e.g. Shaw 24', Casemiro 67'" 
            />
          </label>
        </div>
        
        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            <Save size={20} />
            Save & Recalculate Standings
          </button>
        </div>
      </form>
    </div>
  );
}
