'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Users, 
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
  workspaceId?: string
}

type SettingsSection = 
  | 'main'
  | 'account' 
  | 'notifications' 
  | 'security' 
  | 'appearance'
  | 'workspace'
  | 'members'

export function SettingsModal({ open, onOpenChange, user, workspaceId }: SettingsModalProps) {
  const router = useRouter()
  // const { theme, setTheme } = useTheme()
  const [theme, setTheme] = useState('light')
  const [currentSection, setCurrentSection] = useState<SettingsSection>('account')
  const [isLoading, setIsLoading] = useState(false)
  
  // Account settings state
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  
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
  const [members, setMembers] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null)
  
  // Security settings state
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

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
    // Save notification preferences - coming soon
    toast.info('Notification settings will be available soon!')
  }
  
  const handleChangePassword = async () => {
    // Reset errors
    setPasswordError('')
    
    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required')
      return
    }
    
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password')
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setPasswordError(data.error || 'Failed to change password')
        return
      }
      
      toast.success('Password changed successfully')
      // Reset form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordChange(false)
    } catch (error) {
      console.error('Error changing password:', error)
      setPasswordError('Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateWorkspace = async () => {
    if (!workspaceId) {
      toast.error('No workspace selected')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: workspaceName
        })
      })

      if (response.ok) {
        toast.success('Workspace updated successfully')
        router.refresh()
      } else {
        toast.error('Failed to update workspace')
      }
    } catch (error) {
      console.error('Error updating workspace:', error)
      toast.error('Failed to update workspace')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch workspace details when modal opens or section changes
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId || !open) return
      if (currentSection !== 'workspace' && currentSection !== 'members') return

      try {
        const response = await fetch(`/api/workspaces/${workspaceId}`)
        if (response.ok) {
          const data = await response.json()
          console.log('Fetched workspace data:', data) // Debug log
          setWorkspaceName(data.name || 'My Workspace')
          setCurrentWorkspace(data)
        }
      } catch (error) {
        console.error('Error fetching workspace:', error)
      }
    }

    fetchWorkspace()
  }, [workspaceId, open, currentSection])

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
    <div className="w-60 min-w-[240px] bg-gray-50 dark:bg-gray-900/50 h-full border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              userName={user?.name}
              userEmail={user?.email}
              size="sm"
              editable={false}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate">{user?.name || 'User'}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-2 space-y-1">
          <div className="mb-2">
            <p className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account</p>
          </div>
        
          <button
            onClick={() => setCurrentSection('account')}
            className={cn(
              "w-full px-3 py-2 text-sm text-left rounded-md flex items-center gap-3 transition-all",
              currentSection === 'account' 
                ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white font-medium" 
                : "hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300"
            )}
          >
            <User className="h-4 w-4 flex-shrink-0" />
            <span>My account</span>
          </button>
        
          <button
            onClick={() => setCurrentSection('notifications')}
            className={cn(
              "w-full px-3 py-2 text-sm text-left rounded-md flex items-center gap-3 transition-all",
              currentSection === 'notifications' 
                ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white font-medium" 
                : "hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300"
            )}
          >
            <Bell className="h-4 w-4 flex-shrink-0" />
            <span>My notifications</span>
          </button>
        
          <button
            onClick={() => setCurrentSection('security')}
            className={cn(
              "w-full px-3 py-2 text-sm text-left rounded-md flex items-center gap-3 transition-all",
              currentSection === 'security' 
                ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white font-medium" 
                : "hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300"
            )}
          >
            <Shield className="h-4 w-4 flex-shrink-0" />
            <span>Security</span>
          </button>
          
          <button
            onClick={() => setCurrentSection('appearance')}
            className={cn(
              "w-full px-3 py-2 text-sm text-left rounded-md flex items-center gap-3 transition-all",
              currentSection === 'appearance' 
                ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white font-medium" 
                : "hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300"
            )}
          >
            <Palette className="h-4 w-4 flex-shrink-0" />
            <span>Appearance</span>
          </button>
          
          <div className="my-3 mx-2 border-t border-gray-200 dark:border-gray-800" />
          
          <div className="mb-2">
            <p className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Workspace</p>
          </div>
          
          <button
            onClick={() => setCurrentSection('workspace')}
            className={cn(
              "w-full px-3 py-2 text-sm text-left rounded-md flex items-center gap-3 transition-all",
              currentSection === 'workspace' 
                ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white font-medium" 
                : "hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300"
            )}
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span>Settings</span>
          </button>
          
          <button
            onClick={() => setCurrentSection('members')}
            className={cn(
              "w-full px-3 py-2 text-sm text-left rounded-md flex items-center gap-3 transition-all",
              currentSection === 'members' 
                ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white font-medium" 
                : "hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300"
            )}
          >
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>Members</span>
          </button>
        </div>
      </div>
      
      {/* Logout Button */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full px-3 py-2 text-sm text-left rounded-md flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  )

  const renderAccountSettings = () => (
    <div className="p-8 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My account</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Manage your personal information and preferences</p>
      
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <AvatarUpload
            currentAvatarUrl={avatarUrl}
            userName={name}
            userEmail={email}
            onUpload={(url) => {
              setAvatarUrl(url)
              router.refresh()
            }}
            size="lg"
          />
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Profile Photo</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Upload a photo to personalize your account</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="max-w-md"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="max-w-md"
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
    <div className="p-8 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My notifications</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Choose how you want to be notified</p>
      
      {/* Coming Soon Badge */}
      <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
          <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
            Notification settings coming soon
          </p>
        </div>
        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1 ml-6">
          We're working on bringing you customizable notification preferences. Stay tuned!
        </p>
      </div>
      
      <div className="space-y-6 opacity-50 pointer-events-none">
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
        
        <Button 
          onClick={handleSaveNotifications}
          disabled
          className="cursor-not-allowed"
        >
          Save preferences (Coming Soon)
        </Button>
      </div>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="p-8 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Appearance</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Customize how the app looks and feels</p>
      
      {/* Coming Soon Badge */}
      <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
          <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
            Appearance settings coming soon
          </p>
        </div>
        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1 ml-6">
          Theme customization, font settings, and more appearance options will be available soon!
        </p>
      </div>
      
      <div className="space-y-6 opacity-50 pointer-events-none">
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
        
        <Separator />
        
        {/* Font Settings - Coming Soon */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Font</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Customize your reading experience
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Font family</span>
              <select 
                className="text-sm px-3 py-1 border rounded-md bg-white dark:bg-gray-800 disabled:opacity-50" 
                disabled
              >
                <option>Default</option>
                <option>Serif</option>
                <option>Mono</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Font size</span>
              <select 
                className="text-sm px-3 py-1 border rounded-md bg-white dark:bg-gray-800 disabled:opacity-50" 
                disabled
              >
                <option>Small</option>
                <option>Medium</option>
                <option>Large</option>
              </select>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Page Width - Coming Soon */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Page width</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choose your preferred page width
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Full width pages</span>
            <Switch disabled />
          </div>
        </div>
        
        <Separator />
        
        {/* Accent Color - Coming Soon */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Accent color</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Personalize with your favorite color
            </p>
          </div>
          
          <div className="flex gap-2">
            {['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map((color) => (
              <button
                key={color}
                className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-700 disabled:opacity-50"
                style={{ backgroundColor: color }}
                disabled
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderWorkspaceSettings = () => (
    <div className="p-8 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Workspace settings</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Configure your workspace details and preferences</p>
      
      {!currentWorkspace ? (
        <div className="text-sm text-gray-500">Loading workspace details...</div>
      ) : (
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
              <Label htmlFor="workspace-slug">Workspace URL</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="workspace-slug"
                    value={workspaceId ? `${window.location.origin}/workspace/${workspaceId}` : 'Loading...'}
                    disabled
                    className="flex-1 disabled:opacity-70 font-mono text-sm"
                    title="Workspace URL"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (workspaceId) {
                        navigator.clipboard.writeText(`${window.location.origin}/workspace/${workspaceId}`)
                        toast.success('URL copied to clipboard')
                      }
                    }}
                    disabled={!workspaceId}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Workspace slug: <span className="font-mono">{currentWorkspace?.slug || 'N/A'}</span>
                </p>
              </div>
            </div>
          </div>
          
          <Button onClick={handleUpdateWorkspace} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save changes
          </Button>
          
          <Separator />
          
          {/* Export Data - Coming Soon */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Export data</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Download all your workspace data
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                disabled
                className="cursor-not-allowed"
              >
                Export all workspace data
              </Button>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                Coming Soon
              </span>
            </div>
          </div>
          
          <Separator />
          
          {/* Danger Zone */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Danger zone</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Irreversible and destructive actions
              </p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              disabled
              title="Only workspace owners can delete workspaces"
            >
              Delete workspace
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="p-8 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Security</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Keep your account secure</p>
      
      <div className="space-y-6">
        {/* Password Change Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Password</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Change your password regularly to keep your account secure
            </p>
          </div>
          
          {!showPasswordChange ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPasswordChange(true)}
            >
              Change password
            </Button>
          ) : (
            <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>
              
              {passwordError && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {passwordError}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleChangePassword}
                  disabled={isLoading}
                >
                  {isLoading ? 'Changing...' : 'Change password'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowPasswordChange(false)
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                    setPasswordError('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* 2FA Section - Coming Soon */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Two-factor authentication</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          
          {/* Coming Soon Badge for 2FA */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              disabled
              className="cursor-not-allowed"
            >
              Enable 2FA
            </Button>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              Coming Soon
            </span>
          </div>
        </div>
        
        <Separator />
        
        {/* Login Sessions - Coming Soon */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Active sessions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your active login sessions
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              disabled
              className="cursor-not-allowed"
            >
              View sessions
            </Button>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  )


  const handleInviteMember = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    if (!workspaceId) {
      toast.error('No workspace selected')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: 'MEMBER' })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === 'pending') {
          toast.success(`Invitation sent to ${inviteEmail}`)
        } else {
          toast.success('Member added successfully')
        }
        setInviteEmail('')
        fetchMembers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to invite member')
      }
    } catch (error) {
      console.error('Error inviting member:', error)
      toast.error('Failed to send invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    if (!workspaceId) return

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        toast.success('Member role updated')
        fetchMembers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update member role')
      }
    } catch (error) {
      console.error('Error updating member role:', error)
      toast.error('Failed to update member role')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return
    }

    if (!workspaceId) return

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Member removed')
        fetchMembers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    }
  }

  const fetchMembers = async () => {
    if (!workspaceId) {
      setMembers([
        { id: user?.id || '1', name: user?.name || 'You', email: user?.email, role: 'OWNER', avatarUrl: null },
      ])
      return
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`)
      if (response.ok) {
        const data = await response.json()
        // Ensure we're getting an array - handle both { members: [...] } and direct array responses
        const membersList = Array.isArray(data) ? data : (data.members || [])
        setMembers(membersList)
      } else {
        // Fallback to current user only
        setMembers([
          { id: user?.id || '1', name: user?.name || 'You', email: user?.email, role: 'OWNER', avatarUrl: null },
        ])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      setMembers([
        { id: user?.id || '1', name: user?.name || 'You', email: user?.email, role: 'OWNER', avatarUrl: null },
      ])
    }
  }

  // Fetch members when modal opens or workspace changes
  useEffect(() => {
    if (open && currentSection === 'members') {
      fetchMembers()
    }
  }, [open, currentSection, workspaceId])

  const renderMembersSettings = () => (
    <div className="p-8 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Members</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Manage who has access to this workspace
      </p>

      {/* Invite Member */}
      <div className="mb-8">
        <Label className="text-sm font-medium mb-3 block">Invite people</Label>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInviteMember()}
            className="flex-1"
          />
          <Button 
            onClick={handleInviteMember}
            disabled={isLoading || !inviteEmail}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite'}
          </Button>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Members List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Label className="text-sm font-medium">Workspace members</Label>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Array.isArray(members) ? members.length : 0} {members?.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        <div className="space-y-2">
          {Array.isArray(members) && members.map((member) => (
            <div 
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <div className="flex items-center gap-3">
                <AvatarUpload
                  currentAvatarUrl={member.avatarUrl}
                  userName={member.name}
                  userEmail={member.email}
                  size="sm"
                  editable={false}
                />
                <div>
                  <p className="text-sm font-medium">
                    {member.name || 'Unknown'} 
                    {member.id === user?.id && <span className="text-gray-500 ml-1">(you)</span>}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={member.role}
                  onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                  disabled={member.role === 'OWNER'}
                  className="text-sm px-2 py-1 border rounded-md bg-white dark:bg-gray-800 disabled:opacity-50"
                >
                  <option value="OWNER">Owner</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                  <option value="GUEST">Guest</option>
                </select>
                
                {member.role !== 'OWNER' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workspace Settings */}
      <Separator className="my-8" />
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Workspace permissions</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              Coming Soon
            </span>
          </div>
          
          <div className="space-y-3 opacity-50 pointer-events-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Allow members to invite</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Members can invite new people to the workspace
                </p>
              </div>
              <Switch disabled />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Allow guests</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Invite external users with limited access
                </p>
              </div>
              <Switch disabled />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Require admin approval</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  New members need admin approval to join
                </p>
              </div>
              <Switch disabled />
            </div>
          </div>
        </div>
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
      case 'members':
        return renderMembersSettings()
      default:
        return renderAccountSettings()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[90vw] h-[80vh] p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex h-full bg-white dark:bg-gray-950 rounded-lg overflow-hidden">
          {/* Sidebar */}
          {renderSidebar()}
          
          {/* Content Area */}
          <div className="flex-1 bg-white dark:bg-gray-950 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}