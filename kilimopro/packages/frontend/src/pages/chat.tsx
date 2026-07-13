import { useEffect, useState, useRef } from 'react';
import { Send, Brain, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message { role: 'user' | 'assistant'; content: string; }

// Real AI responses using contextual agricultural knowledge
// In production this would call an LLM API (Groq, Z.AI, Gemini)
// For the hackathon demo, we generate intelligent responses based on keywords
function generateAIResponse(question: string): string {
  const q = question.toLowerCase();

  // Planting
  if (q.includes('plant') || q.includes('panda') || q.includes('when') || q.includes('season')) {
    if (q.includes('maize') || q.includes('mahindi')) {
      return `🌱 **Maize Planting Guide (IGAD Region)**

**Best planting time:**
• Long rains: Mid-March to mid-April (Kenya, Uganda, Ethiopia)
• Short rains: Mid-October to mid-November

**Steps:**
1. Prepare land 2-3 weeks before rains
2. Use certified hybrid seeds (H614, H6213, WH505)
3. Spacing: 75cm between rows, 30cm between plants
4. Plant 2-3 seeds per hole, thin to 1 after 2 weeks
5. Apply DAP/NPK at planting (2 bags/ha)

**Expected yield:** 4-6 tonnes/ha with good management

Would you like specific advice for your region?`;
    }
    if (q.includes('bean') || q.includes('maharage')) {
      return `🌱 **Beans Planting Guide**

**Best time:** At onset of rains (Mar-Apr or Oct-Nov)
**Spacing:** 50cm × 10cm (bush types), 60cm × 15cm (climbing)
**Seed rate:** 50-60 kg/ha
**Depth:** 3-5cm

**Tips:**
• Inoculate seeds with Rhizobium for nitrogen fixation
• Apply P fertilizer (TSP) at planting
• Intercrop with maize for food security

**Varieties:** Rosecoco, Wairimu, Nyota (drought-tolerant)`;
    }
    return `🌱 **General Planting Advice**

Plant at the onset of the rainy season for your IGAD country:
• Long rains: March-May
• Short rains: October-December

Use certified seeds, prepare land early, and apply basal fertilizer at planting. What crop are you planning to plant?`;
  }

  // Pest/disease
  if (q.includes('pest') || q.includes('worm') || q.includes('armyworm') || q.includes('disease') || q.includes('ugonjwa')) {
    return `🐛 **Pest & Disease Management**

**Fall Armyworm (Spodoptera frugiperda)** — #1 threat to maize:
• Scout fields every 3 days during vegetative stage
• Look for "window pane" damage on leaves
• Apply biopesticide (Bt) at first sign — early morning or late evening
• Push-pull technology: intercrop with desmodium, plant Napier as border

**Other common pests:**
• Stalk borer: Apply carbofuran in whorl
• Aphids: Spray with neem or imidacloprid
• Termites: Destroy mounds, apply chlorpyrifos

**Prevention:** Plant early, use resistant varieties, rotate crops.

What specific pest are you dealing with?`;
  }

  // Fertilizer
  if (q.includes('fertiliz') || q.includes('mbolea') || q.includes('npk') || q.includes('urea')) {
    return `🧪 **Fertilizer Application Guide**

**Maize:**
• Basal: NPK 23-23-0 or DAP (2 bags/ha) at planting
• Top-dress: CAN or Urea (1 bag/ha) at 4-6 weeks
• Side-dress: Urea (0.5 bag/ha) at silking if needed

**Beans:**
• TSP or SSP (1 bag/ha) at planting
• No nitrogen needed (they fix their own via Rhizobium)

**Tomatoes:**
• NPK at planting, then top-dress with CAN every 2 weeks
• Add calcium to prevent blossom end rot

**Best practice:** Conduct a soil test every 3 years for precise recommendations.

What crop do you need fertilizer advice for?`;
  }

  // Weather
  if (q.includes('weather') || q.includes('rain') || q.includes('hali') || q.includes('mvua')) {
    return `🌦️ **Weather & Climate**

Check the **Weather** page for real-time forecasts from Open-Meteo (free, no API key).

**IGAD seasonal outlook:**
• Long rains (Mar-May): Normal to above-normal expected for western IGAD
• Short rains (Oct-Dec): Below-normal for eastern regions
• Temperature: +1.5°C anomaly (climate change signal)

**Key alerts to watch:**
• Frost (temp < 2°C) — cover sensitive crops
• Dry spells (>5 days no rain) — irrigate young crops
• Heavy rain (>50mm/day) — clear drainage

Go to the Weather page for your country's 7-day forecast!`;
  }

  // Market
  if (q.includes('price') || q.includes('market') || q.includes('bei') || q.includes('soko')) {
    return `📊 **Market Intelligence**

Check the **Market** page for real-time FAOSTAT prices across 8 IGAD countries.

**Tips for better prices:**
• Sell at harvest peak when prices are lowest → store and sell later
• Use hermetic bags (PICS) for 3-6 months storage
• Form farmer groups to negotiate bulk prices
• Monitor prices weekly via KilimoPRO's SMS service

**SMS:** Text MAIZE to get current prices on your phone!

What crop's prices are you interested in?`;
  }

  // Irrigation
  if (q.includes('irrigat') || q.includes('water') || q.includes('umwagiliaji') || q.includes('maji')) {
    return `💧 **Irrigation Guide**

**Critical water periods:**
• Germination (0-7 days): Keep soil moist
• Vegetative (2-6 weeks): Moderate water
• Flowering/silking: Maximum water need
• Grain filling: Gradual reduction

**Water-saving techniques:**
• Drip irrigation: Saves 50-70% water vs flood
• Mulching: Reduces evaporation by 60%
• Rainwater harvesting: Collect in ponds/tanks
• Tie-ridging: Retain water in furrows

**Schedule:** Water early morning (6-9 AM) or late evening (5-7 PM) to minimize evaporation.`;
  }

  // Harvest
  if (q.includes('harvest') || q.includes('vuna') || q.includes('yield')) {
    return `🌾 **Harvesting Guide**

**When to harvest:**
• Maize: When kernels are hard and black layer forms (20-25% moisture)
• Beans: When pods are dry and brown (shake to hear rattle)
• Tomatoes: When color breaks (pink → red)
• Cassava: 8-18 months after planting

**Post-harvest:**
• Dry grains to 13% moisture before storage
• Use hermetic bags (PICS) to prevent weevils
• Store in cool, dry, well-ventilated place
• Check stored grain every 2 weeks

**Post-harvest losses:** 30-40% in East Africa — proper storage can reduce to 5%!`;
  }

  // Swahili detection
  if (q.includes('habari') || q.includes('asante') || q.includes('tafadhali') || q.includes('nina')) {
    return `Hujambo! 🌱

Niko hapa kukusaidia maswali yote ya kilimo:
• **Kupanda** — wakati na jinsi ya kupanda mazao
• **Wadudu** — udhibiti wa fall armyworm na wadudu wengine
• **Mbolea** — aina na kiasi cha mbolea
• **Hali ya hewa** — tabiri ya hewa
• **Soko** — bei ya mazao

Uliza swali lako kwa Kiswahili au Kiingereza!`;
  }

  // Default
  return `Hello! 🌱 I'm KilimoPRO, your AI agricultural advisor for 8 IGAD countries.

I can help you with:
• 🌱 **Planting** — timing, spacing, varieties for any crop
• 🐛 **Pest control** — fall armyworm, aphids, diseases
• 🧪 **Fertilizer** — NPK, urea, organic options
• 🌦️ **Weather** — forecasts and alerts
• 📊 **Market** — prices and selling strategies
• 💧 **Irrigation** — water-saving techniques
• 🌾 **Harvesting** — timing and post-harvest storage

What would you like to know? Ask in English or Swahili!`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('kilimopro_chat');
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('kilimopro_chat', JSON.stringify(messages.slice(-20)));
    }
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingText]);

  function clearChat() {
    setMessages([]);
    localStorage.removeItem('kilimopro_chat');
  }

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    // Call the real AI chat API
    let response: string;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, language: 'en' }),
      });
      const data = await res.json();
      response = data.response || data.error || 'Sorry, I could not respond.';
    } catch {
      response = 'Network error. Please try again.';
    }

    // Simulate streaming/typing effect for better UX
    setLoading(false);
    setTypingText('');

    let i = 0;
    const typingInterval = setInterval(() => {
      if (i <= response.length) {
        setTypingText(response.slice(0, i));
        i += Math.ceil(response.length / 50); // type ~50 chunks
      } else {
        clearInterval(typingInterval);
        setMessages(m => [...m, { role: 'assistant', content: response }]);
        setTypingText('');
      }
    }, 20);
  }

  const suggestions = [
    'When should I plant maize?',
    'How to control fall armyworm?',
    'Best fertilizer for tomatoes?',
    'Nitoni ya kupanda maharage?',
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" /> Ask KilimoPRO
          </h1>
          <p className="text-gray-500 text-sm">AI agricultural advisor · Swahili & English · 8 IGAD countries</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs px-3 py-1.5 rounded-lg border text-gray-500 hover:bg-gray-50"
          >
            Clear Chat
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border h-[500px] flex flex-col shadow-sm">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-12 h-12 mx-auto text-purple-300 mb-3" />
              </motion.div>
              <p className="font-medium text-gray-700 mb-1">Ask anything about farming</p>
              <p className="text-xs text-gray-400 mb-4">Get instant AI advice on planting, pests, fertilizer, weather & more</p>
              <div className="flex flex-col gap-2 max-w-sm mx-auto">
                {suggestions.map((q, i) => (
                  <motion.button
                    key={q}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => send(q)}
                    className="text-left text-sm p-3 rounded-xl border hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : ''}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-kilimo-600 text-white' : 'bg-gray-100 text-gray-900'
              }`}>
                {m.content}
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex gap-2">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {typingText && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap bg-gray-100 text-gray-900">
                {typingText}<span className="animate-pulse">▋</span>
              </div>
            </motion.div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="border-t p-3 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about planting, pests, fertilizer, weather..."
            className="flex-1 rounded-xl border px-4 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || loading}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white disabled:opacity-50 flex items-center gap-1"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
