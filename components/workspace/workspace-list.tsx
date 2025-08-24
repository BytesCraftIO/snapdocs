"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, FileText } from "lucide-react"

interface Workspace {
  id: string
  name: string
  slug: string
  icon: string | null
  members: {
    user: {
      id: string
      name: string | null
      email: string
      avatarUrl: string | null
    }
  }[]
  _count: {
    pages: number
  }
}

interface WorkspaceListProps {
  workspaces: Workspace[]
}

export function WorkspaceList({ workspaces }: WorkspaceListProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workspaces.map((workspace) => (
        <Link key={workspace.id} href={`/workspace/${workspace.slug}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  {workspace.icon ? (
                    <span className="text-2xl">{workspace.icon}</span>
                  ) : (
                    <span className="text-blue-600 font-semibold text-lg">
                      {getInitials(workspace.name)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {workspace.name}
                  </CardTitle>
                  <CardDescription className="truncate">
                    {workspace.members.length === 1 ? "Personal" : "Team workspace"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{workspace._count.pages} pages</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{workspace.members.length} members</span>
                  </div>
                </div>
              </div>
              
              {workspace.members.length > 1 && (
                <div className="flex items-center space-x-2 mt-3">
                  <div className="flex -space-x-2">
                    {workspace.members.slice(0, 4).map((member) => (
                      <Avatar key={member.user.id} className="w-6 h-6 border-2 border-white">
                        <AvatarImage src={member.user.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(member.user.name || member.user.email)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {workspace.members.length > 4 && (
                    <span className="text-xs text-gray-500">
                      +{workspace.members.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}