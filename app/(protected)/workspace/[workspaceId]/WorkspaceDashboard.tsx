'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users, FileText, Archive, Clock, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { NewPageDialog } from '@/components/pages/NewPageDialog'
import { Workspace, Page, User } from '@/types'

interface WorkspaceDashboardProps {
  workspace: any // Extended workspace with members
  recentPages: any[] // Extended pages with author
  stats: {
    totalPages: number
    archivedPages: number
    totalMembers: number
  }
  currentUser: User
}

export function WorkspaceDashboard({ 
  workspace, 
  recentPages, 
  stats,
  currentUser 
}: WorkspaceDashboardProps) {
  const [newPageOpen, setNewPageOpen] = useState(false)
  const router = useRouter()

  const handleCreatePage = () => {
    setNewPageOpen(true)
  }

  const handlePageClick = (pageId: string) => {
    router.push(`/workspace/${workspace.id}/page/${pageId}`)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {workspace.icon && (
              <span className="text-4xl">{workspace.icon}</span>
            )}
            <div>
              <h1 className="text-3xl font-bold">{workspace.name}</h1>
              <p className="text-muted-foreground">
                {getGreeting()}, {currentUser.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <Button onClick={handleCreatePage} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              New page
            </Button>
            <Button variant="outline" size="lg">
              <Sparkles className="w-5 h-5 mr-2" />
              AI Assistant
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPages}</div>
              <p className="text-xs text-muted-foreground">
                {stats.archivedPages} archived
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                Active collaborators
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentPages.length}</div>
              <p className="text-xs text-muted-foreground">
                Pages updated recently
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Pages */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Pages
                </CardTitle>
                <CardDescription>
                  Pages you've worked on recently
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentPages.length > 0 ? (
                  <div className="space-y-3">
                    {recentPages.map((page) => (
                      <div
                        key={page.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handlePageClick(page.id)}
                      >
                        <span className="text-lg">{page.icon || '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{page.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Updated {format(new Date(page.updatedAt), 'MMM d, yyyy')}
                            {page.author?.name && ` by ${page.author.name}`}
                          </div>
                        </div>
                        {page.isPublished && (
                          <Badge variant="secondary" className="text-xs">
                            Published
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <div className="text-sm text-muted-foreground mb-4">
                      No pages yet. Create your first page to get started.
                    </div>
                    <Button onClick={handleCreatePage}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create page
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Team Members */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members
                </CardTitle>
                <CardDescription>
                  People in this workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workspace.members.slice(0, 8).map((member: any) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        {member.user.avatarUrl ? (
                          <img 
                            src={member.user.avatarUrl} 
                            alt={member.user.name || 'User'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                            {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {member.user.name || member.user.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.role.toLowerCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {workspace.members.length > 8 && (
                    <div className="text-xs text-muted-foreground text-center pt-2">
                      +{workspace.members.length - 8} more members
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={handleCreatePage}
                >
                  <div className="flex items-center gap-3">
                    <Plus className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">New Page</div>
                      <div className="text-xs text-muted-foreground">
                        Start writing
                      </div>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => router.push(`/workspace/${workspace.id}/pages?filter=archived`)}
                >
                  <div className="flex items-center gap-3">
                    <Archive className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">View Archive</div>
                      <div className="text-xs text-muted-foreground">
                        {stats.archivedPages} pages
                      </div>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => router.push(`/workspace/${workspace.id}/settings`)}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Workspace Settings</div>
                      <div className="text-xs text-muted-foreground">
                        Manage team
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Page Dialog */}
      <NewPageDialog
        open={newPageOpen}
        onOpenChange={setNewPageOpen}
        workspaceId={workspace.id}
      />
    </div>
  )
}