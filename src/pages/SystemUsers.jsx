import React, { useEffect, useMemo, useState } from 'react';
import { Users, UserCog, RefreshCw, Save } from 'lucide-react';
import api from '../lib/api';
import { getCurrentUser, hasAnyRole } from '../lib/auth';

const ROLE_OPTIONS = [
  { value: 'public_user', label: 'Public User' },
  { value: 'participant', label: 'Participant' },
  { value: 'league_admin', label: 'League Admin' },
  { value: 'system_admin', label: 'System Admin' }
];

function rolesToState(roles = []) {
  return ROLE_OPTIONS.reduce((acc, role) => {
    acc[role.value] = roles.includes(role.value);
    return acc;
  }, {});
}

function stateToRoles(roleState) {
  return ROLE_OPTIONS
    .filter((role) => roleState[role.value])
    .map((role) => role.value);
}

export function SystemUsers() {
  const currentUser = getCurrentUser();
  const canAccess = hasAnyRole(currentUser, ['system_admin']);
  const [users, setUsers] = useState([]);
  const [editingState, setEditingState] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function loadUsers() {
    setLoading(true);
    setErrorMessage('');

    try {
      const { data } = await api.get('/auth/users');
      const rows = Array.isArray(data) ? data : [];
      setUsers(rows);

      const nextEditingState = {};
      for (const user of rows) {
        nextEditingState[user.id] = {
          roles: rolesToState(user.roles),
          participantType: user.participantType || 'player'
        };
      }
      setEditingState(nextEditingState);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canAccess) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [canAccess]);

  const userCount = useMemo(() => users.length, [users]);

  async function handleSaveUser(user) {
    const state = editingState[user.id];
    if (!state) {
      return;
    }

    const roles = stateToRoles(state.roles);
    if (roles.length === 0) {
      setErrorMessage('At least one role is required.');
      return;
    }

    if (roles.includes('participant') && !state.participantType) {
      setErrorMessage('Participant type is required when participant role is selected.');
      return;
    }

    setSavingUserId(user.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await api.patch(`/auth/users/${user.id}/roles`, {
        roles,
        participantType: roles.includes('participant') ? state.participantType : null
      });

      setSuccessMessage(`Updated ${user.displayName}`);
      await loadUsers();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to update user');
    } finally {
      setSavingUserId('');
    }
  }

  if (!canAccess) {
    return (
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-6 dark:bg-rose-900/20 dark:border-rose-900/40 dark:text-rose-300">
            Only system admins can access user administration.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">System Users</h1>
            <p className="text-slate-500 mt-1">View all accounts and update user roles when necessary.</p>
          </div>

          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800">
            <UserCog className="text-blue-600 dark:text-blue-400" size={16} />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{userCount} Users</span>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-rose-300 bg-rose-50 text-rose-700 px-4 py-3 text-sm dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/40">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40">
            {successMessage}
          </div>
        ) : null}

        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">User Management</h2>
            </div>
            <button
              type="button"
              onClick={loadUsers}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No users found.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((user) => {
                const state = editingState[user.id] || { roles: rolesToState(user.roles), participantType: user.participantType || 'player' };
                const selectedRoles = stateToRoles(state.roles);
                const isSaving = savingUserId === user.id;

                return (
                  <div key={user.id} className="p-6 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                            {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100">{user.displayName}</h3>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {user.roles.map((role) => (
                            <span key={role} className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveUser(user)}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5"
                      >
                        <Save size={14} />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Roles</span>
                        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3">
                          {ROLE_OPTIONS.map((role) => (
                            <label key={role.value} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={Boolean(state.roles[role.value])}
                                onChange={(event) => setEditingState((prev) => ({
                                  ...prev,
                                  [user.id]: {
                                    ...prev[user.id],
                                    roles: {
                                      ...prev[user.id].roles,
                                      [role.value]: event.target.checked
                                    }
                                  }
                                }))}
                              />
                              {role.label}
                            </label>
                          ))}
                        </div>
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Participant Type</span>
                        <select
                          value={state.participantType}
                          onChange={(event) => setEditingState((prev) => ({
                            ...prev,
                            [user.id]: {
                              ...prev[user.id],
                              participantType: event.target.value
                            }
                          }))}
                          disabled={!selectedRoles.includes('participant')}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="player">Player</option>
                          <option value="coach">Coach</option>
                        </select>
                      </label>

                      <div className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">User ID</span>
                        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-500 break-all">
                          {user.id}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
