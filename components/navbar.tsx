"use client"

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useUser } from '@auth0/nextjs-auth0/client'
import ProfileSheet from '@/components/ProfileSheet'

export function Navbar() {
  const { user, error, isLoading } = useUser()

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo/Title on the left */}
        <div className="flex-1">
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Gravel Atlas</h1>
          </Link>
        </div>

        {/* Right-aligned controls */}
        <div className="flex items-center gap-2">
          {user ? (
            <ProfileSheet />
          ) : (
            <Button variant="outline" asChild>
              <Link href="/api/auth/login">Login / Sign Up</Link>
            </Button>
          )}
          
          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-4">
                {!user && (
                  <div className="mt-2">
                    <Button variant="outline" asChild>
                      <Link href="/api/auth/login">Sign in / Sign up</Link>
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}