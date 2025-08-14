import LeftBar from '@/components/ui/LeftBar';
import Rightbar from '@/components/ui/RightBar';
import { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import 'styles/main.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { unstable_setRequestLocale } from 'next-intl/server';
import localFont from 'next/font/local';

const meta = {
  title: 'Next.js Subscription Starter',
  description: 'Brought to you by Vercel, Stripe, and Supabase.',
  cardImage: '/og.png',
  robots: 'follow, index',
  url: 'https://subscription-starter.vercel.app',
  type: 'website'
};

const APP_NAME = 'Violinova';
const APP_DEFAULT_TITLE = 'Violinova';
const APP_TITLE_TEMPLATE = 'Violinova';
const APP_DESCRIPTION = 'Violin learning app';

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE
  },
  description: APP_DESCRIPTION,
  manifest: '/manifest.json',
  themeColor: '#FFFFFF',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_DEFAULT_TITLE
  },
  formatDetection: {
    telephone: false
  }
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: any;
}

const locales = ['en', 'fr'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const avenir = localFont({
  src: '../../styles/fonts/AvenirNextRoundedStd-Med.woff2'
});

export default async function RootLayout({
  children,
  params: { locale }
}: RootLayoutProps) {
  const isValidLocale = locales.some((cur) => cur === locale);
  if (!isValidLocale) notFound();
  let messages;

  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
  unstable_setRequestLocale(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <html
        lang={locale}
        className={`h-screen w-screen box-border ${avenir.className}`}
      >
        <body className="h-full w-full flex flex-col-reverse md:flex-row gap-4 box-border">
          {/* <SupabaseProvider> */}
          {/* <LeftBar /> */}
          <main className="w-full h-full overflow-hidden">
            {children}
            <Analytics />
            <SpeedInsights />
          </main>
          {/* <Rightbar /> */}
          {/* </SupabaseProvider> */}
        </body>
      </html>
    </NextIntlClientProvider>
  );
}
