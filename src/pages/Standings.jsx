import React, { useEffect, useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import api from '../lib/api';
import { StandingsCard } from '../components/StandingsCard';
import { PerformanceTrendCard } from '../components/PerformanceTrendCard';

export function Standings() {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');

  useEffect(() => {
    api.get('/seasons')
      .then(({ data }) => setSeasons(Array.isArray(data) ? data : []))
      .catch(() => setSeasons([]));
  }, []);

  const selectedSeasonLabel = useMemo(() => {
    if (!selectedSeasonId) {
      return 'All Seasons';
    }

    const season = seasons.find((row) => String(row.id) === String(selectedSeasonId));
    if (!season) {
      return 'Selected Season';
    }

    return season.league_name ? `${season.league_name} - ${season.name}` : season.name;
  }, [selectedSeasonId, seasons]);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Standings
            </h1>
            <p className="text-slate-500 mt-1">Track table position and season insights using the same data model as teams, seasons, and matches.</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <select
              value={selectedSeasonId}
              onChange={(event) => setSelectedSeasonId(event.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm min-w-60"
            >
              <option value="">All Seasons</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.league_name ? `${season.league_name} - ${season.name}` : season.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-3 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800/50">
              <Trophy className="text-blue-600 dark:text-blue-400" size={16} />
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                {selectedSeasonLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <StandingsCard seasonId={selectedSeasonId} />
          <PerformanceTrendCard seasonId={selectedSeasonId} />
        </div>
      </div>
    </main>
  );
}
