import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sprout, Droplet, Sun, Wind, Loader2, MapPin } from 'lucide-react';
import { IGAD, getCurrentSeason, getCountryCoordinates } from '@/lib/data/constants';
import { DataAggregator } from '@/lib/data/aggregator';

interface CalendarEntry {
  month: string;
  monthNum: number;
  activity: string;
  crop: string;
  type: 'planting' | 'growing' | 'harvesting' | 'fallow';
  icon: any;
  color: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateCalendar(country: string): CalendarEntry[] {
  const entries: CalendarEntry[] = [];
  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];

  // Maize calendar (staple crop)
  const maizeCalendar = [
    { month: 2, activity: 'Land preparation', type: 'fallow' as const, crop: 'Maize' },
    { month: 3, activity: 'Planting (long rains)', type: 'planting' as const, crop: 'Maize' },
    { month: 4, activity: 'Weeding + top-dress', type: 'growing' as const, crop: 'Maize' },
    { month: 5, activity: 'Top-dress + pest scouting', type: 'growing' as const, crop: 'Maize' },
    { month: 6, activity: 'Monitoring', type: 'growing' as const, crop: 'Maize' },
    { month: 7, activity: 'Harvest (early varieties)', type: 'harvesting' as const, crop: 'Maize' },
    { month: 8, activity: 'Harvest + drying', type: 'harvesting' as const, crop: 'Maize' },
    { month: 9, activity: 'Land prep (short rains)', type: 'fallow' as const, crop: 'Maize' },
    { month: 10, activity: 'Planting (short rains)', type: 'planting' as const, crop: 'Maize' },
    { month: 11, activity: 'Weeding + top-dress', type: 'growing' as const, crop: 'Maize' },
    { month: 0, activity: 'Growing + pest control', type: 'growing' as const, crop: 'Maize' },
    { month: 1, activity: 'Harvest (short rains)', type: 'harvesting' as const, crop: 'Maize' },
  ];

  // Beans calendar
  const beansCalendar = [
    { month: 2, activity: 'Planting with maize', type: 'planting' as const, crop: 'Beans' },
    { month: 3, activity: 'Growing', type: 'growing' as const, crop: 'Beans' },
    { month: 4, activity: 'Flowering', type: 'growing' as const, crop: 'Beans' },
    { month: 5, activity: 'Harvest', type: 'harvesting' as const, crop: 'Beans' },
    { month: 9, activity: 'Planting (short rains)', type: 'planting' as const, crop: 'Beans' },
    { month: 10, activity: 'Growing', type: 'growing' as const, crop: 'Beans' },
    { month: 11, activity: 'Harvest', type: 'harvesting' as const, crop: 'Beans' },
  ];

  // Coffee calendar
  const coffeeCalendar = [
    { month: 2, activity: 'Flowering season', type: 'growing' as const, crop: 'Coffee' },
    { month: 3, activity: 'Berry development', type: 'growing' as const, crop: 'Coffee' },
    { month: 4, activity: 'Spray CBD', type: 'growing' as const, crop: 'Coffee' },
    { month: 8, activity: 'Main harvest starts', type: 'harvesting' as const, crop: 'Coffee' },
    { month: 9, activity: 'Peak harvest', type: 'harvesting' as const, crop: 'Coffee' },
    { month: 10, activity: 'Post-harvest pruning', type: 'fallow' as const, crop: 'Coffee' },
    { month: 11, activity: 'Pruning + fertilizing', type: 'fallow' as const, crop: 'Coffee' },
  ];

  // Tomato calendar
  const tomatoCalendar = [
    { month: 2, activity: 'Nursery preparation', type: 'fallow' as const, crop: 'Tomato' },
    { month: 3, activity: 'Transplanting', type: 'planting' as const, crop: 'Tomato' },
    { month: 4, activity: 'Staking + pruning', type: 'growing' as const, crop: 'Tomato' },
    { month: 5, activity: 'Flowering + fruiting', type: 'growing' as const, crop: 'Tomato' },
    { month: 6, activity: 'Harvest begins', type: 'harvesting' as const, crop: 'Tomato' },
    { month: 7, activity: 'Peak harvest', type: 'harvesting' as const, crop: 'Tomato' },
    { month: 8, activity: 'Final harvest', type: 'harvesting' as const, crop: 'Tomato' },
  ];

  const TYPE_STYLES = {
    planting: { icon: Sprout, color: 'bg-green-100 text-green-700 border-green-300' },
    growing: { icon: Sun, color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    harvesting: { icon: Calendar, color: 'bg-amber-100 text-amber-700 border-amber-300' },
    fallow: { icon: Wind, color: 'bg-gray-100 text-gray-500 border-gray-300' },
  };

  [...maizeCalendar, ...beansCalendar, ...coffeeCalendar, ...tomatoCalendar].forEach(e => {
    entries.push({
      month: MONTHS[e.month],
      monthNum: e.month,
      activity: e.activity,
      crop: e.crop,
      type: e.type,
      icon: TYPE_STYLES[e.type].icon,
      color: TYPE_STYLES[e.type].color,
    });
  });

  return entries.sort((a, b) => a.monthNum - b.monthNum);
}

export default function CalendarPage({ country }: { country: string }) {
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    setCalendar(generateCalendar(country));
    const [lat, lon] = getCountryCoordinates(country);
    DataAggregator.getWeather(lat, lon, 7).then(w => setWeather(w)).catch(() => {});
  }, [country]);

  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];
  const currentSeason = getCurrentSeason();
  const seasonName = IGAD.SEASONS[currentSeason as keyof typeof IGAD.SEASONS]?.name || currentSeason;

  // Group by month
  const byMonth = MONTHS.map((month, i) => ({
    month,
    monthNum: i,
    entries: calendar.filter(e => e.monthNum === i),
    isCurrent: i === currentMonth,
  }));

  const TYPE_STYLES: Record<string, string> = {
    planting: 'bg-green-100 text-green-700 border-green-300',
    growing: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    harvesting: 'bg-amber-100 text-amber-700 border-amber-300',
    fallow: 'bg-gray-100 text-gray-500 border-gray-300',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-kilimo-600" /> Crop Calendar
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Planting & harvesting guide · {countryInfo?.flag} {countryInfo?.name} · Season: {seasonName}
        </p>
      </motion.div>

      {/* Current month highlight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6 p-4 rounded-xl bg-gradient-to-r from-kilimo-600 to-kilimo-700 text-white"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-green-200" />
          <div className="flex-1">
            <p className="font-semibold text-lg">{MONTHS[currentMonth]} — Current Month</p>
            <p className="text-sm text-green-100">
              {byMonth[currentMonth].entries.length > 0
                ? byMonth[currentMonth].entries.map(e => `${e.crop}: ${e.activity}`).join(' · ')
                : 'No major activities this month'}
            </p>
          </div>
          {weather && (
            <div className="text-right">
              <p className="text-2xl font-bold">{Math.round(weather.current?.temperature || 0)}°C</p>
              <p className="text-xs text-green-200">{weather.current?.rainfall || 0}mm rain</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { type: 'planting', label: 'Planting', icon: Sprout },
          { type: 'growing', label: 'Growing', icon: Sun },
          { type: 'harvesting', label: 'Harvesting', icon: Calendar },
          { type: 'fallow', label: 'Preparation', icon: Wind },
        ].map(l => {
          const Icon = l.icon;
          return (
            <div key={l.type} className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs ${TYPE_STYLES[l.type]}`}>
              <Icon className="w-3 h-3" /> {l.label}
            </div>
          );
        })}
      </div>

      {/* 12-month calendar grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {byMonth.map((monthData, i) => (
          <motion.div
            key={monthData.month}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`p-4 rounded-xl border-2 ${monthData.isCurrent ? 'border-kilimo-500 bg-kilimo-50/30' : 'border-gray-100 bg-white'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-semibold ${monthData.isCurrent ? 'text-kilimo-700' : 'text-gray-900'}`}>
                {monthData.month}
              </h3>
              {monthData.isCurrent && <span className="text-xs px-2 py-0.5 rounded-full bg-kilimo-600 text-white">NOW</span>}
            </div>
            <div className="space-y-1.5">
              {monthData.entries.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No activities</p>
              ) : (
                monthData.entries.map((e, j) => (
                  <div key={j} className={`text-xs p-1.5 rounded border ${TYPE_STYLES[e.type]}`}>
                    <span className="font-medium">{e.crop}:</span> {e.activity}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Crop-specific calendars */}
      <div className="mt-8">
        <h3 className="font-semibold text-gray-900 mb-4">Crop-Specific Guide</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {['Maize', 'Beans', 'Coffee', 'Tomato'].map(crop => (
            <div key={crop} className="bg-white rounded-xl border p-4">
              <h4 className="font-medium text-gray-900 mb-2">{crop}</h4>
              <div className="space-y-1 text-sm">
                {calendar.filter(e => e.crop === crop).slice(0, 4).map((e, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-gray-400 w-8">{e.month}</span>
                    <span className="text-gray-600">{e.activity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
