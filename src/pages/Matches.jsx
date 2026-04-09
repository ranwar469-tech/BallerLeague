import React, { useEffect, useMemo, useState } from 'react';
import { Clock, MapPin, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import { getCurrentUser, isAdminUser } from '../lib/auth';

const DEFAULT_EVENT_TIMEZONE = 'Europe/London';

function formatDateTime(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function toDateInputValue(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function buildMatchEventId(matchId) {
  return `match-fixture-${matchId}`;
}

function buildEventPayloadFromMatch(match) {
  const startDate = new Date(match.kickoff_at);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  return {
    id: buildMatchEventId(match.id),
    title: `${match.home_team_name} vs ${match.away_team_name}`,
    description: '',
    location: match.venue || '',
    start: {
      dateTime: startDate.toISOString(),
      timeZone: DEFAULT_EVENT_TIMEZONE
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: DEFAULT_EVENT_TIMEZONE
    },
    allDay: false,
    googleCalendarEventId: null
  };
}

export function Matches() {
  const [playedMatches, setPlayedMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [adminMatches, setAdminMatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [syncMessage, setSyncMessage] = useState('');

  const user = getCurrentUser();
  const canManageFixtures = isAdminUser(user);

  const [createForm, setCreateForm] = useState({
    season_id: '',
    home_team_id: '',
    away_team_id: '',
    kickoff_at: '',
    venue: ''
  });

  async function loadPublicFixtures() {
    const [{ data: past }, { data: upcoming }] = await Promise.all([
      api.get('/matches/past'),
      api.get('/matches/upcoming')
    ]);

    setPlayedMatches(Array.isArray(past) ? past : []);
    setUpcomingMatches(Array.isArray(upcoming) ? upcoming : []);
  }

  async function loadAdminFixtures() {
    if (!canManageFixtures) {
      return;
    }

    const [{ data: all }, { data: allTeams }, { data: allSeasons }] = await Promise.all([
      api.get('/matches/admin/all'),
      api.get('/teams'),
      api.get('/seasons')
    ]);

    setAdminMatches(Array.isArray(all) ? all : []);
    setTeams(Array.isArray(allTeams) ? allTeams : []);
    setSeasons(Array.isArray(allSeasons) ? allSeasons : []);
  }

  async function loadEvents() {
    const { data } = await api.get('/matches/calendar');
    setEvents(Array.isArray(data) ? data : []);
  }

  async function loadData() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      await Promise.all([loadPublicFixtures(), loadAdminFixtures(), loadEvents()]);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to load fixture data');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [canManageFixtures]);

  const adminVisibleMatches = useMemo(() => {
    if (!canManageFixtures) {
      return [];
    }

    return adminMatches;
  }, [adminMatches, canManageFixtures]);

  const eventsById = useMemo(() => {
    const map = new Map();
    for (const event of events) {
      if (event?.id) {
        map.set(event.id, event);
      }
    }
    return map;
  }, [events]);

  const unsyncedUpcomingCount = useMemo(() => {
    return upcomingMatches.filter((match) => {
      const event = eventsById.get(buildMatchEventId(match.id));
      return !event || !event.googleCalendarEventId;
    }).length;
  }, [eventsById, upcomingMatches]);

  async function handleCreateMatch(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const kickoffDate = new Date(createForm.kickoff_at);
    const isPastFixture = !Number.isNaN(kickoffDate.getTime()) && kickoffDate < new Date();

    try {
      await api.post('/matches/manual', {
        season_id: Number(createForm.season_id),
        home_team_id: Number(createForm.home_team_id),
        away_team_id: Number(createForm.away_team_id),
        kickoff_at: new Date(createForm.kickoff_at).toISOString(),
        venue: createForm.venue,
        published: false
      });

      setCreateForm({ season_id: '', home_team_id: '', away_team_id: '', kickoff_at: '', venue: '' });
      await loadData();

      if (isPastFixture) {
        setSyncMessage('Past-dated fixture created and listed in Current/Played Fixtures.');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to create fixture');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublishToggle(match) {
    try {
      await api.patch(`/matches/${match.id}/publish`, { published: !match.published });
      await loadData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to publish fixture');
    }
  }

  async function handleStatusUpdate(match, status) {
    const statusNote = window.prompt(`Add note for ${status} (optional):`, match.status_note || '') || '';
    try {
      await api.patch(`/matches/${match.id}/status`, { status, status_note: statusNote });
      await loadData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to update fixture status');
    }
  }

  async function handleEditSchedule(match) {
    const nextDateValue = window.prompt('New kickoff date/time (YYYY-MM-DDTHH:mm)', toDateInputValue(match.kickoff_at));
    if (!nextDateValue) {
      return;
    }

    const nextVenue = window.prompt('New venue', match.venue || '') ?? match.venue;

    try {
      await api.patch(`/matches/${match.id}/schedule`, {
        kickoff_at: new Date(nextDateValue).toISOString(),
        venue: nextVenue
      });
      await loadData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to edit schedule');
    }
  }

  async function handlePublishAll() {
    try {
      await api.post('/matches/publish', { published: true });
      await loadData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to publish all fixtures');
    }
  }

  async function handleSyncMatch(match) {
    if (!canManageFixtures) {
      return;
    }

    setIsSyncing(true);
    setErrorMessage('');
    setSyncMessage('');

    const eventId = buildMatchEventId(match.id);
    const existingEvent = eventsById.get(eventId);

    try {
      if (!existingEvent) {
        const payload = buildEventPayloadFromMatch(match);
        const { data } = await api.post('/matches/calendar', payload);
        setEvents((prev) => [data, ...prev]);
        setSyncMessage(`Match ${match.id} scheduled for Google Calendar sync.`);
        return;
      }

      if (existingEvent.googleCalendarEventId) {
        setSyncMessage(`Match ${match.id} is already synced to Google Calendar.`);
      } else {
        setSyncMessage(`Match ${match.id} is ready for Google Calendar sync. API hook will be added next.`);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to schedule match for Google Calendar sync');
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSyncUnsyncedUpcoming() {
    if (!canManageFixtures) {
      return;
    }

    const unsyncedMatches = upcomingMatches.filter((match) => {
      const event = eventsById.get(buildMatchEventId(match.id));
      return !event || !event.googleCalendarEventId;
    });

    if (unsyncedMatches.length === 0) {
      setSyncMessage('All upcoming fixtures are already synced or ready for sync.');
      return;
    }

    setIsSyncing(true);
    setErrorMessage('');
    setSyncMessage('');

    try {
      const createRequests = unsyncedMatches
        .filter((match) => !eventsById.get(buildMatchEventId(match.id)))
        .map((match) => api.post('/matches/calendar', buildEventPayloadFromMatch(match)));

      if (createRequests.length > 0) {
        const createdEvents = await Promise.all(createRequests);
        setEvents((prev) => [...createdEvents.map((response) => response.data), ...prev]);
      }

      setSyncMessage(`Prepared ${unsyncedMatches.length} upcoming fixture(s) for Google Calendar sync.`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to sync unsynced fixtures');
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Match Fixtures & Scheduling
            </h1>
            <p className="text-slate-500 mt-1">Create, edit, postpone, cancel, publish, and browse fixtures.</p>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-rose-300 bg-rose-50 text-rose-700 px-4 py-3 text-sm dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/40">
            {errorMessage}
          </div>
        ) : null}

        {syncMessage ? (
          <div className="rounded-lg border border-blue-300 bg-blue-50 text-blue-700 px-4 py-3 text-sm dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/40">
            {syncMessage}
          </div>
        ) : null}

        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">League Admin Fixture Controls</h2>
              {!canManageFixtures ? <p className="text-[11px] text-slate-500 mt-1">Only league admins/system admins can use these controls.</p> : null}
            </div>
            <button
              type="button"
              onClick={handlePublishAll}
              disabled={!canManageFixtures}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} />
              Publish All
            </button>
          </div>

          <form onSubmit={handleCreateMatch} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <fieldset disabled={!canManageFixtures} className="contents">
              <select
                required
                value={createForm.season_id}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, season_id: event.target.value }))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">Season</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>{season.name}</option>
                ))}
              </select>

              <select
                required
                value={createForm.home_team_id}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, home_team_id: event.target.value }))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">Home Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>

              <select
                required
                value={createForm.away_team_id}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, away_team_id: event.target.value }))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">Away Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>

              <input
                required
                type="datetime-local"
                value={createForm.kickoff_at}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, kickoff_at: event.target.value }))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />

              <input
                placeholder="Venue"
                value={createForm.venue}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, venue: event.target.value }))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="md:col-span-5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5"
              >
                {isSubmitting ? 'Creating Fixture...' : 'Create Match Manually'}
              </button>
            </fieldset>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Current/Played Fixtures</h2>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
              Loading fixtures...
            </div>
          ) : playedMatches.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
              No current/played fixtures available.
            </div>
          ) : (
            <div className="space-y-3">
              {playedMatches.map((match) => (
                <article key={`played-${match.id}`} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                      <Clock size={12} />
                      {formatDateTime(match.kickoff_at)}
                    </div>

                    <div className="flex-1 grid grid-cols-3 items-center gap-4 w-full">
                      <div className="text-right font-bold text-slate-900 dark:text-slate-100 truncate">
                        {match.home_team_name}
                      </div>
                      <div className="flex justify-center">
                        <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest">vs</span>
                      </div>
                      <div className="text-left font-bold text-slate-900 dark:text-slate-100 truncate">
                        {match.away_team_name}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin size={14} />
                      <span>{match.venue || 'Venue TBA'}</span>
                    </div>

                    <span className="text-[11px] font-semibold uppercase px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {match.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Upcoming Fixtures</h2>
            <button
              type="button"
              onClick={handleSyncUnsyncedUpcoming}
              disabled={!canManageFixtures || isSyncing}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 text-sm transition-colors"
            >
              <RefreshCw size={14} />
              Sync Unsynced ({unsyncedUpcomingCount})
            </button>
          </div>

          {!canManageFixtures ? (
            <p className="text-[11px] text-slate-500">Only league admins/system admins can use sync controls.</p>
          ) : null}

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
              Loading fixtures...
            </div>
          ) : upcomingMatches.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
              No upcoming fixtures available.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <article key={`upcoming-${match.id}`} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                      <Clock size={12} />
                      {formatDateTime(match.kickoff_at)}
                    </div>

                    <div className="flex-1 grid grid-cols-3 items-center gap-4 w-full">
                      <div className="text-right font-bold text-slate-900 dark:text-slate-100 truncate">
                        {match.home_team_name}
                      </div>
                      <div className="flex justify-center">
                        <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest">vs</span>
                      </div>
                      <div className="text-left font-bold text-slate-900 dark:text-slate-100 truncate">
                        {match.away_team_name}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin size={14} />
                      <span>{match.venue || 'Venue TBA'}</span>
                    </div>

                    <span className={`text-[11px] font-semibold uppercase px-2 py-1 rounded-full ${eventsById.get(buildMatchEventId(match.id))?.googleCalendarEventId ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                      {eventsById.get(buildMatchEventId(match.id))?.googleCalendarEventId ? 'Synced' : 'Not Synced'}
                    </span>

                    <span className="text-[11px] font-semibold uppercase px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {match.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSyncMatch(match)}
                      disabled={!canManageFixtures || isSyncing}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 text-blue-700 dark:text-blue-300 dark:border-blue-900/40 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-3 py-1.5 text-xs transition-colors"
                    >
                      <RefreshCw size={12} />
                      Sync to Google Calendar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Admin Fixture Management</h2>
            {!canManageFixtures ? <p className="text-[11px] text-slate-500 mt-1">Only league admins/system admins can use these controls.</p> : null}
          </div>
          {adminVisibleMatches.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
                No fixtures to manage.
              </div>
          ) : (
              <div className="space-y-3">
                {adminVisibleMatches.map((match) => (
                  <article key={`admin-${match.id}`} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {match.home_team_name} vs {match.away_team_name}
                      </div>
                      <div className="text-xs text-slate-500">ID #{match.id} • {formatDateTime(match.kickoff_at)}</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => handleEditSchedule(match)} disabled={!canManageFixtures} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">Edit Schedule</button>
                      <button type="button" onClick={() => handleStatusUpdate(match, 'postponed')} disabled={!canManageFixtures} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed">Postpone</button>
                      <button type="button" onClick={() => handleStatusUpdate(match, 'cancelled')} disabled={!canManageFixtures} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300 disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                      <button type="button" onClick={() => handlePublishToggle(match)} disabled={!canManageFixtures} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        {match.published ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
          )}
        </section>
      </div>
    </main>
  );
}
