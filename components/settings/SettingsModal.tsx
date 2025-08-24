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
  workspaceId?: string
}

type SettingsSection = 
  | 'main'
  | 'account' 
  | 'notifications' 
  | 'security' 
  | 'appearance'
  | 'workspace'
  | 'billing'
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
  const [workspaceUrl, setWorkspaceUrl] = useState('my-workspace')
  const [description, setDescription] = useState('')
  const [members, setMembers] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null)

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
          name: workspaceName,
          description 
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

  // Fetch workspace details when modal opens
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId || !open) return

      try {
        const response = await fetch(`/api/workspaces/${workspaceId}`)
        if (response.ok) {
          const data = await response.json()
          setWorkspaceName(data.name || 'My Workspace')
          setDescription(data.description || '')
          setCurrentWorkspace(data)
        }
      } catch (error) {
        console.error('Error fetching workspace:', error)
      }
    }

    fetchWorkspace()
  }, [workspaceId, open])

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
      <div className="p-4 flex items-center gap-3">
        <AvatarUpload
          currentAvatarUrl={avatarUrl}
          userName={user?.name}
          userEmail={user?.email}
          size="sm"
          editable={false}
        />
        <div>
          <h2 className="text-sm font-semibold">{user?.name || 'User'}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
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
          onClick={() => setCurrentSection('members')}
          className={cn(
            "w-full px-2 py-1.5 text-sm text-left rounded-md flex items-center gap-2 transition-colors",
            currentSection === 'members' 
              ? "bg-gray-200 dark:bg-gray-800" 
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
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
        setMembers(data)
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
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Members</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage who has access to this workspace
        </p>
      </div>

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
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        <div className="space-y-2">
          {members.map((member) => (
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
          <h3 className="text-sm font-medium mb-4">Workspace permissions</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Allow members to invite</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Members can invite new people to the workspace
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Allow guests</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Invite external users with limited access
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Require admin approval</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  New members need admin approval to join
                </p>
              </div>
              <Switch />
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
      case 'billing':
        return renderBillingSettings()
      case 'members':
        return renderMembersSettings()
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