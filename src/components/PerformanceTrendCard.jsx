import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

export function PerformanceTrendCard({ seasonId = '' }) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStandingsSnapshot() {
      setIsLoading(true);
      try {
        const { data } = await api.get('/matches/standings', {
          params: seasonId ? { season_id: Number(seasonId) } : undefined
        });
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadStandingsSnapshot();
  }, [seasonId]);

  const summary = useMemo(() => {
    if (rows.length === 0) {
      return null;
    }

    const leader = rows[0];
    const second = rows[1] || null;
    const topAttack = rows.reduce((best, row) => (row.gf > best.gf ? row : best), rows[0]);
    const bestDefense = rows.reduce((best, row) => (row.ga < best.ga ? row : best), rows[0]);
    const totalPoints = rows.reduce((sum, row) => sum + row.pts, 0);

    return {
      leader,
      second,
      topAttack,
      bestDefense,
      avgPoints: (totalPoints / rows.length).toFixed(1)
    };
  }, [rows]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-6">Season Insights</h3>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading insights...</p>
      ) : !summary ? (
        <p className="text-sm text-slate-500">No standings data available for insights.</p>
      ) : (
        <div className="space-y-4">
          <InsightRow label="League Leader" value={`${summary.leader.team_name} (${summary.leader.pts} pts)`} />
          <InsightRow
            label="Title Gap"
            value={summary.second ? `${summary.leader.pts - summary.second.pts} pts to 2nd` : 'No challenger yet'}
          />
          <InsightRow label="Top Attack" value={`${summary.topAttack.team_name} (${summary.topAttack.gf} GF)`} />
          <InsightRow label="Best Defense" value={`${summary.bestDefense.team_name} (${summary.bestDefense.ga} GA)`} />
          <InsightRow label="Average Points" value={`${summary.avgPoints} pts/team`} />
        </div>
      )}

      <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <p className="text-[11px] text-slate-500 italic">
          Insights are calculated from official match standings and update with season filtering.
        </p>
      </div>
    </div>
  );
}

function InsightRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-slate-100 text-right">{value}</span>
    </div>
  );
}
