import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useState } from 'react';
import { LanguageProvider } from '@/lib/i18n';
import { Layout } from '@/components/layout';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [country, setCountry] = useState('KE');

  return (
    <>
      <Head>
        <title>KilimoPRO 2.0 — AI Agricultural Intelligence for East Africa</title>
        <meta name="description" content="Real-time climate data, market prices, and AI advisory for 8 IGAD countries. Free, no API keys." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1a6b4c" />
      </Head>
      <LanguageProvider>
        <Layout country={country} onCountryChange={setCountry}>
          <Component {...pageProps} country={country} />
        </Layout>
      </LanguageProvider>
    </>
  );
}
