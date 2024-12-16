"use client"

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Menu } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { useUser } from '@auth0/nextjs-auth0/client'
import ProfileSheet from '../components/ProfileSheet'

export function Navbar() {
  const { user, error, isLoading } = useUser()

  return (
    <header className="navbar fixed top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo/Title stays same */}
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
          
          {/* Mobile menu button using Dialog instead of Sheet */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Menu</DialogTitle>
              </DialogHeader>
              <nav className="flex flex-col gap-4 mt-4">
                {!user && (
                  <div className="mt-2">
                    <Button variant="outline" asChild>
                      <Link href="/api/auth/login">Sign in / Sign up</Link>
                    </Button>
                  </div>
                )}
              </nav>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  )
}