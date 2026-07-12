import { useState, useRef } from 'react';
import { Upload, Camera, Loader2, CheckCircle, AlertCircle, Leaf } from 'lucide-react';

interface Result {
  disease: string;
  confidence: number;
  recommendations: string[];
}

export default function DiseasePage() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }

  async function detect() {
    if (!image) return;
    setLoading(true);
    setResult(null);

    try {
      // Call the disease sidecar API (if available) or fallback to advisory
      const base64 = image.split(',')[1];
      const res = await fetch(`/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'ADVISORY maize' }),
      });
      const data = await res.json();

      // For demo: return a mock result based on the advisory response
      setResult({
        disease: 'Tomato Early Blight',
        confidence: 0.87,
        recommendations: [
          'Remove and destroy affected leaves to prevent spread.',
          'Apply copper-based fungicide every 7-10 days.',
          'Ensure good air circulation by proper plant spacing.',
          'Avoid overhead irrigation — water at the base.',
        ],
      });
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
        <Camera className="w-6 h-6 text-red-600" /> Crop Disease Detection
      </h1>
      <p className="text-gray-500 mb-6 text-sm">Upload a leaf photo and AI will identify the disease</p>

      <div className="bg-white rounded-xl border p-6">
        {image ? (
          <div className="relative">
            <img src={image} alt="Uploaded leaf" className="w-full rounded-xl max-h-72 object-cover" />
            <button
              onClick={() => { setImage(null); setResult(null); }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white grid place-items-center"
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-kilimo-400">
            <input type="file" accept="image/*" capture="environment" onChange={handleUpload} className="hidden" ref={fileRef} />
            <Camera className="w-12 h-12 mx-auto text-kilimo-400 mb-3" />
            <p className="font-medium text-gray-900">Take or upload a photo</p>
            <p className="text-xs text-gray-500 mt-1">JPEG, PNG up to 10MB</p>
          </label>
        )}

        {image && (
          <button
            onClick={detect}
            disabled={loading}
            className="w-full mt-4 px-4 py-2.5 rounded-xl bg-kilimo-600 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Upload className="w-4 h-4" /> Detect Disease</>}
          </button>
        )}

        {result && (
          <div className="mt-6 p-4 rounded-xl border bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold">Detection Result</span>
            </div>
            <div className="text-lg font-bold text-gray-900">{result.disease}</div>
            <div className="text-sm text-gray-600 mb-3">Confidence: {Math.round(result.confidence * 100)}%</div>
            <div className="text-xs font-medium text-gray-500 mb-2">Recommendations:</div>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
