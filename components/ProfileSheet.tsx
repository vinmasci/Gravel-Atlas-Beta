import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useUser } from '@auth0/nextjs-auth0/client'
import { LogOut, Upload } from 'lucide-react'
import Link from 'next/link'
import { useToast } from "../app/hooks/use-toast"

export default function ProfileSheet() {
    const [open, setOpen] = React.useState(false)
    const { user, isLoading } = useUser()
    const { toast } = useToast()
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [profileData, setProfileData] = React.useState({
      bioName: '',
      website: '',
      picture: user?.picture || '',
      socialLinks: {
        instagram: '',
        strava: '',
        facebook: ''
      }
    })
    const [isSaving, setIsSaving] = React.useState(false)
    const [isUploading, setIsUploading] = React.useState(false)
  
    React.useEffect(() => {
      if (user?.sub) {
        fetch(`/api/user/${user.sub}`)
          .then(res => res.json())
          .then(data => {
            setProfileData({
              bioName: data.bioName || '',
              website: data.website || '',
              picture: data.picture || user?.picture || '',
              socialLinks: {
                instagram: data.socialLinks?.instagram || '',
                strava: data.socialLinks?.strava || '',
                facebook: data.socialLinks?.facebook || ''
              }
            })
          })
          .catch(err => {
            console.error('Error fetching user data:', err)
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to load profile data"
            })
          })
      }
    }, [user])
    

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })
      if (!res.ok) throw new Error('Failed to update profile')
      
      toast({
        title: "Success",
        description: "Profile updated successfully"
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an image file"
      })
      return
    }
  
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "File size must be less than 5MB"
      })
      return
    }
  
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/user/upload-image', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }
      
      const data = await res.json()
      console.log('Upload response:', data)
      
      // Update both user object and state with new image URL
      if (user && data.imageUrl) {
        user.picture = data.imageUrl
        
        setProfileData(prev => ({
          ...prev,
          picture: data.imageUrl
        }))
      }
      
      toast({
        title: "Success",
        description: "Profile picture updated"
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: typeof error === 'string' ? error : 'Failed to upload image'
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="rounded-full overflow-hidden hover:opacity-80 transition-opacity">
          <img 
            src={profileData.picture || user?.picture || '/placeholder.png'} 
            alt="Profile" 
            className="w-8 h-8 object-cover"
          />
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img 
  src={profileData.picture || user?.picture || '/placeholder.png'}
  alt="Profile" 
  className="w-24 h-24 rounded-full object-cover"
/>
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-6 h-6 text-white" />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageUpload(file)
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Change Picture'}
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4 flex-1">
            <div className="space-y-2">
              <Label htmlFor="bioName">Display Name</Label>
              <Input 
                id="bioName"
                value={profileData.bioName}
                onChange={e => setProfileData(prev => ({...prev, bioName: e.target.value}))}
                placeholder="Enter your display name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input 
                id="website"
                value={profileData.website}
                onChange={e => setProfileData(prev => ({...prev, website: e.target.value}))}
                placeholder="https://your-website.com"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input 
                id="instagram"
                value={profileData.socialLinks.instagram}
                onChange={e => setProfileData(prev => ({
                  ...prev, 
                  socialLinks: {...prev.socialLinks, instagram: e.target.value}
                }))}
                placeholder="Instagram profile URL"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strava">Strava</Label>
              <Input 
                id="strava"
                value={profileData.socialLinks.strava}
                onChange={e => setProfileData(prev => ({
                  ...prev, 
                  socialLinks: {...prev.socialLinks, strava: e.target.value}
                }))}
                placeholder="Strava profile URL"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input 
                id="facebook"
                value={profileData.socialLinks.facebook}
                onChange={e => setProfileData(prev => ({
                  ...prev, 
                  socialLinks: {...prev.socialLinks, facebook: e.target.value}
                }))}
                placeholder="Facebook profile URL"
                type="url"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>

          <div className="mt-auto pt-4 border-t">
            <Button 
              variant="destructive" 
              asChild 
              className="w-full"
            >
              <Link href="/api/auth/logout" className="flex items-center justify-center">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}