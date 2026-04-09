import React, { useEffect, useState } from 'react';
import api from '../lib/api';

export function StandingsCard({ seasonId = '' }) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadStandings() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const { data } = await api.get('/matches/standings', {
          params: seasonId ? { season_id: Number(seasonId) } : undefined
        });
        setRows(Array.isArray(data) ? data : []);
      } catch (error) {
        setRows([]);
        setErrorMessage(error.response?.data?.message || 'Failed to load standings');
      } finally {
        setIsLoading(false);
      }
    }

    loadStandings();
  }, [seasonId]);

  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Standings Table</h3>
      </div>

      {errorMessage ? (
        <div className="px-6 py-3 text-sm text-rose-700 bg-rose-50 border-b border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/40">
          {errorMessage}
        </div>
      ) : null}
      
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
              <th className="px-4 py-3">GF</th>
              <th className="px-4 py-3">GA</th>
              <th className="px-4 py-3">GD</th>
              <th className="px-4 py-3 text-blue-600">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-6 py-6 text-sm text-slate-500">Loading standings...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-6 text-sm text-slate-500">No standings data yet.</td>
              </tr>
            ) : rows.map((row, index) => (
              <tr key={row.team_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className={`px-6 py-4 font-bold ${index === 0 ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>
                  {row.pos}
                </td>
                <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-100">{row.team_name}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{row.mp}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{row.w}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{row.d}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{row.l}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{row.gf}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{row.ga}</td>
                <td className="px-4 py-4 text-emerald-600 font-medium">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                <td className="px-4 py-4 font-black text-slate-900 dark:text-slate-100">{row.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
