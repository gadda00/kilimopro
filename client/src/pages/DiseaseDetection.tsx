import React, { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, AlertCircle, CheckCircle, Loader2, Leaf } from "lucide-react";

interface DetectionResult {
  disease: string;
  confidence: number;
  treatment: string;
  symptoms: string[];
}

export default function DiseaseDetection() {
  const { t, language } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock result
      const mockResult: DetectionResult = {
        disease: language === "sw" ? "Mildew ya Maize" : "Maize Leaf Blight",
        confidence: 92,
        treatment:
          language === "sw"
            ? "Tumia fungicide iliyokubali. Ondoa majani yaliyoathiriwa. Hakikisha uingizaji wa hewa mzuri."
            : "Apply approved fungicide. Remove affected leaves. Ensure good air circulation.",
        symptoms: [
          language === "sw"
            ? "Madoa ya kijivu kwenye majani"
            : "Gray spots on leaves",
          language === "sw"
            ? "Majani yanayozaa kufa"
            : "Wilting leaves",
          language === "sw"
            ? "Kuenea kwa haraka"
            : "Rapid spread",
        ],
      };

      setResult(mockResult);
    } catch (error) {
      console.error("Error analyzing image:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("disease.title")}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {language === "sw"
              ? "Pakia picha ya jani lako ili kugundua ugonjwa na kupata pendekezo la matibabu."
              : "Upload a photo of your crop to detect diseases and get treatment recommendations."}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <div
                className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-12 text-center cursor-pointer hover:border-green-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {language === "sw" ? "Pakia Picha" : "Upload Photo"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {language === "sw"
                    ? "Bonyeza hapa au buruta picha ya jani lako"
                    : "Click here or drag a photo of your crop leaf"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Image Preview */}
              {selectedImage && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    {language === "sw" ? "Picha Iliyopakia" : "Uploaded Image"}
                  </p>
                  <img
                    src={selectedImage}
                    alt="Uploaded crop"
                    className="w-full h-64 object-cover rounded-lg"
                  />

                  {/* Analyze Button */}
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {language === "sw" ? "Inachanganua..." : "Analyzing..."}
                      </>
                    ) : (
                      t("disease.analyze")
                    )}
                  </Button>

                  {/* Clear Button */}
                  <Button
                    onClick={() => {
                      setSelectedImage(null);
                      setResult(null);
                    }}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    {language === "sw" ? "Futa" : "Clear"}
                  </Button>
                </div>
              )}
            </Card>

            {/* Info Card */}
            <Card className="p-4 mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm">
                    {language === "sw" ? "Kidokezo" : "Tip"}
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    {language === "sw"
                      ? "Kwa matokeo mazuri, pakia picha ya jani linalozaa kufa au lina madoa. Hakikisha mwanga mzuri na picha wazi."
                      : "For best results, upload a clear photo of the affected leaf in good lighting. Include multiple angles if possible."}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-1">
            {result ? (
              <Card className="p-6 sticky top-20">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t("disease.result")}
                  </h3>
                </div>

                {/* Disease Name */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === "sw" ? "Ugonjwa" : "Disease"}
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {result.disease}
                  </p>
                </div>

                {/* Confidence */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {t("disease.confidence")}
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${result.confidence}%` }}
                    ></div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {result.confidence}%
                  </p>
                </div>

                {/* Symptoms */}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {language === "sw" ? "Dalili" : "Symptoms"}
                  </p>
                  <ul className="space-y-1">
                    {result.symptoms.map((symptom, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                      >
                        <span className="text-green-600 mt-1">•</span>
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Treatment */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                    {t("disease.treatment")}
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {result.treatment}
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center sticky top-20">
                <Leaf className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {language === "sw"
                    ? "Pakia picha ili kuona matokeo"
                    : "Upload an image to see results"}
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Detections */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {language === "sw" ? "Ugonjwa Uliogunduliwa Karibuni" : "Recent Detections"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                disease: language === "sw" ? "Mildew" : "Powdery Mildew",
                date: "2 days ago",
                confidence: 88,
              },
              {
                disease: language === "sw" ? "Rust" : "Leaf Rust",
                date: "5 days ago",
                confidence: 95,
              },
              {
                disease: language === "sw" ? "Blight" : "Late Blight",
                date: "1 week ago",
                confidence: 91,
              },
            ].map((detection, idx) => (
              <Card key={idx} className="p-4">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {detection.disease}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {detection.date}
                </p>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-green-600 h-1.5 rounded-full"
                      style={{ width: `${detection.confidence}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {detection.confidence}% confidence
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
