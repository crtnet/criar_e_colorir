import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Criar e Colorir - App Seguro para Crianças',
  description: 'Sistema seguro de colorir digital para crianças - COPPA/GDPR compliant. Crie, colora e se divirta com total segurança!',
  keywords: ['colorir', 'crianças', 'seguro', 'COPPA', 'GDPR', 'educacional', 'arte', 'criativo'],
  authors: [{ name: 'Criar e Colorir Team' }],
  creator: 'Criar e Colorir',
  publisher: 'Criar e Colorir',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://criar-e-colorir.vercel.app',
    siteName: 'Criar e Colorir',
    title: 'Criar e Colorir - App Seguro para Crianças',
    description: 'Sistema seguro de colorir digital para crianças - COPPA/GDPR compliant',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Criar e Colorir - App Seguro para Crianças',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Criar e Colorir - App Seguro para Crianças',
    description: 'Sistema seguro de colorir digital para crianças - COPPA/GDPR compliant',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Criar e Colorir',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Criar e Colorir',
    'application-name': 'Criar e Colorir',
    'msapplication-TileColor': '#3742fa',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#3742fa',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3742fa',
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@300;400;700&display=swap"
          as="style"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Security headers */}
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), interest-cohort=()" />
        
        {/* PWA icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        
        {/* Prevent zoom on iOS */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div id="root">
          {children}
        </div>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
