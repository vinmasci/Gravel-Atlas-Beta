import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Navbar } from '../components/navbar'
import { ThemeProvider } from "../components/theme-provider"
import { UserProvider } from '@auth0/nextjs-auth0/client'
import { Toaster } from "../components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gravel Atlas',
  description: 'Explore and map gravel roads across Australia',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link 
          rel="stylesheet" 
          href="https://kit.fontawesome.com/b02e210188.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        <Script 
          src="https://kit.fontawesome.com/b02e210188.js" 
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        <UserProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <Navbar />
            <main className="pt-16 h-screen">
              {children}
            </main>
            <Toaster />
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  )
}