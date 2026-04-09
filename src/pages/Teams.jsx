import React, { useEffect, useState } from 'react';
import { MapPin, Users } from 'lucide-react';
import api from '../lib/api';
import { getCurrentUser, hasAnyRole } from '../lib/auth';

export function Teams() {
  const [teams, setTeams] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({ name: '', stadium: '', city: '', logo: '' });
  const canManageTeams = hasAnyRole(getCurrentUser(), ['league_admin', 'system_admin']);

  useEffect(() => {
    api.get('/teams')
      .then(({ data }) => data)
      .then(setTeams);
  }, []);

  async function handleCreateTeam(event) {
    event.preventDefault();

    if (!canManageTeams) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { data: createdTeam } = await api.post('/teams', formData);
      setTeams((prev) => [createdTeam, ...prev]);
      setFormData({ name: '', stadium: '', city: '', logo: '' });
      setIsCreateOpen(false);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Teams
            </h1>
            <p className="text-slate-500 mt-1">Baller League • {teams.length} Teams</p>
            {!canManageTeams ? (
              <p className="text-[11px] text-slate-500 mt-2">Only league admins or system admins can use management actions.</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen((prev) => !prev)}
            disabled={!canManageTeams}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Users size={18} />
            {isCreateOpen ? 'Close Form' : 'Add New Team'}
          </button>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-rose-300 bg-rose-50 text-rose-700 px-4 py-3 text-sm dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/40">
            {errorMessage}
          </div>
        ) : null}

        {isCreateOpen ? (
          <form onSubmit={handleCreateTeam} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              required
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Team name"
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm"
            />
            <input
              value={formData.stadium}
              onChange={(event) => setFormData((prev) => ({ ...prev, stadium: event.target.value }))}
              placeholder="Stadium"
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm"
            />
            <input
              value={formData.city}
              onChange={(event) => setFormData((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="City"
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm"
            />
            <input
              value={formData.logo}
              onChange={(event) => setFormData((prev) => ({ ...prev, logo: event.target.value }))}
              placeholder="Logo URL (optional)"
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm"
            />
            <div className="md:col-span-4 flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-semibold"
              >
                {isSubmitting ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </form>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      </div>
    </main>
  );
}

const TeamCard = ({ team }) => {
  const logoLabel = team.name?.charAt(0)?.toUpperCase() || 'T';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="h-24 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-600 via-transparent to-transparent"></div>
        <div className="absolute -bottom-8 left-6">
          <div className="size-16 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center p-2 overflow-hidden">
            {team.logo ? (
              <img src={team.logo} alt={`${team.name} logo`} className="size-full object-cover rounded-lg" />
            ) : (
              <div className="size-full rounded-lg bg-slate-800 flex items-center justify-center text-white font-bold text-xl">
                {logoLabel}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="pt-10 p-6">
        <div className="mb-2">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 transition-colors">
            {team.name}
          </h3>
        </div>
        
        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <MapPin size={16} className="text-slate-400" />
            <span className="truncate">{team.stadium}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Users size={16} className="text-slate-400" />
            <span>{team.city || 'City not set'}</span>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <button className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}
