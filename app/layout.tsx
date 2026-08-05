import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Geist } from 'next/font/google'
import Script from 'next/script'
import GaPageViewTracker from './GaPageViewTracker'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })
const GA_MEASUREMENT_ID = 'G-40C4SN8BCX'

export const metadata: Metadata = {
  title: 'United Gamblers Daily Bonus Tracker',
  description: 'Track all your sweepstakes casino daily bonuses in one place.',
  applicationName: 'United Gamblers Daily Bonus Tracker',
  verification: {
    google: 'smCsTYIUvk2BRGEaBRrelQHbcAja0_CYmYiK5vRdtf8',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
          `}
        </Script>
        <Suspense fallback={null}>
          <GaPageViewTracker measurementId={GA_MEASUREMENT_ID} />
        </Suspense>
        {children}
      </body>
    </html>
  )
}
