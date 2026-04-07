import React from 'react';

const STANDINGS_DATA = [
  { pos: 1, team: 'Manchester Eagles', mp: 24, w: 18, d: 4, l: 2, gd: '+32', pts: 58 },
  { pos: 2, team: 'London Lions', mp: 24, w: 17, d: 3, l: 4, gd: '+28', pts: 54 },
  { pos: 3, team: 'Liverpool Red Oaks', mp: 23, w: 16, d: 4, l: 3, gd: '+25', pts: 52 },
  { pos: 4, team: 'Birmingham Bulls', mp: 24, w: 14, d: 6, l: 4, gd: '+15', pts: 48 },
  { pos: 5, team: 'Newcastle Knights', mp: 24, w: 13, d: 5, l: 6, gd: '+12', pts: 44 },
];

export function StandingsCard() {
  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Live League Standings</h3>
        <div className="flex gap-2">
          <button className="text-xs font-bold text-blue-600 hover:bg-blue-600/5 px-2 py-1 rounded transition-colors">View Full</button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Pos</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">MP</th>
              <th className="px-4 py-3">W</th>
              <th className="px-4 py-3">D</th>
              <th className="px-4 py-3">L</th>
              <th className="px-4 py-3">GD</th>
              <th className="px-4 py-3 text-blue-600">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {STANDINGS_DATA.map((row, index) => (
              <tr key={row.team} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className={`px-6 py-4 font-bold ${index === 0 ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>
                  {row.pos}
                </td>
                <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-100">{row.team}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{row.mp}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{row.w}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{row.d}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{row.l}</td>
                <td className="px-4 py-4 text-emerald-600 font-medium">{row.gd}</td>
                <td className="px-4 py-4 font-black text-slate-900 dark:text-slate-100">{row.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
