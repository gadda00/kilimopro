/**
 * KilimoPRO 2.0 — Climate Map Component
 *
 * Interactive Leaflet map showing ICPAC hazard alerts across the 8 IGAD
 * countries. Each alert is shown as a colored marker at the affected country's
 * capital. Clicking a marker shows alert details + mitigation measures.
 *
 * Requires: npm install leaflet react-leaflet
 *   npm install -D @types/leaflet
 *
 * Usage:
 *   import { ClimateMap } from '@/components/shared/climate-map';
 *   <ClimateMap alerts={alerts} />
 */

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Droplet, Bug, Wind, CloudRain } from 'lucide-react';
import { IGAD } from '@/lib/data/constants';
import type { ICPACAlert } from '@/lib/data/icpac';

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SEVERITY_COLORS: Record<string, string> = {
  low: '#22c55e',       // green
  moderate: '#f59e0b',  // amber
  high: '#ef4444',      // red
  extreme: '#991b1b',   // dark red
};

const ALERT_TYPE_ICONS: Record<string, string> = {
  drought: '☀️',
  flood: '🌊',
  pest: '🐛',
  rainfall: '🌧️',
  extreme_rainfall: '⛈️',
  locust: '🦗',
};

interface ClimateMapProps {
  alerts: ICPACAlert[];
  height?: number;
}

export function ClimateMap({ alerts, height = 500 }: ClimateMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-gray-100 rounded-xl"
      >
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  // Create custom icons for each alert
  const createIcon = (severity: string, alertType: string) => {
    const color = SEVERITY_COLORS[severity] || '#666';
    const emoji = ALERT_TYPE_ICONS[alertType] || '⚠️';
    return L.divIcon({
      html: `<div style="background: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${emoji}</div>`,
      className: 'custom-alert-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Group alerts by country for map markers
  const alertsByCountry = new Map<string, ICPACAlert[]>();
  for (const alert of alerts) {
    for (const cc of alert.countries) {
      if (!alertsByCountry.has(cc)) alertsByCountry.set(cc, []);
      alertsByCountry.get(cc)!.push(alert);
    }
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height }}>
      <MapContainer
        center={[5, 35]}  // Center on IGAD region
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Alert markers */}
        {alerts.map((alert, i) => {
          // Place marker at the first affected country's capital
          const firstCountry = alert.countries[0];
          const coords = IGAD.COORDS[firstCountry as keyof typeof IGAD.COORDS];
          if (!coords) return null;

          return (
            <Marker
              key={`${alert.id}-${i}`}
              position={[coords[0], coords[1]]}
              icon={createIcon(alert.severity, alert.type)}
            >
              <Popup>
                <div style={{ minWidth: 250 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 4, color: SEVERITY_COLORS[alert.severity] }}>
                    {ALERT_TYPE_ICONS[alert.type]} {alert.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                    Severity: {alert.severity.toUpperCase()} | Source: {alert.source}
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 8 }}>
                    {alert.description}
                  </div>
                  {alert.advisory && (
                    <div style={{ fontSize: 13, marginBottom: 8, padding: 8, background: '#fef3c7', borderRadius: 4 }}>
                      💡 {alert.advisory}
                    </div>
                  )}
                  {alert.mitigationMeasures && alert.mitigationMeasures.length > 0 && (
                    <div style={{ fontSize: 12 }}>
                      <strong>Mitigation:</strong>
                      <ul style={{ paddingLeft: 16, margin: '4px 0' }}>
                        {alert.mitigationMeasures.slice(0, 3).map((m, j) => (
                          <li key={j}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
                    Countries: {alert.countries.join(', ')}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Severity circles for each affected country */}
        {Array.from(alertsByCountry.entries()).map(([cc, countryAlerts]) => {
          const coords = IGAD.COORDS[cc as keyof typeof IGAD.COORDS];
          if (!coords) return null;
          const maxSeverity = countryAlerts.reduce((max, a) => {
            const order = { low: 0, moderate: 1, high: 2, extreme: 3 };
            return (order[a.severity as keyof typeof order] || 0) > (order[max as keyof typeof order] || 0) ? a.severity : max;
          }, 'low');
          const color = SEVERITY_COLORS[maxSeverity] || '#666';
          const radius = 100000 + countryAlerts.length * 50000; // bigger circle = more alerts

          return (
            <Circle
              key={`circle-${cc}`}
              center={[coords[0], coords[1]]}
              radius={radius}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.1, weight: 2 }}
            />
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3 z-[1000]">
        <div className="text-xs font-semibold mb-2">Severity</div>
        {Object.entries(SEVERITY_COLORS).map(([level, color]) => (
          <div key={level} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-xs capitalize">{level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
