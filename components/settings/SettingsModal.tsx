'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Users, 
  CreditCard,
  Settings,
  LogOut,
  Loader2,
  ChevronLeft,
  Moon,
  Sun,
  Monitor
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
// import { useTheme } from 'next-themes'
import toast from 'react-hot-toast'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
}

type SettingsSection = 
  | 'main'
  | 'account' 
  | 'notifications' 
  | 'security' 
  | 'appearance'
  | 'workspace'
  | 'billing'

export function SettingsModal({ open, onOpenChange, user }: SettingsModalProps) {
  const router = useRouter()
  // const { theme, setTheme } = useTheme()
  const [theme, setTheme] = useState('light')
  const [currentSection, setCurrentSection] = useState<SettingsSection>('account')
  const [isLoading, setIsLoading] = useState(false)
  
  // Account settings state
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  
  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState({
    pageComments: true,
    pageMentions: true,
    pageShared: true,
    weeklyDigest: false,
    productUpdates: true,
  })
  
  const [pushNotifications, setPushNotifications] = useState({
    pageComments: true,
    pageMentions: true,
    pageShared: false,
  })

  // Workspace settings state
  const [workspaceName, setWorkspaceName] = useState('My Workspace')
  const [workspaceUrl, setWorkspaceUrl] = useState('my-workspace')
  const [description, setDescription] = useState('')

  const handleUpdateProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      })
      
      if (response.ok) {
        toast.success('Profile updated successfully')
        router.refresh()
      } else {
        toast.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotifications = () => {
    // Save notification preferences
    toast.success('Notification preferences saved')
  }

  const handleUpdateWorkspace = async () => {
    setIsLoading(true)
    try {
      // Update workspace via API
      toast.success('Workspace updated successfully')
      router.refresh()
    } catch (error) {
      console.error('Error updating workspace:', error)
      toast.error('Failed to update workspace')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }
    
    setIsLoading(true)
    try {
      // Delete account via API
      toast.success('Account deleted successfully')
      signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    } finally {
      setIsLoading(false)
    }
  }

  const renderSidebar = () => (
    <div className="w-60 bg-gray-50 dark:bg-[#1a1a1a] h-full border-r dark:border-gray-800">
      <div className="p-4">
        <h2 className="text-sm font-semibold mb-1">{user?.name || 'User'}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
      </div>
      
      <div className="px-2">
        <div className="mb-2">
          <p className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">Account</p>
        </div>
        
        <button
          onClick={() => setCurrentSection('account')}
          className={cn(
            "w-full px-2 py-1.5 text-sm text-left rounded-md flex items-center gap-2 transition-colors",
            currentSection === 'account' 
              ? "bg-gray-200 dark:bg-gray-800" 
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          <User className="h-4 w-4" />
          My account
        </button>
        
        <button
          onClick={() => setCurrentSection('notifications')}
          className={cn(
            "w-full px-2 py-1.5 text-sm text-left rounded-md flex items-center gap-2 transition-colors",
            currentSection === 'notifications' 
              ? "bg-gray-200 dark:bg-gray-800" 
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          <Bell className="h-4 w-4" />
          My notifications
        </button>
        
        <button
          onClick={() => setCurrentSection('security')}
          className={cn(
            "w-full px-2 py-1.5 text-sm text-left rounded-md flex items-center gap-2 transition-colors",
            currentSection === 'security' 
              ? "bg-gray-200 dark:bg-gray-800" 
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          <Shield className="h-4 w-4" />
          Security
        </button>
        
        <button
          onClick={() => setCurrentSection('appearance')}
          className={cn(
            "w-full px-2 py-1.5 text-sm text-left rounded-md flex items-center gap-2 transition-colors",
            currentSection === 'appearance' 
              ? "bg-gray-200 dark:bg-gray-800" 
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          <Palette className="h-4 w-4" />
          Appearance
        </button>
        
        <div className="my-2" />
        
        <div className="mb-2">
          <p className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">Workspace</p>
        </div>
        
        <button
          onClick={() => setCurrentSection('workspace')}
          className={cn(
            "w-full px-2 py-1.5 text-sm text-left rounded-md flex items-center gap-2 transition-colors",
            currentSection === 'workspace' 
              ? "bg-gray-200 dark:bg-gray-800" 
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        
        <button
          onClick={() => setCurrentSection('billing')}
          className={cn(
            "w-full px-2 py-1.5 text-sm text-left rounded-md flex items-center gap-2 transition-colors",
            currentSection === 'billing' 
              ? "bg-gray-200 dark:bg-gray-800" 
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          <CreditCard className="h-4 w-4" />
          Billing
        </button>
        
        <button
          className={cn(
            "w-full px-2 py-1.5 text-sm text-left rounded-md flex items-center gap-2 transition-colors",
            "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          <Users className="h-4 w-4" />
          Members
        </button>
        
        <div className="my-3 mx-2 border-t dark:border-gray-800" />
        
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full px-2 py-1.5 text-sm text-left rounded-md flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600 dark:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  )

  const renderAccountSettings = () => (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">My account</h2>
      
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {name?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || 'U'}
          </div>
          <Button variant="outline" size="sm">
            Upload photo
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
        </div>
        
        <Button onClick={handleUpdateProfile} disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Update profile
        </Button>
        
        <Separator />
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
              Delete account
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Permanently delete your account and all data
            </p>
          </div>
          
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDeleteAccount}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete account
          </Button>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">My notifications</h2>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="text-sm font-medium">Email notifications</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Comments on your pages</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified when someone comments on your pages
                </p>
              </div>
              <Switch
                checked={emailNotifications.pageComments}
                onCheckedChange={(checked) => 
                  setEmailNotifications(prev => ({ ...prev, pageComments: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mentions</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified when someone mentions you
                </p>
              </div>
              <Switch
                checked={emailNotifications.pageMentions}
                onCheckedChange={(checked) => 
                  setEmailNotifications(prev => ({ ...prev, pageMentions: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Page shared with you</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified when someone shares a page with you
                </p>
              </div>
              <Switch
                checked={emailNotifications.pageShared}
                onCheckedChange={(checked) => 
                  setEmailNotifications(prev => ({ ...prev, pageShared: checked }))
                }
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <Label className="text-sm font-medium">Push notifications</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Comments on your pages</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get browser notifications for comments
                </p>
              </div>
              <Switch
                checked={pushNotifications.pageComments}
                onCheckedChange={(checked) => 
                  setPushNotifications(prev => ({ ...prev, pageComments: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mentions</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get browser notifications when mentioned
                </p>
              </div>
              <Switch
                checked={pushNotifications.pageMentions}
                onCheckedChange={(checked) => 
                  setPushNotifications(prev => ({ ...prev, pageMentions: checked }))
                }
              />
            </div>
          </div>
        </div>
        
        <Button onClick={handleSaveNotifications}>
          Save preferences
        </Button>
      </div>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Appearance</h2>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="text-sm font-medium">Theme</Label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose how Notion looks to you
          </p>
          
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                theme === 'light' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <Sun className="h-5 w-5 mx-auto mb-2" />
              <span className="text-xs">Light</span>
            </button>
            
            <button
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                theme === 'dark' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <Moon className="h-5 w-5 mx-auto mb-2" />
              <span className="text-xs">Dark</span>
            </button>
            
            <button
              onClick={() => setTheme('system')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                theme === 'system' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <Monitor className="h-5 w-5 mx-auto mb-2" />
              <span className="text-xs">System</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderWorkspaceSettings = () => (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Workspace settings</h2>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Enter workspace name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="workspace-url">Workspace URL</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">notion-clone.com/</span>
              <Input
                id="workspace-url"
                value={workspaceUrl}
                onChange={(e) => setWorkspaceUrl(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="workspace-url"
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's your workspace about?"
              rows={3}
            />
          </div>
        </div>
        
        <Button onClick={handleUpdateWorkspace} disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Update workspace
        </Button>
        
        <Separator />
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Export data</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Download all your workspace data
            </p>
          </div>
          
          <Button variant="outline" size="sm">
            Export all workspace data
          </Button>
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Security</h2>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Password</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Change your password
            </p>
          </div>
          
          <Button variant="outline" size="sm">
            Change password
          </Button>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Two-factor authentication</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          
          <Button variant="outline" size="sm">
            Enable 2FA
          </Button>
        </div>
      </div>
    </div>
  )

  const renderBillingSettings = () => (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Billing</h2>
      
      <div className="space-y-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Current plan</h3>
          <p className="text-2xl font-semibold">Free</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            For personal use
          </p>
        </div>
        
        <Button className="w-full">
          Upgrade to Pro
        </Button>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (currentSection) {
      case 'account':
        return renderAccountSettings()
      case 'notifications':
        return renderNotificationSettings()
      case 'appearance':
        return renderAppearanceSettings()
      case 'workspace':
        return renderWorkspaceSettings()
      case 'security':
        return renderSecuritySettings()
      case 'billing':
        return renderBillingSettings()
      default:
        return renderAccountSettings()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] p-0 gap-0 bg-white dark:bg-[#191919]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex h-full">
          {renderSidebar()}
          <div className="flex-1 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}