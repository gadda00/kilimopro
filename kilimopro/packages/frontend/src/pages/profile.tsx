import { useState } from 'react';
import { User, MapPin, Phone, Edit2, Plus, Save, Globe } from 'lucide-react';
import { IGAD } from '@/lib/data/constants';

export default function ProfilePage({ country }: { country: string }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('John Mwangi');
  const [phone, setPhone] = useState('+254 712 345 678');
  const [farms, setFarms] = useState([
    { id: 1, name: 'Main Farm', crop: 'Maize', area: '2.5 ha', soil: 'Loam' },
  ]);

  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
        >
          {editing ? <><Save className="w-4 h-4" /> Save</> : <><Edit2 className="w-4 h-4" /> Edit</>}
        </button>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-kilimo-100 text-kilimo-700 grid place-items-center text-2xl font-bold">
            {name.charAt(0)}
          </div>
          <div className="flex-1">
            {editing ? (
              <input value={name} onChange={e => setName(e.target.value)} className="text-lg font-bold border-b focus:outline-none w-full" />
            ) : (
              <h2 className="text-lg font-bold text-gray-900">{name}</h2>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {phone}</span>
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {countryInfo?.flag} {countryInfo?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Farms */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">My Farms</h3>
          <button className="flex items-center gap-1 text-sm text-kilimo-600 hover:underline">
            <Plus className="w-4 h-4" /> Add Farm
          </button>
        </div>

        <div className="space-y-3">
          {farms.map(farm => (
            <div key={farm.id} className="p-4 rounded-xl bg-gray-50 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{farm.name}</div>
                <div className="text-sm text-gray-500">
                  🌱 {farm.crop} · 📐 {farm.area} · 🪨 {farm.soil}
                </div>
              </div>
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl border p-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Settings</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Language</span>
            <span className="font-medium">English / Swahili</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">SMS Notifications</span>
            <span className="font-medium text-green-600">Enabled</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Data Sources</span>
            <span className="font-medium">FAOSTAT · ICPAC · Open-Meteo</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Subscription</span>
            <span className="font-medium text-kilimo-600">Free Tier</span>
          </div>
        </div>
      </div>
    </div>
  );
}
