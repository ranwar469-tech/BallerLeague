/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ResultsAnalytics } from './pages/ResultsAnalytics';
import { Overview } from './pages/Overview';
import { Teams } from './pages/Teams';
import { PlayerStats } from './pages/PlayerStats';
import { Matches } from './pages/Matches';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          <Header />
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/results" element={<ResultsAnalytics />} />
            <Route path="/standings" element={<ResultsAnalytics />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/stats" element={<PlayerStats />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Overview />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
