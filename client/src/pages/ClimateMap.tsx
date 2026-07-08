import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, MapPin } from "lucide-react";

interface LayerToggle {
  id: string;
  name: string;
  wmsUrl: string;
  layer: string;
  visible: boolean;
  color: string;
}

export default function ClimateMap() {
  const { t, language } = useLanguage();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapUrl, setMapUrl] = useState<string>("");
  const [layers, setLayers] = useState<LayerToggle[]>([
    {
      id: "drought",
      name: t("map.drought"),
      wmsUrl: "https://geoportal.icpac.net/geoserver/wms",
      layer: "geonode:Drought_Hazard_Index",
      visible: true,
      color: "#FF6B6B",
    },
    {
      id: "flood",
      name: t("map.flood"),
      wmsUrl: "https://geoportal.icpac.net/geoserver/wms",
      layer: "geonode:Burundi_flood_inundation",
      visible: false,
      color: "#4ECDC4",
    },
    {
      id: "aridity",
      name: t("map.aridity"),
      wmsUrl: "https://geoportal.icpac.net/geoserver/wms",
      layer: "geonode:Aridity_Index",
      visible: false,
      color: "#FFE66D",
    },
  ]);

  // Get user's geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Default to East Africa center
          setUserLocation({ lat: 0, lon: 35 });
        }
      );
    }
  }, []);

  // Build map URL with visible layers
  useEffect(() => {
    if (userLocation) {
      const visibleLayerNames = layers
        .filter((l) => l.visible)
        .map((l) => l.layer)
        .join(",");

      const params = new URLSearchParams({
        service: "WMS",
        version: "1.1.0",
        request: "GetMap",
        layers: visibleLayerNames || "geonode:Drought_Hazard_Index",
        styles: "",
        bbox: `${userLocation.lon - 5},${userLocation.lat - 5},${userLocation.lon + 5},${userLocation.lat + 5}`,
        width: "800",
        height: "600",
        srs: "EPSG:4326",
        format: "image/png",
        transparent: "true",
      });

      setMapUrl(`https://geoportal.icpac.net/geoserver/wms?${params.toString()}`);
    }
  }, [layers, userLocation]);

  const toggleLayer = (id: string) => {
    setLayers(
      layers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("map.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time climate and hazard monitoring across the IGAD region
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Layer Controls */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-20">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t("map.legend")}
              </h2>

              <div className="space-y-4">
                {layers.map((layer) => (
                  <div key={layer.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={layer.id}
                        checked={layer.visible}
                        onCheckedChange={() => toggleLayer(layer.id)}
                      />
                      <label
                        htmlFor={layer.id}
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                      >
                        {layer.name}
                      </label>
                      {layer.visible ? (
                        <Eye className="w-4 h-4 text-gray-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: layer.color }}
                      ></div>
                      <span className="text-xs text-gray-500">{layer.color}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Location Info */}
              {userLocation && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <p className="text-xs font-semibold text-green-900 dark:text-green-300">
                      Your Location
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Lat: {userLocation.lat.toFixed(4)}
                    <br />
                    Lon: {userLocation.lon.toFixed(4)}
                  </p>
                </div>
              )}

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Tip:</strong> Toggle layers to compare different climate hazards. Your location is marked on the map.
                </p>
              </div>
            </Card>
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              {mapUrl ? (
                <div className="relative w-full bg-gray-200 dark:bg-slate-700">
                  <img
                    src={mapUrl}
                    alt="Climate Map"
                    className="w-full h-auto"
                    style={{ minHeight: "600px" }}
                  />
                  <div className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-lg text-xs text-gray-600 dark:text-gray-300">
                    <p>Map powered by ICPAC</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-96 lg:h-[600px] flex items-center justify-center bg-gray-100 dark:bg-slate-800">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Map Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Drought Risk
                </h3>
                <p className="text-2xl font-bold text-red-600">High</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Affecting 5 districts
                </p>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Flood Risk
                </h3>
                <p className="text-2xl font-bold text-blue-600">Medium</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Expected in 3 days
                </p>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Rainfall
                </h3>
                <p className="text-2xl font-bold text-green-600">42mm</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Expected this week
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
