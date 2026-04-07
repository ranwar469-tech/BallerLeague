import React from 'react';
import { 
  Users, 
  Trophy, 
  Activity, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Timer
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const ACTIVITY_DATA = [
  { name: 'MD1', goals: 12, attendance: 45000 },
  { name: 'MD2', goals: 18, attendance: 48000 },
  { name: 'MD3', goals: 15, attendance: 42000 },
  { name: 'MD4', goals: 22, attendance: 51000 },
  { name: 'MD5', goals: 14, attendance: 46000 },
  { name: 'MD6', goals: 20, attendance: 53000 },
  { name: 'MD7', goals: 24, attendance: 55000 },
];

const UPCOMING_MATCHES = [
  { home: 'Manchester Eagles', away: 'Liverpool Red Oaks', time: '14:00', date: 'Today' },
  { home: 'Birmingham Bulls', away: 'London Lions', time: '16:30', date: 'Today' },
  { home: 'Newcastle Knights', away: 'Leeds Warriors', time: '19:45', date: 'Tomorrow' },
];

export function Overview() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            League Overview
          </h1>
          <p className="text-slate-500 mt-1">Season 2023/24 • Matchday 24 of 38</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Teams" 
            value="20" 
            icon={<Users className="text-blue-600" size={24} />}
            trend="+2" 
            trendUp={true}
            label="vs last season"
          />
          <StatCard 
            title="Matches Played" 
            value="234" 
            icon={<Calendar className="text-emerald-600" size={24} />}
            trend="65%" 
            trendUp={true}
            label="completion"
          />
          <StatCard 
            title="Goals Scored" 
            value="642" 
            icon={<Activity className="text-orange-600" size={24} />}
            trend="+12%" 
            trendUp={true}
            label="vs last season"
          />
          <StatCard 
            title="Avg. Attendance" 
            value="42,500" 
            icon={<Trophy className="text-purple-600" size={24} />}
            trend="-1.2%" 
            trendUp={false}
            label="vs last season"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Goals per Matchday</h3>
              <select className="bg-slate-50 dark:bg-slate-800 border-none text-sm rounded-lg px-3 py-1 text-slate-600 dark:text-slate-400 focus:ring-0">
                <option>Last 7 Matchdays</option>
                <option>All Season</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ACTIVITY_DATA}>
                  <defs>
                    <linearGradient id="colorGoals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="goals" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorGoals)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Panel - Upcoming */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-6">Upcoming Matches</h3>
            <div className="space-y-6">
              {UPCOMING_MATCHES.map((match, i) => (
                <div key={i} className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                  <div className="flex flex-col items-center min-w-[60px] bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">{match.date}</span>
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">{match.time}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{match.home}</div>
                    <div className="text-xs text-slate-500 my-1">vs</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{match.away}</div>
                  </div>
                  <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-blue-600">
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              View Full Schedule
            </button>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Recent League Activity</h3>
            <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Match</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {[1, 2, 3].map((_, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">Manchester Eagles vs London Lions</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-500">Oct 24, 2023</td>
                    <td className="px-4 py-4 font-bold text-slate-900 dark:text-slate-100">2 - 1</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Final
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="text-slate-400 hover:text-blue-600 transition-colors">Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value, icon, trend, trendUp, label }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <div>
        <h4 className="text-slate-500 text-sm font-medium mb-1">{title}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{value}</span>
          <span className="text-xs text-slate-400">{label}</span>
        </div>
      </div>
    </div>
  );
}
