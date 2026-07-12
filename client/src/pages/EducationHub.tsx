import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Video, Calendar, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "article" | "video" | "calendar" | "guide";
  language: "en" | "sw";
  duration?: string;
  image?: string;
}

const educationalContent: ContentItem[] = [
  {
    id: "1",
    title: "Drought-Resistant Farming Techniques",
    description: "Learn how to prepare your farm for drought seasons with water conservation methods.",
    category: "Best Practices",
    type: "article",
    language: "en",
    image: "🌾",
  },
  {
    id: "2",
    title: "Mbinu za Kupanda Mahindi",
    description: "Jifunze mbinu bora za kupanda mahindi kwa ajili ya mavuno mazuri.",
    category: "Best Practices",
    type: "guide",
    language: "sw",
    image: "🌽",
  },
  {
    id: "3",
    title: "Seasonal Planting Calendar - East Africa",
    description: "Complete guide to what to plant and when across different seasons.",
    category: "Seasonal Calendar",
    type: "calendar",
    language: "en",
    image: "📅",
  },
  {
    id: "4",
    title: "Kalenda ya Kupanda - Afrika Mashariki",
    description: "Mwongozo kamili wa kile cha kupanda na wakati.",
    category: "Seasonal Calendar",
    type: "calendar",
    language: "sw",
    image: "📅",
  },
  {
    id: "5",
    title: "Integrated Pest Management (IPM)",
    description: "Video tutorial on using IPM techniques to reduce pesticide use.",
    category: "Pest Management",
    type: "video",
    language: "en",
    duration: "12 min",
    image: "🐛",
  },
  {
    id: "6",
    title: "Usimamizi wa Wadudu",
    description: "Video kuhusu jinsi ya kutumia mbinu za IPM.",
    category: "Pest Management",
    type: "video",
    language: "sw",
    duration: "12 min",
    image: "🐛",
  },
  {
    id: "7",
    title: "Soil Health and Fertility",
    description: "Comprehensive guide to maintaining and improving soil quality.",
    category: "Soil Management",
    type: "article",
    language: "en",
    image: "🌱",
  },
  {
    id: "8",
    title: "Afya ya Udongo",
    description: "Mwongozo wa kuendelea na kuboresha ubora wa udongo.",
    category: "Soil Management",
    type: "article",
    language: "sw",
    image: "🌱",
  },
];

const categories = [
  "All",
  "Best Practices",
  "Seasonal Calendar",
  "Pest Management",
  "Soil Management",
  "Water Management",
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "article":
      return <FileText className="w-5 h-5" />;
    case "video":
      return <Video className="w-5 h-5" />;
    case "calendar":
      return <Calendar className="w-5 h-5" />;
    case "guide":
      return <BookOpen className="w-5 h-5" />;
    default:
      return <FileText className="w-5 h-5" />;
  }
};

export default function EducationHub() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredContent = educationalContent.filter((item) => {
    const matchesLanguage = item.language === language;
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesLanguage && matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("education.title")}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {language === "sw"
              ? "Jifunze kuhusu mbinu bora za kilimo, kalenda ya msimu, na rasilimali nyingine"
              : "Learn farming best practices, seasonal calendars, and more resources"}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder={language === "sw" ? "Tafuta..." : "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                className="text-sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        {filteredContent.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="h-32 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 flex items-center justify-center text-5xl">
                  {item.image}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {item.title}
                    </h3>
                    <div className="text-green-600 dark:text-green-400">
                      {getTypeIcon(item.type)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                      {item.category}
                    </span>
                    {item.duration && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {item.duration}
                      </span>
                    )}
                  </div>
                  <Button className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white text-sm">
                    {language === "sw" ? "Soma" : "Read"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {language === "sw" ? "Hakuna matokeo" : "No results found"}
            </p>
          </div>
        )}

        {/* Featured Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {language === "sw" ? "Iliyochaguliwa" : "Featured"}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🌾</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    {language === "sw"
                      ? "Mwongozo wa Kupanda Kwa Msimu"
                      : "Seasonal Planting Guide"}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    {language === "sw"
                      ? "Jifunze ni nini cha kupanda na wakati maalum kwa ajili ya mavuno mazuri."
                      : "Learn what to plant and when for optimal harvests."}
                  </p>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    {language === "sw" ? "Anza" : "Start Learning"}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🐛</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    {language === "sw"
                      ? "Usimamizi wa Wadudu"
                      : "Pest Management Tips"}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    {language === "sw"
                      ? "Mbinu za kuepuka na kudhibiti wadudu bila dawa nyingi."
                      : "Effective ways to prevent and control pests naturally."}
                  </p>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    {language === "sw" ? "Anza" : "Start Learning"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
