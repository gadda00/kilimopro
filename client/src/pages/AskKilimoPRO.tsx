import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AskKilimoPRO() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Get user's location for context
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          setUserLocation({ lat: 0, lon: 35 });
        }
      );
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Simulate AI response - in production, this would call the LLM API
      const contextMessage = `User is asking about farming in ${language === "sw" ? "Swahili" : "English"}. Location: ${userLocation?.lat.toFixed(2)}, ${userLocation?.lon.toFixed(2)}`;
      
      // Simulate a delay for the AI response
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateAIResponse(input, language),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (userInput: string, lang: string): string => {
    const responses: Record<string, Record<string, string>> = {
      en: {
        default: "Based on your question and current climate data, here's my recommendation: Monitor your farm closely and consider implementing drought-resistant practices. Check the climate map for real-time hazard updates in your area.",
        weather: "Current weather patterns show a high-pressure system moving in. Expect temperatures to rise by 2-3°C over the next week. Ensure adequate irrigation for your crops.",
        pest: "For pest management, I recommend using integrated pest management (IPM) techniques. Scout your fields regularly and use organic pesticides when necessary.",
        market: "Market prices for maize are currently stable. Consider selling after the peak harvest season for better prices.",
      },
      sw: {
        default: "Kulingana na swali lako na data ya tabia sasa, hiki ndicho changu cha pendekezo: Kumbuka shambani lako kwa karibu na fikiria kutekeleza mbinu za kupinga ukame. Angalia ramani ya tabia kwa sasisho la hatari halisi katika eneo lako.",
        weather: "Mifumo ya tabia ya sasa inaonyesha mfumo wa shinikizo la juu unakuja. Tarajia joto kuongezeka kwa 2-3°C katika wiki ijayo. Hakikisha kuwa na maji ya kutosha kwa mazao yako.",
        pest: "Kwa usimamizi wa wadudu, ninapendekeza kutumia mbinu za usimamizi wa wadudu wa jumuishi (IPM). Chunguza shambani lako mara kwa mara na tumia dawa za wadudu za asili inapobidi.",
        market: "Bei za soko kwa mahindi ni sasa imara. Fikiria kuuza baada ya msimu wa kupukutia kwa bei nzuri.",
      },
    };

    const currentLang = lang === "sw" ? "sw" : "en";
    const responseSet = responses[currentLang];

    // Simple keyword matching for demo
    if (
      userInput.toLowerCase().includes("weather") ||
      userInput.toLowerCase().includes("tabia")
    ) {
      return responseSet.weather;
    } else if (
      userInput.toLowerCase().includes("pest") ||
      userInput.toLowerCase().includes("wadudu")
    ) {
      return responseSet.pest;
    } else if (
      userInput.toLowerCase().includes("market") ||
      userInput.toLowerCase().includes("soko")
    ) {
      return responseSet.market;
    }

    return responseSet.default;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("chat.title")}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Get personalized farming advice based on your location and climate data
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="h-[600px] flex flex-col">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {language === "sw"
                      ? "Karibu! Uliza swali kuhusu shambani lako, tabia, mazao, au soko."
                      : "Welcome! Ask me about your farm, weather, crops, or market prices."}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {language === "sw"
                      ? "Nitakupatia pendekezo maalum kulingana na mahali pa shambani lako."
                      : "I'll provide personalized recommendations based on your location."}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-green-600 text-white rounded-br-none"
                        : "bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === "user"
                          ? "text-green-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-slate-700 px-4 py-3 rounded-lg rounded-bl-none">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-600 dark:text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("chat.typing")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-slate-700 p-4">
            <div className="flex gap-2">
              <Input
                placeholder={t("chat.placeholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Suggestions */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {language === "sw" ? "Maswali ya Haraka" : "Quick Questions"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              {
                en: "What crops should I plant now?",
                sw: "Ni mazao gani ninafaa kupanda sasa?",
              },
              {
                en: "How can I prepare for drought?",
                sw: "Ninaweza kujiandaa vipi kwa ukame?",
              },
              {
                en: "What are current market prices?",
                sw: "Bei za soko za sasa ni nini?",
              },
              {
                en: "How do I detect crop diseases?",
                sw: "Ninaweza kugundua ugonjwa wa mazao vipi?",
              },
            ].map((suggestion, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="justify-start text-left h-auto py-2 px-3"
                onClick={() => {
                  setInput(language === "sw" ? suggestion.sw : suggestion.en);
                }}
              >
                <span className="text-sm">
                  {language === "sw" ? suggestion.sw : suggestion.en}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
