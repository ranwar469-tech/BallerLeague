import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';

export function PlayerStats() {
  const [players, setPlayers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'goals', direction: 'desc' });

  useEffect(() => {
    api.get('/matches/player-stats')
      .then(({ data }) => data)
      .then(data => {
        setPlayers(Array.isArray(data) ? data : []);
      });
  }, []);

  const sortedPlayers = useMemo(() => {
    const rows = [...players];

    rows.sort((a, b) => {
      if (!sortConfig.key) {
        return 0;
      }

      const aValue = Number(a?.[sortConfig.key] ?? 0);
      const bValue = Number(b?.[sortConfig.key] ?? 0);

      if (aValue === bValue) {
        return String(a?.name ?? '').localeCompare(String(b?.name ?? ''));
      }

      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return rows;
  }, [players, sortConfig]);

  function handleSort(key) {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  }

  function SortHeader({ label, sortKey }) {
    const isActive = sortConfig.key === sortKey;

    return (
      <button
        type="button"
        onClick={() => handleSort(sortKey)}
        className="inline-flex items-center justify-end gap-1 hover:text-blue-600 transition-colors"
      >
        <span>{label}</span>
        <ArrowUpDown size={12} className={isActive ? 'opacity-100' : 'opacity-40'} />
      </button>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Player Statistics
          </h1>
          <p className="text-slate-500 mt-1">Top scorers and assist leaders across the league</p>
        </div>

        {/* Stats Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Player</th>
                  <th className="px-6 py-4">Team</th>
                  <th className="px-6 py-4">Pos</th>
                  <th className="px-6 py-4 text-right">
                    <SortHeader label="Apps" sortKey="apps" />
                  </th>
                  <th className="px-6 py-4 text-right">
                    <SortHeader label="Goals" sortKey="goals" />
                  </th>
                  <th className="px-6 py-4 text-right">
                    <SortHeader label="Assists" sortKey="assists" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {sortedPlayers.map((player, index) => (
                  <tr key={player.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-400">#{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{player.name}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{player.team_name || 'Unknown Team'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {player.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{player.apps}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">{player.goals}</td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{player.assists}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{players.length}</span> of <span className="font-medium">{players.length}</span> players
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">
                <ChevronLeft size={16} />
              </button>
              <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
