import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useState } from 'react';
import { LanguageProvider } from '@/lib/i18n';
import { Layout } from '@/components/layout';
import { ErrorBoundary } from '@/components/error-boundary';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [country, setCountry] = useState('KE');

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>KilimoPRO 2.0 — AI Agricultural Intelligence for East Africa</title>
        <meta name="title" content="KilimoPRO 2.0 — AI Agricultural Intelligence for East Africa" />
        <meta name="description" content="Free weather, climate alerts, market prices, crop disease detection, and AI advisory for 8 IGAD countries. Powered by FAOSTAT, ICPAC, Open-Meteo, and World Bank." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1a6b4c" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://frontend-sigma-two-3d6ily5dz2.vercel.app/" />
        <meta property="og:title" content="KilimoPRO 2.0 — AI Agricultural Intelligence for East Africa" />
        <meta property="og:description" content="Free weather, climate alerts, market prices, crop disease detection, and AI advisory for 8 IGAD countries." />
        <meta property="og:image" content="https://frontend-sigma-two-3d6ily5dz2.vercel.app/api/og" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="KilimoPRO 2.0 — AI Agricultural Intelligence for East Africa" />
        <meta property="twitter:description" content="Free weather, climate alerts, market prices, crop disease detection, and AI advisory for 8 IGAD countries." />

        {/* Favicon */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%231a6b4c'/><text y='.9em' font-size='80' x='50' text-anchor='middle' fill='white'>K</text></svg>" />

        {/* PWA Manifest */}
        <link rel="manifest" href="data:application/json,{&quot;name&quot;:&quot;KilimoPRO&quot;,&quot;short_name&quot;:&quot;KilimoPRO&quot;,&quot;start_url&quot;:&quot;/&quot;,&quot;display&quot;:&quot;standalone&quot;,&quot;background_color&quot;:&quot;#1a6b4c&quot;,&quot;theme_color&quot;:&quot;#1a6b4c&quot;}" />
      </Head>
      <LanguageProvider>
        <ErrorBoundary>
          <Layout country={country} onCountryChange={setCountry}>
            <Component {...pageProps} country={country} />
          </Layout>
        </ErrorBoundary>
      </LanguageProvider>
    </>
  );
}
