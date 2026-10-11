import { RootProvider } from 'fumadocs-ui/provider/next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Inter, Geist_Mono } from 'next/font/google'
import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { jsonLd } from '@/lib/json-ld'
import { GlobalLayoutWrapper } from '@/components/layout/global-layout-wrapper'
import { cn } from '@/registry/lib/utils'
import { siteConfig } from '@/config/space-config'
import { cookies } from 'next/headers'
import { Mode, type LayoutMode } from '@/components/providers/layout-mode-provider'
import { ThemeCookieSync, THEME_COOKIE_KEY } from '@/components/providers/theme-cookie-sync'
import { ThemeLockScript, THEME_LOCKED_ROUTES } from '@/components/providers/theme-lock-provider'
import { PostHogProvider } from '@/components/providers/posthog-provider'
import { UmamiScript } from '@/components/providers/umami-script'
import { PageTreesProvider } from '@/components/providers/page-trees-provider'
import { librarySource, resourcesSource, source } from '@/lib/source'
import NextTopLoader from 'nextjs-toploader'

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    template: `%s - ${siteConfig.appName}`,
    default: siteConfig.title,
  },
  description: siteConfig.description,
  keywords: [
    'Space UI',
    'open-source design library',
    'Open-source components',
    'React',
    'Next.js',
    'Tailwind CSS',
    'Base UI',
    'Motion',
    'shadcn registry',
    'AI UI kit',
    'UI library',
    'UI components',
  ],
  icons: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      url: '/favicon.svg',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      url: '/apple-touch-icon.png',
    },
  ],
  authors: [
    {
      name: siteConfig.appName,
      url: siteConfig.url,
    },
  ],
  publisher: siteConfig.appName,
  manifest: '/manifest.json',
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.ogDescription,
    url: siteConfig.url,
    siteName: siteConfig.appName,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.twitterHandle,
    title: siteConfig.title,
    description: siteConfig.ogDescription,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
}

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export default async function Layout({ children }: { children: ReactNode }) {
  let initialLayoutMode: LayoutMode = Mode.standard
  let initialTheme: 'light' | 'dark' | null = null
  try {
    const cookieStore = await cookies()
    initialLayoutMode = (cookieStore.get('space-ui-layout-mode')?.value as LayoutMode) || Mode.standard
    const themeCookie = cookieStore.get(THEME_COOKIE_KEY)?.value
    initialTheme = themeCookie === 'dark' || themeCookie === 'light' ? themeCookie : null
  } catch {
    // Fallback to standard during static prerendering or when cookies() rejects
  }

  return (
    <html
      lang="en"
      className={cn(inter.variable, geistMono.variable, inter.className, initialTheme)}
      data-layout-mode={initialLayoutMode}
      style={initialTheme ? { colorScheme: initialTheme } : undefined}
      suppressHydrationWarning
    >
      <head>
        <script
          id="layout-mode-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:space-ui-layout-mode|space-ui-layout-mode)=([^;]+)/);var mode=m?m[1]:(localStorage.getItem('space-ui-layout-mode')||localStorage.getItem('space-ui-layout-mode')||'standard');document.documentElement.setAttribute('data-layout-mode',mode);}catch(e){}})();`,
          }}
        />
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var routes=${JSON.stringify(THEME_LOCKED_ROUTES)};var p=window.location.pathname.replace(/\\/+$/,'');var locked=null;for(var r in routes){if(p===r||p.indexOf(r+'/')===0){locked=routes[r];break;}}var t=locked||localStorage.getItem('theme');var isDark=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var root=document.documentElement;if(isDark){root.classList.add('dark');root.classList.remove('light');root.style.colorScheme='dark';}else{root.classList.remove('dark');root.classList.add('light');root.style.colorScheme='light';}}catch(e){}requestAnimationFrame(function(){requestAnimationFrame(function(){document.documentElement.classList.add('theme-ready');});});})();`,
          }}
        />
        <Script id="json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>

      <body
        className={cn(
          'flex flex-col min-h-screen',
          // Allows to make more attractive video recordings
          // 'screenshot-mode',
        )}
      >
        <NextTopLoader
          color="var(--primary)"
          initialPosition={0.08}
          crawlSpeed={200}
          height={2.5}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow={false}
          zIndex={99999}
        />
        <PostHogProvider>
          <RootProvider search={{ enabled: false }} theme={{ disableTransitionOnChange: true }}>
            <ThemeLockScript />
            <ThemeCookieSync />
            <NuqsAdapter>
              {/* Navigation trees built here on the server; client nav reads them from context. */}
              <PageTreesProvider
                trees={{
                  docs: source.pageTree,
                  library: librarySource.pageTree,
                  resources: resourcesSource.pageTree,
                }}
              >
                <GlobalLayoutWrapper initialLayoutMode={initialLayoutMode}>{children}</GlobalLayoutWrapper>
              </PageTreesProvider>
            </NuqsAdapter>
          </RootProvider>
        </PostHogProvider>
        <UmamiScript />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
