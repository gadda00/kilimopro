import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Droplet, Wind, Bug, Zap, MapPin, Clock } from "lucide-react";

interface Alert {
  id: string;
  type: "drought" | "flood" | "pest" | "rainfall" | "temperature";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  location: string;
  timestamp: Date;
  recommendation: string;
  affectedArea: string;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "drought",
    severity: "critical",
    title: "Severe Drought Warning",
    description: "Extended dry period expected for the next 3 weeks",
    location: "Kajiado County, Kenya",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    recommendation: "Increase irrigation frequency. Mulch soil to retain moisture.",
    affectedArea: "5,000 km²",
  },
  {
    id: "2",
    type: "flood",
    severity: "high",
    title: "Flash Flood Alert",
    description: "Heavy rainfall expected with potential flooding in low-lying areas",
    location: "Kisumu County, Kenya",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    recommendation: "Prepare drainage systems. Avoid planting in flood-prone areas.",
    affectedArea: "2,500 km²",
  },
  {
    id: "3",
    type: "pest",
    severity: "high",
    title: "Armyworm Outbreak",
    description: "Fall armyworm detected in maize fields across the region",
    location: "Rift Valley, Kenya",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    recommendation: "Scout fields regularly. Use approved pesticides. Implement IPM.",
    affectedArea: "8,000 km²",
  },
  {
    id: "4",
    type: "rainfall",
    severity: "medium",
    title: "Moderate Rainfall Expected",
    description: "40-60mm of rainfall expected this week",
    location: "Central Kenya",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    recommendation: "Good opportunity for planting. Ensure proper soil preparation.",
    affectedArea: "3,000 km²",
  },
  {
    id: "5",
    type: "temperature",
    severity: "medium",
    title: "Heat Wave Warning",
    description: "Temperatures expected to rise 3-5°C above normal",
    location: "Northern Kenya",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    recommendation: "Increase irrigation. Provide shade for livestock.",
    affectedArea: "12,000 km²",
  },
];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-800";
    case "high":
      return "bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-800";
    case "medium":
      return "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800";
    case "low":
      return "bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-800";
    default:
      return "bg-gray-100 dark:bg-gray-800";
  }
};

const getSeverityBadgeColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-600 text-white";
    case "high":
      return "bg-orange-600 text-white";
    case "medium":
      return "bg-yellow-600 text-white";
    case "low":
      return "bg-green-600 text-white";
    default:
      return "bg-gray-600 text-white";
  }
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case "drought":
      return <AlertTriangle className="w-6 h-6 text-red-600" />;
    case "flood":
      return <Droplet className="w-6 h-6 text-blue-600" />;
    case "pest":
      return <Bug className="w-6 h-6 text-purple-600" />;
    case "rainfall":
      return <Zap className="w-6 h-6 text-green-600" />;
    case "temperature":
      return <Wind className="w-6 h-6 text-orange-600" />;
    default:
      return <AlertTriangle className="w-6 h-6" />;
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

export default function AlertsFeed() {
  const { t, language } = useLanguage();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const filteredAlerts = filterType
    ? mockAlerts.filter((alert) => alert.type === filterType)
    : mockAlerts;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("alerts.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === "sw"
              ? "Onyo za haraka kuhusu tabia, wadudu, na hatari nyingine"
              : "Real-time alerts for weather, pests, and other hazards"}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-20">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {language === "sw" ? "Chuja" : "Filter"}
              </h3>
              <div className="space-y-2">
                <Button
                  onClick={() => setFilterType(null)}
                  variant={filterType === null ? "default" : "outline"}
                  className="w-full justify-start"
                >
                  {language === "sw" ? "Zote" : "All Alerts"}
                </Button>
                {["drought", "flood", "pest", "rainfall", "temperature"].map(
                  (type) => (
                    <Button
                      key={type}
                      onClick={() => setFilterType(type)}
                      variant={filterType === type ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      {type === "drought" && t("alerts.drought")}
                      {type === "flood" && t("alerts.flood")}
                      {type === "pest" && t("alerts.pest")}
                      {type === "rainfall" && t("alerts.rainfall")}
                      {type === "temperature" && "Temperature"}
                    </Button>
                  )
                )}
              </div>
            </Card>
          </div>

          {/* Alerts List */}
          <div className="lg:col-span-3 space-y-4">
            {filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`p-6 border-l-4 cursor-pointer hover:shadow-lg transition-shadow ${getSeverityColor(
                  alert.severity
                )}`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {alert.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityBadgeColor(
                            alert.severity
                          )}`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        {alert.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {alert.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(alert.timestamp)}
                        </div>
                        <div>{alert.affectedArea}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Alert Detail Modal */}
        {selectedAlert && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(selectedAlert.type)}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedAlert.title}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedAlert.location}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedAlert(null)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {language === "sw" ? "Maelezo" : "Description"}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedAlert.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === "sw" ? "Kiwango" : "Severity"}
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedAlert.severity.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === "sw" ? "Eneo Lililoathiriwa" : "Affected Area"}
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedAlert.affectedArea}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {t("disease.treatment")}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedAlert.recommendation}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700">
                      {language === "sw" ? "Hifadhi" : "Save Alert"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedAlert(null)}
                    >
                      {language === "sw" ? "Funga" : "Close"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
