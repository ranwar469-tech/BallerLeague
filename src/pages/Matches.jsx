import React from 'react';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const MATCHES_DATA = [
  {
    id: 1,
    date: 'Saturday 24 Feb',
    matches: [
      { home: 'Manchester Eagles', away: 'Liverpool Red Oaks', time: '12:30', venue: 'Old Trafford', status: 'Upcoming' },
      { home: 'Birmingham Bulls', away: 'London Lions', time: '15:00', venue: 'Villa Park', status: 'Upcoming' },
      { home: 'Brighton Seagulls', away: 'Newcastle Knights', time: '15:00', venue: 'Amex Stadium', status: 'Upcoming' },
      { home: 'Leeds Warriors', away: 'West Ham Hammers', time: '17:30', venue: 'Elland Road', status: 'Upcoming' },
    ]
  },
  {
    id: 2,
    date: 'Sunday 25 Feb',
    matches: [
      { home: 'Chelsea Blues', away: 'Tottenham Spurs', time: '14:00', venue: 'Stamford Bridge', status: 'Upcoming' },
      { home: 'Arsenal Gunners', away: 'Manchester Blue', time: '16:30', venue: 'Emirates Stadium', status: 'Upcoming' },
    ]
  },
  {
    id: 3,
    date: 'Monday 26 Feb',
    matches: [
      { home: 'Brentford Bees', away: 'Fulham Cottagers', time: '20:00', venue: 'Gtech Community Stadium', status: 'Upcoming' },
    ]
  }
];

export function Matches() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Match Schedule
            </h1>
            <p className="text-slate-500 mt-1">Matchday 24 of 38</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2 px-2 font-bold text-slate-900 dark:text-slate-100">
              <Calendar size={18} className="text-blue-600" />
              <span>Feb 24 - Feb 26</span>
            </div>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {MATCHES_DATA.map((day) => (
            <div key={day.id} className="space-y-3">
              <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider px-2">
                {day.date}
              </h3>
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {day.matches.map((match, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                      <div className="flex items-center gap-2 min-w-[80px] justify-center md:justify-start">
                        <div className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center gap-1.5">
                          <Clock size={12} />
                          {match.time}
                        </div>
                      </div>
                      
                      <div className="flex-1 grid grid-cols-3 items-center gap-4 w-full">
                        <div className="text-right font-bold text-slate-900 dark:text-slate-100 truncate">
                          {match.home}
                        </div>
                        <div className="flex justify-center">
                          <div className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            vs
                          </div>
                        </div>
                        <div className="text-left font-bold text-slate-900 dark:text-slate-100 truncate">
                          {match.away}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 min-w-[150px] justify-center md:justify-end text-xs text-slate-500">
                        <MapPin size={14} />
                        <span className="truncate max-w-[120px]">{match.venue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
