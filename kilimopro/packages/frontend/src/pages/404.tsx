import Link from 'next/link';
import { Home, CloudRain, Bug } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-kilimo-600 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-8">This page doesn't exist. But your crops still need you!</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="px-6 py-2.5 rounded-xl bg-kilimo-600 text-white font-medium flex items-center gap-2 justify-center">
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link href="/weather" className="px-6 py-2.5 rounded-xl border-2 border-gray-200 font-medium flex items-center gap-2 justify-center">
            <CloudRain className="w-4 h-4" /> Check Weather
          </Link>
          <Link href="/disease" className="px-6 py-2.5 rounded-xl border-2 border-gray-200 font-medium flex items-center gap-2 justify-center">
            <Bug className="w-4 h-4" /> Scan Crop
          </Link>
        </div>
      </div>
    </div>
  );
}
