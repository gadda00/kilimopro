/**
 * KilimoPRO 2.0 — Country Selector Component
 *
 * Dropdown for selecting an IGAD country. Updates the user's preferred country
 * and triggers a refetch of all country-specific data.
 *
 * Usage:
 *   import { CountrySelector } from '@/components/shared/country-selector';
 *   <CountrySelector value="KE" onChange={(cc) => setCountry(cc)} />
 */

import { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { IGAD } from '@/lib/data/constants';

interface CountrySelectorProps {
  value: string;
  onChange: (countryCode: string) => void;
  className?: string;
}

export function CountrySelector({ value, onChange, className }: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = IGAD.COUNTRIES[value.toUpperCase() as keyof typeof IGAD.COUNTRIES];

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:border-kilimo-400 transition-colors"
      >
        <Globe className="w-4 h-4 text-gray-500" />
        <span className="text-lg">{selected?.flag || '🌍'}</span>
        <span className="text-sm font-medium text-gray-900">
          {selected?.name || 'Select Country'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 max-h-80 overflow-y-auto">
            {Object.entries(IGAD.COUNTRIES).map(([code, country]) => (
              <button
                key={code}
                onClick={() => {
                  onChange(code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  value.toUpperCase() === code ? 'bg-kilimo-50 text-kilimo-700 font-medium' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{country.flag}</span>
                <span>{country.name}</span>
                <span className="ml-auto text-xs text-gray-400">{country.code}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
