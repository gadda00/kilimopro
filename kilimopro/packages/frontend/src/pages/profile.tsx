import { useState, useEffect } from 'react';
import { User, MapPin, Phone, Edit2, Plus, Save, Globe, Check, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { IGAD } from '@/lib/data/constants';

interface Farm {
  id: number;
  name: string;
  crop: string;
  area: string;
  soil: string;
}

interface ProfileData {
  name: string;
  phone: string;
  farms: Farm[];
}

const STORAGE_KEY = 'kilimopro_profile';

export default function ProfilePage({ country }: { country: string }) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<ProfileData>({ name: '', phone: '', farms: [] });
  const [saved, setSaved] = useState(false);
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [newFarm, setNewFarm] = useState<Farm>({ id: 0, name: '', crop: '', area: '', soil: '' });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setData(JSON.parse(saved)); } catch { /* ignore */ }
    } else {
      // Default for first-time users
      setData({ name: '', phone: '', farms: [] });
    }
  }, []);

  // Save to localStorage
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addFarm() {
    if (!newFarm.name || !newFarm.crop || !newFarm.area) return;
    const farm = { ...newFarm, id: Date.now() };
    setData({ ...data, farms: [...data.farms, farm] });
    setNewFarm({ id: 0, name: '', crop: '', area: '', soil: '' });
    setShowAddFarm(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, farms: [...data.farms, farm] }));
  }

  function removeFarm(id: number) {
    const updated = { ...data, farms: data.farms.filter(f => f.id !== id) };
    setData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];
  const hasData = data.name || data.phone || data.farms.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <div className="flex gap-2">
          {saved && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Saved</span>}
          <button
            onClick={() => editing ? save() : setEditing(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
          >
            {editing ? <><Save className="w-4 h-4" /> Save</> : <><Edit2 className="w-4 h-4" /> Edit</>}
          </button>
        </div>
      </div>

      {!hasData && !editing && (
        <div className="text-center py-12 bg-gray-50 rounded-xl mb-6">
          <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">No profile yet. Click Edit to set up your farm.</p>
          <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-xl bg-kilimo-600 text-white text-sm">Set Up Profile</button>
        </div>
      )}

      {/* Profile card */}
      {hasData || editing ? (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-kilimo-100 text-kilimo-700 grid place-items-center text-2xl font-bold">
              {(data.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={data.name}
                    onChange={e => setData({ ...data, name: e.target.value })}
                    placeholder="Your name"
                    className="text-lg font-bold border-b focus:outline-none w-full"
                  />
                  <input
                    value={data.phone}
                    onChange={e => setData({ ...data, phone: e.target.value })}
                    placeholder="Phone number (e.g., +254 712 345 678)"
                    className="text-sm text-gray-500 border-b focus:outline-none w-full"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-gray-900">{data.name || 'Unnamed Farmer'}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    {data.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {data.phone}</span>}
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {countryInfo?.flag} {countryInfo?.name}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Farms */}
      {hasData || editing ? (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">My Farms ({data.farms.length})</h3>
            <button
              onClick={() => setShowAddFarm(!showAddFarm)}
              className="flex items-center gap-1 text-sm text-kilimo-600 hover:underline"
            >
              <Plus className="w-4 h-4" /> Add Farm
            </button>
          </div>

          {showAddFarm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-4 p-4 rounded-xl bg-gray-50 space-y-2"
            >
              <input
                value={newFarm.name}
                onChange={e => setNewFarm({ ...newFarm, name: e.target.value })}
                placeholder="Farm name (e.g., Main Farm)"
                className="w-full px-3 py-2 rounded-lg border text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={newFarm.crop}
                  onChange={e => setNewFarm({ ...newFarm, crop: e.target.value })}
                  placeholder="Crop (e.g., Maize)"
                  className="px-3 py-2 rounded-lg border text-sm"
                />
                <input
                  value={newFarm.area}
                  onChange={e => setNewFarm({ ...newFarm, area: e.target.value })}
                  placeholder="Area (e.g., 2.5 ha)"
                  className="px-3 py-2 rounded-lg border text-sm"
                />
              </div>
              <input
                value={newFarm.soil}
                onChange={e => setNewFarm({ ...newFarm, soil: e.target.value })}
                placeholder="Soil type (e.g., Loam, Clay, Sandy)"
                className="w-full px-3 py-2 rounded-lg border text-sm"
              />
              <div className="flex gap-2">
                <button onClick={addFarm} className="px-4 py-2 rounded-lg bg-kilimo-600 text-white text-sm">Add</button>
                <button onClick={() => setShowAddFarm(false)} className="px-4 py-2 rounded-lg bg-gray-200 text-sm">Cancel</button>
              </div>
            </motion.div>
          )}

          <div className="space-y-3">
            {data.farms.map(farm => (
              <div key={farm.id} className="p-4 rounded-xl bg-gray-50 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{farm.name}</div>
                  <div className="text-sm text-gray-500">
                    🌱 {farm.crop} · 📐 {farm.area} · 🪨 {farm.soil || 'Unknown'}
                  </div>
                </div>
                <button
                  onClick={() => removeFarm(farm.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {data.farms.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">No farms added yet. Click "Add Farm" to get started.</p>
          )}
        </div>
      ) : null}

      {/* Settings (always show) */}
      <div className="bg-white rounded-xl border p-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Settings</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Language</span>
            <span className="font-medium">English / Swahili (toggle in navbar)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Country</span>
            <span className="font-medium">{countryInfo?.flag} {countryInfo?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Data Sources</span>
            <span className="font-medium">FAOSTAT · ICPAC · Open-Meteo · World Bank</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Disease Detection</span>
            <span className="font-medium text-kilimo-600">Free tier (1 scan/day)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">All other features</span>
            <span className="font-medium text-green-600">Free ✅</span>
          </div>
        </div>
      </div>
    </div>
  );
}
