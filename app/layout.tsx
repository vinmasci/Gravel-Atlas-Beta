import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/navbar'
import { ThemeProvider } from "@/components/theme-provider"
import { UserProvider } from '@auth0/nextjs-auth0/client'
import { Toaster } from "@/components/ui/toaster"

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
      <body className={inter.className}>
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

<link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v6.4.0/css/all.css" />