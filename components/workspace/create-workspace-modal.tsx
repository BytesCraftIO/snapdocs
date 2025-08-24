"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import toast from "react-hot-toast"

interface CreateWorkspaceModalProps {
  onClose?: () => void
  onSuccess?: (workspace: any) => void
}

export function CreateWorkspaceModal({ onClose, onSuccess }: CreateWorkspaceModalProps) {
  const [open, setOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("🏢")
  const router = useRouter()

  const handleClose = () => {
    setOpen(false)
    onClose?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error("Workspace name is required")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          icon: icon || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create workspace")
      }

      const workspace = await response.json()
      toast.success("Workspace created successfully!")
      
      if (onSuccess) {
        onSuccess(workspace)
      } else {
        router.push(`/workspace/${workspace.id}`)
        router.refresh()
      }
      
      handleClose()
    } catch (error) {
      console.error("Error creating workspace:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create workspace")
    } finally {
      setIsLoading(false)
    }
  }

  const emojiOptions = ["🏢", "🚀", "💼", "🎯", "📊", "🎨", "💡", "🔬", "📚", "🏠"]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Workspaces are shared environments where teams can collaborate.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="icon" className="text-sm font-normal">
                Icon
              </Label>
              <div className="flex gap-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`w-10 h-10 rounded-md border text-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                      icon === emoji 
                        ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800" 
                        : "border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-normal">
                Workspace name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Acme Inc"
                className="h-9 border-neutral-200 dark:border-neutral-800 focus:ring-0 focus:border-neutral-400"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-normal">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this workspace for?"
                className="min-h-[80px] border-neutral-200 dark:border-neutral-800 focus:ring-0 focus:border-neutral-400 resize-none"
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-neutral-200 dark:border-neutral-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !name.trim()}
              className="bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900"
            >
              {isLoading ? "Creating..." : "Create workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}