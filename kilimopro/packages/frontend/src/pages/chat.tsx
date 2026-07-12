import { useEffect, useState, useRef } from 'react';
import { Send, Brain, Loader2 } from 'lucide-react';
import { DataAggregator } from '@/lib/data/aggregator';

interface Message { role: 'user' | 'assistant'; content: string; }

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Call the advisory API
      const res = await fetch(`/api/advisory?crop=maize&type=planting`);
      const data = await res.json();
      const items = data.advisory || [];
      const response = items.length > 0
        ? items.map((a: any) => `📋 ${a.title}\n${a.content}`).join('\n\n')
        : 'Samahani, siwezi kujibu swali hili kwa sasa. (Sorry, I cannot answer this question right now.)';

      setMessages(m => [...m, { role: 'assistant', content: response }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Hitilafu imetokea. Tafadhali jaribu tena.' }]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    'When should I plant maize?',
    'How to control fall armyworm?',
    'Best fertilizer for tomatoes?',
    'Nitoni ya kupanda maharage?',
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
        <Brain className="w-6 h-6 text-purple-600" /> Ask KilimoPRO
      </h1>
      <p className="text-gray-500 mb-6 text-sm">AI-powered agricultural advisory in Swahili & English</p>

      <div className="bg-white rounded-xl border h-[500px] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 mx-auto text-purple-300 mb-3" />
              <p className="font-medium text-gray-700 mb-1">Ask anything about farming</p>
              <div className="flex flex-col gap-2 max-w-sm mx-auto mt-4">
                {suggestions.map(q => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-left text-sm p-3 rounded-xl border hover:border-purple-300 hover:bg-purple-50/30"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : ''}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-kilimo-600 text-white' : 'bg-gray-100 text-gray-900'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              </div>
            </div>
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
            placeholder="Ask a question in Swahili or English..."
            className="flex-1 rounded-xl border px-4 py-2 text-sm focus:outline-none focus:border-kilimo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2 rounded-xl bg-kilimo-600 text-white disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
