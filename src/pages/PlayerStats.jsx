import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';

export function PlayerStats() {
  const [players, setPlayers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'goals', direction: 'desc' });
  const [leagues, setLeagues] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const [selectedSeasonId, setSelectedSeasonId] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/leagues').catch(() => ({ data: [] })),
      api.get('/seasons').catch(() => ({ data: [] }))
    ]).then(([leaguesRes, seasonsRes]) => {
      setLeagues(Array.isArray(leaguesRes.data) ? leaguesRes.data : []);
      setSeasons(Array.isArray(seasonsRes.data) ? seasonsRes.data : []);
    });
  }, []);

  useEffect(() => {
    async function loadPlayerStats() {
      try {
        if (selectedSeasonId) {
          const { data } = await api.get('/matches/player-stats', {
            params: { season_id: selectedSeasonId }
          });
          setPlayers(Array.isArray(data) ? data : []);
          return;
        }

        if (!selectedLeagueId) {
          const { data } = await api.get('/matches/player-stats');
          setPlayers(Array.isArray(data) ? data : []);
          return;
        }

        const leagueSeasonIds = seasons
          .filter((season) => String(season.league_id) === String(selectedLeagueId))
          .map((season) => season.id);

        if (leagueSeasonIds.length === 0) {
          setPlayers([]);
          return;
        }

        const responses = await Promise.all(
          leagueSeasonIds.map((seasonId) =>
            api.get('/matches/player-stats', { params: { season_id: seasonId } }).catch(() => ({ data: [] }))
          )
        );

        const mergedMap = new Map();
        responses
          .flatMap((response) => (Array.isArray(response.data) ? response.data : []))
          .forEach((player) => {
            const key = String(player.id ?? `${player.name || 'unknown'}-${player.position || 'NA'}`);
            const current = mergedMap.get(key);

            if (!current) {
              mergedMap.set(key, {
                ...player,
                apps: Number(player.apps || 0),
                goals: Number(player.goals || 0),
                assists: Number(player.assists || 0)
              });
              return;
            }

            mergedMap.set(key, {
              ...current,
              apps: Number(current.apps || 0) + Number(player.apps || 0),
              goals: Number(current.goals || 0) + Number(player.goals || 0),
              assists: Number(current.assists || 0) + Number(player.assists || 0)
            });
          });

        setPlayers(Array.from(mergedMap.values()));
      } catch {
        setPlayers([]);
      }
    }

    loadPlayerStats();
  }, [selectedLeagueId, selectedSeasonId, seasons]);

  const filteredSeasons = useMemo(() => {
    if (!selectedLeagueId) return seasons;
    return seasons.filter((s) => String(s.league_id) === String(selectedLeagueId));
  }, [seasons, selectedLeagueId]);

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Player Statistics
            </h1>
            <p className="text-slate-500 mt-1">Top scorers and assist leaders across the league</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <select
              value={selectedLeagueId}
              onChange={(event) => {
                setSelectedLeagueId(event.target.value);
                setSelectedSeasonId('');
              }}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm min-w-40"
            >
              <option value="">All Leagues</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>

            <select
              value={selectedSeasonId}
              onChange={(event) => setSelectedSeasonId(event.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm min-w-40"
            >
              <option value="">All Seasons</option>
              {filteredSeasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {selectedLeagueId ? season.name : `${season.league_name} - ${season.name}`}
                </option>
              ))}
            </select>
          </div>
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
