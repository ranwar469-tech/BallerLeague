import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getStoredUser, setAuthSession, getAuthToken } from '../lib/api';
import { User, Mail, Lock, Save, AlertCircle } from 'lucide-react';

export function UserSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setFormData({
      displayName: user.displayName || '',
      email: user.email || '',
      password: ''
    });
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        displayName: formData.displayName,
        email: formData.email
      };
      
      if (formData.password) {
        if (formData.password.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
        payload.password = formData.password;
      }

      const { data } = await api.patch('/auth/me/settings', payload);
      setAuthSession(getAuthToken(), data.user);
      setUser(data.user);
      setFormData({ ...formData, password: '' });
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred while updating settings');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            User Settings
          </h1>
          <p className="text-slate-500 mt-1">Manage your account profile and credentials.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-start gap-3">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-start gap-3">
              <div className="shrink-0 mt-0.5" size={18}>✓</div>
              <span className="text-sm font-medium">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Mail size={16} className="text-slate-400" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Lock size={16} className="text-slate-400" />
                New Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Leave blank to skip"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {isLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
