import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, MapPin, Calendar } from "lucide-react";

interface PriceData {
  date: string;
  price: number;
}

interface Market {
  name: string;
  location: string;
  distance: string;
  maize: number;
  beans: number;
  wheat: number;
}

const priceHistory: Record<string, PriceData[]> = {
  maize: [
    { date: "Mon", price: 45 },
    { date: "Tue", price: 46 },
    { date: "Wed", price: 44 },
    { date: "Thu", price: 47 },
    { date: "Fri", price: 49 },
    { date: "Sat", price: 48 },
    { date: "Sun", price: 50 },
  ],
  beans: [
    { date: "Mon", price: 120 },
    { date: "Tue", price: 118 },
    { date: "Wed", price: 122 },
    { date: "Thu", price: 125 },
    { date: "Fri", price: 128 },
    { date: "Sat", price: 130 },
    { date: "Sun", price: 132 },
  ],
  wheat: [
    { date: "Mon", price: 55 },
    { date: "Tue", price: 56 },
    { date: "Wed", price: 54 },
    { date: "Thu", price: 57 },
    { date: "Fri", price: 59 },
    { date: "Sat", price: 58 },
    { date: "Sun", price: 60 },
  ],
};

const markets: Market[] = [
  {
    name: "Nairobi Central Market",
    location: "Nairobi, Kenya",
    distance: "15 km",
    maize: 50,
    beans: 135,
    wheat: 62,
  },
  {
    name: "Kisumu Market",
    location: "Kisumu, Kenya",
    distance: "45 km",
    maize: 48,
    beans: 130,
    wheat: 60,
  },
  {
    name: "Nakuru Market",
    location: "Nakuru, Kenya",
    distance: "35 km",
    maize: 49,
    beans: 132,
    wheat: 61,
  },
];

export default function MarketIntelligence() {
  const { t, language } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState<"maize" | "beans" | "wheat">(
    "maize"
  );

  const cropNames: Record<string, Record<string, string>> = {
    maize: { en: "Maize", sw: "Mahindi" },
    beans: { en: "Beans", sw: "Maharagwe" },
    wheat: { en: "Wheat", sw: "Ngano" },
  };

  const currentPrice = priceHistory[selectedCrop][priceHistory[selectedCrop].length - 1].price;
  const previousPrice = priceHistory[selectedCrop][priceHistory[selectedCrop].length - 2].price;
  const priceChange = currentPrice - previousPrice;
  const percentChange = ((priceChange / previousPrice) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("market.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === "sw"
              ? "Bei za soko za sasa, mwelekeo, na mahali pa karibu"
              : "Real-time prices, trends, and nearest markets"}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Price Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {["maize", "beans", "wheat"].map((crop) => {
            const prices = priceHistory[crop as keyof typeof priceHistory];
            const current = prices[prices.length - 1].price;
            const previous = prices[prices.length - 2].price;
            const change = current - previous;
            const isUp = change >= 0;

            return (
              <Card
                key={crop}
                className={`p-6 cursor-pointer transition-all ${
                  selectedCrop === crop
                    ? "ring-2 ring-green-600 bg-green-50 dark:bg-green-900/20"
                    : "hover:shadow-lg"
                }`}
                onClick={() => setSelectedCrop(crop as any)}
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {cropNames[crop][language]}
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {current}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      per unit
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      isUp ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isUp ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="text-sm font-semibold">
                      {isUp ? "+" : ""}{change.toFixed(1)} ({percentChange}%)
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Price Chart */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {language === "sw" ? "Mwelekeo wa Bei" : "Price Trend"} -{" "}
            {cropNames[selectedCrop][language]}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceHistory[selectedCrop]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ fill: "#16a34a", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Markets */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {language === "sw" ? "Soko za Karibu" : "Nearby Markets"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.map((market, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {market.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <MapPin className="w-4 h-4" />
                  {market.location}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Maize
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {market.maize}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Beans
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {market.beans}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Wheat
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {market.wheat}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {language === "sw" ? "Umbali:" : "Distance:"} {market.distance}
                  </p>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm">
                    {language === "sw" ? "Nenda" : "Directions"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Market Comparison */}
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {language === "sw" ? "Kulinganisha Bei" : "Price Comparison"}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={markets.map((m) => ({
                name: m.name.split(" ")[0],
                Maize: m.maize,
                Beans: m.beans,
                Wheat: m.wheat,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Maize" fill="#16a34a" />
              <Bar dataKey="Beans" fill="#ea580c" />
              <Bar dataKey="Wheat" fill="#d97706" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
