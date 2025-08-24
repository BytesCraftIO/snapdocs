"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  MoreHorizontal, 
  Trash2, 
  Copy, 
  Archive,
  Image,
  Smile,
  X
} from "lucide-react"
import toast from "react-hot-toast"

interface PageHeaderProps {
  page: any
  workspaceId: string
  onUpdate?: () => void
}

const EMOJI_OPTIONS = ["📄", "📝", "📚", "💡", "🎯", "🚀", "💼", "📊", "🎨", "🔬", "📖", "✨", "🌟", "💎", "🏆", "🎉"]
const COVER_GRADIENTS = [
  "bg-gradient-to-r from-blue-400 to-cyan-400",
  "bg-gradient-to-r from-purple-400 to-pink-400",
  "bg-gradient-to-r from-green-400 to-blue-400",
  "bg-gradient-to-r from-yellow-400 to-red-400",
  "bg-gradient-to-r from-indigo-400 to-purple-400",
  "bg-gradient-to-r from-pink-400 to-rose-400",
]

export function PageHeader({ page, workspaceId, onUpdate }: PageHeaderProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [icon, setIcon] = useState(page.icon || "")
  const [coverImage, setCoverImage] = useState(page.coverImage || "")
  const [isUpdating, setIsUpdating] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Page deleted")
        router.push(`/workspace/${workspaceId}`)
        router.refresh()
      } else {
        toast.error("Failed to delete page")
      }
    } catch (error) {
      console.error("Error deleting page:", error)
      toast.error("Failed to delete page")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/pages/${page.id}/duplicate`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Page duplicated")
        router.push(`/workspace/${workspaceId}/page/${data.page.id}`)
      } else {
        toast.error("Failed to duplicate page")
      }
    } catch (error) {
      console.error("Error duplicating page:", error)
      toast.error("Failed to duplicate page")
    }
  }

  const handleArchive = async () => {
    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isArchived: true,
        }),
      })

      if (response.ok) {
        toast.success("Page archived")
        router.push(`/workspace/${workspaceId}`)
        router.refresh()
      } else {
        toast.error("Failed to archive page")
      }
    } catch (error) {
      console.error("Error archiving page:", error)
      toast.error("Failed to archive page")
    }
  }

  const updatePageIcon = async (newIcon: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          icon: newIcon,
        }),
      })

      if (response.ok) {
        setIcon(newIcon)
        toast.success("Icon updated")
        onUpdate?.()
      } else {
        toast.error("Failed to update icon")
      }
    } catch (error) {
      console.error("Error updating icon:", error)
      toast.error("Failed to update icon")
    } finally {
      setIsUpdating(false)
      setShowEmojiPicker(false)
    }
  }

  const updatePageCover = async (newCover: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coverImage: newCover,
        }),
      })

      if (response.ok) {
        setCoverImage(newCover)
        toast.success("Cover updated")
        onUpdate?.()
      } else {
        toast.error("Failed to update cover")
      }
    } catch (error) {
      console.error("Error updating cover:", error)
      toast.error("Failed to update cover")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For demo, we'll use a placeholder URL
    // In production, upload to S3/Cloudinary
    const placeholderUrl = URL.createObjectURL(file)
    await updatePageCover(placeholderUrl)
  }

  const handleRemoveIcon = () => {
    updatePageIcon("")
  }

  const handleRemoveCover = () => {
    updatePageCover("")
  }

  return (
    <>
      {/* Cover Image */}
      {coverImage && (
        <div className="relative h-48 w-full group">
          {coverImage.startsWith("bg-gradient") ? (
            <div className={`h-full w-full ${coverImage}`} />
          ) : (
            <img 
              src={coverImage} 
              alt="Page cover" 
              className="h-full w-full object-cover"
            />
          )}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRemoveCover}
              className="bg-white/90 hover:bg-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="px-8 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Emoji Icon */}
            <div className="relative group">
              {icon ? (
                <button
                  onClick={() => setShowEmojiPicker(true)}
                  className="text-5xl hover:opacity-80 transition-opacity"
                >
                  {icon}
                </button>
              ) : (
                <button
                  onClick={() => setShowEmojiPicker(true)}
                  className="w-14 h-14 rounded-lg border-2 border-dashed border-neutral-300 hover:border-neutral-400 flex items-center justify-center transition-colors"
                >
                  <Smile className="h-6 w-6 text-neutral-400" />
                </button>
              )}
              
              {icon && (
                <button
                  onClick={handleRemoveIcon}
                  className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-neutral-900 rounded-full p-1 shadow-md"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Add Cover Button */}
            {!coverImage && (
              <div className="flex gap-2 pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  <Image className="h-3 w-3 mr-1" />
                  Add cover
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-xs">
                      Gradient
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {COVER_GRADIENTS.map((gradient) => (
                      <DropdownMenuItem
                        key={gradient}
                        onClick={() => updatePageCover(gradient)}
                      >
                        <div className={`w-full h-8 rounded ${gradient}`} />
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Page Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEmojiPicker(false)}>
            <div 
              className="bg-white dark:bg-neutral-900 rounded-lg p-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-4 gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => updatePageIcon(emoji)}
                    className="text-2xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                    disabled={isUpdating}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete page</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{page.title || "Untitled"}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}