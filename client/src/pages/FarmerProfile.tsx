import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, MapPin, Phone, Smartphone, Edit2, Plus, Save } from "lucide-react";

interface Farm {
  id: string;
  name: string;
  location: string;
  area: number;
  crop: string;
  soilType: string;
}

interface Profile {
  name: string;
  email: string;
  phone: string;
  language: "en" | "sw";
  smsAccessible: boolean;
  farms: Farm[];
}

export default function FarmerProfile() {
  const { t, language, setLanguage } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    name: "John Mwangi",
    email: "john@example.com",
    phone: "+254712345678",
    language: language as "en" | "sw",
    smsAccessible: true,
    farms: [
      {
        id: "1",
        name: "Main Farm",
        location: "Kajiado County, Kenya",
        area: 2.5,
        crop: "Maize",
        soilType: "Loamy",
      },
      {
        id: "2",
        name: "Secondary Farm",
        location: "Nairobi County, Kenya",
        area: 1.0,
        crop: "Beans",
        soilType: "Clay",
      },
    ],
  });

  const [editedProfile, setEditedProfile] = useState(profile);
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [newFarm, setNewFarm] = useState({
    name: "",
    location: "",
    area: "",
    crop: "",
    soilType: "",
  });

  const handleSaveProfile = () => {
    setProfile(editedProfile);
    setIsEditing(false);
  };

  const handleAddFarm = () => {
    if (newFarm.name && newFarm.location) {
      const farm: Farm = {
        id: Date.now().toString(),
        name: newFarm.name,
        location: newFarm.location,
        area: parseFloat(newFarm.area) || 0,
        crop: newFarm.crop,
        soilType: newFarm.soilType,
      };
      setProfile({
        ...profile,
        farms: [...profile.farms, farm],
      });
      setNewFarm({
        name: "",
        location: "",
        area: "",
        crop: "",
        soilType: "",
      });
      setShowAddFarm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("profile.title")}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {language === "sw"
              ? "Dhibiti profaili yako na maelezo ya shambani"
              : "Manage your profile and farm information"}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
              </div>
            </div>
            <Button
              onClick={() => {
                if (isEditing) {
                  handleSaveProfile();
                } else {
                  setEditedProfile(profile);
                  setIsEditing(true);
                }
              }}
              className={isEditing ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {language === "sw" ? "Hifadhi" : "Save"}
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  {language === "sw" ? "Hariri" : "Edit"}
                </>
              )}
            </Button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {language === "sw" ? "Jina" : "Name"}
                </label>
                <Input
                  value={editedProfile.name}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {language === "sw" ? "Barua Pepe" : "Email"}
                </label>
                <Input
                  type="email"
                  value={editedProfile.email}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("profile.phone")}
                </label>
                <Input
                  type="tel"
                  value={editedProfile.phone}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, phone: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sms"
                  checked={editedProfile.smsAccessible}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      smsAccessible: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="sms" className="text-sm text-gray-700 dark:text-gray-300">
                  {t("profile.sms")}
                </label>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t("profile.phone")}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {profile.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t("profile.sms")}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {profile.smsAccessible ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Language Settings */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("profile.language")}
          </h3>
          <div className="flex gap-2">
            <Button
              onClick={() => setLanguage("en")}
              variant={language === "en" ? "default" : "outline"}
              className="flex-1"
            >
              English
            </Button>
            <Button
              onClick={() => setLanguage("sw")}
              variant={language === "sw" ? "default" : "outline"}
              className="flex-1"
            >
              Swahili
            </Button>
          </div>
        </Card>

        {/* Farms */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("profile.farm")}
            </h3>
            <Button
              onClick={() => setShowAddFarm(!showAddFarm)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {language === "sw" ? "Ongeza Shambani" : "Add Farm"}
            </Button>
          </div>

          {/* Add Farm Form */}
          {showAddFarm && (
            <Card className="p-6 mb-6 bg-green-50 dark:bg-green-900/20">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                {language === "sw" ? "Shambani Jipya" : "New Farm"}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === "sw" ? "Jina la Shambani" : "Farm Name"}
                  </label>
                  <Input
                    placeholder="e.g., Main Farm"
                    value={newFarm.name}
                    onChange={(e) =>
                      setNewFarm({ ...newFarm, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("profile.location")}
                  </label>
                  <Input
                    placeholder="County, Country"
                    value={newFarm.location}
                    onChange={(e) =>
                      setNewFarm({ ...newFarm, location: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("profile.area")}
                    </label>
                    <Input
                      type="number"
                      placeholder="2.5"
                      value={newFarm.area}
                      onChange={(e) =>
                        setNewFarm({ ...newFarm, area: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("profile.crop")}
                    </label>
                    <Input
                      placeholder="Maize"
                      value={newFarm.crop}
                      onChange={(e) =>
                        setNewFarm({ ...newFarm, crop: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("profile.soil")}
                  </label>
                  <Input
                    placeholder="Loamy"
                    value={newFarm.soilType}
                    onChange={(e) =>
                      setNewFarm({ ...newFarm, soilType: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddFarm}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {language === "sw" ? "Ongeza" : "Add"}
                  </Button>
                  <Button
                    onClick={() => setShowAddFarm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    {language === "sw" ? "Ghairi" : "Cancel"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Farms List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.farms.map((farm) => (
              <Card key={farm.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {farm.name}
                  </h4>
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{t("profile.location")}:</span> {farm.location}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{t("profile.area")}:</span> {farm.area} ha
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{t("profile.crop")}:</span> {farm.crop}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{t("profile.soil")}:</span> {farm.soilType}
                  </p>
                </div>
                <Button variant="outline" className="w-full mt-3 text-sm">
                  {language === "sw" ? "Hariri" : "Edit"}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
