"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Database, Calendar, Users, Hash, CheckSquare, Zap, Plus } from "lucide-react"
import Link from "next/link"

const demoTemplates = [
  {
    icon: FileText,
    title: "Meeting Notes",
    description: "Organize your team meetings",
    color: "bg-blue-100 text-blue-600"
  },
  {
    icon: Database,
    title: "Task Database",
    description: "Track projects and tasks",
    color: "bg-purple-100 text-purple-600"
  },
  {
    icon: Calendar,
    title: "Content Calendar",
    description: "Plan your content strategy",
    color: "bg-green-100 text-green-600"
  },
  {
    icon: Users,
    title: "Team Directory",
    description: "Manage team information",
    color: "bg-orange-100 text-orange-600"
  },
  {
    icon: Hash,
    title: "Product Roadmap",
    description: "Plan product features",
    color: "bg-pink-100 text-pink-600"
  },
  {
    icon: CheckSquare,
    title: "Weekly Planner",
    description: "Organize your week",
    color: "bg-indigo-100 text-indigo-600"
  }
]

export default function DemoPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-xl">Notion Clone</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Notion Clone Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the power of a flexible workspace. Create documents, databases, 
            and collaborate with your team all in one place.
          </p>
        </div>

        {/* Templates Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Start with a Template
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoTemplates.map((template, index) => {
              const Icon = template.icon
              return (
                <Card 
                  key={index}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedTemplate(template.title)}
                >
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${template.color} flex items-center justify-center mb-3`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Key Features
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold">Block-based Editor</h3>
                  <p className="text-gray-600">Create rich content with our flexible block system</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold">Database Views</h3>
                  <p className="text-gray-600">Organize data in tables, boards, calendars, and more</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold">Real-time Collaboration</h3>
                  <p className="text-gray-600">Work together with your team in real-time</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold">Nested Pages</h3>
                  <p className="text-gray-600">Create hierarchical documentation structures</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold">Templates</h3>
                  <p className="text-gray-600">Start quickly with pre-built templates</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold">Permissions</h3>
                  <p className="text-gray-600">Control access with granular permissions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Create your free account and start building your workspace
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/signup">
              <Button size="lg" className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Create Free Account</span>
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Selected Template Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Template: {selectedTemplate}</CardTitle>
                <CardDescription>
                  This would open the {selectedTemplate} template in the editor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sign up or log in to start using this template and create your own workspace.
                </p>
              </CardContent>
              <div className="flex justify-end space-x-2 p-6 pt-0">
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                  Close
                </Button>
                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}