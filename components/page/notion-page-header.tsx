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
  MessageSquare,
  Clock,
  Star,
  Smile,
  Image,
  Upload,
  Link,
  Trash2,
  Copy,
  Move,
  Plus,
  X
} from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

interface NotionPageHeaderProps {
  page: any
  workspaceId: string
  onUpdate?: () => void
}

const EMOJI_OPTIONS = ["📝", "📄", "📚", "📖", "💡", "🎯", "🚀", "💼", "📊", "🎨", "🔬", "✨", "🌟", "💎", "🏆", "🎉", "📌", "📍", "🔖", "📋"]

export function NotionPageHeader({ page, workspaceId, onUpdate }: NotionPageHeaderProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [icon, setIcon] = useState(page.icon || "")
  const [coverImage, setCoverImage] = useState(page.coverImage || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const [hoveredAddIcon, setHoveredAddIcon] = useState(false)
  const [hoveredAddCover, setHoveredAddCover] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Page moved to trash")
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

  const gradients = [
    "linear-gradient(to right, rgb(255, 226, 214), rgb(255, 167, 167))",
    "linear-gradient(to right, rgb(255, 214, 229), rgb(255, 175, 204))",
    "linear-gradient(to right, rgb(209, 213, 255), rgb(180, 188, 255))",
    "linear-gradient(to right, rgb(255, 236, 179), rgb(255, 221, 122))",
    "linear-gradient(to right, rgb(186, 230, 255), rgb(147, 210, 255))",
    "linear-gradient(to right, rgb(186, 255, 201), rgb(147, 255, 175))",
  ]

  return (
    <>
      {/* Cover Image */}
      {coverImage && (
        <div className="relative h-[30vh] max-h-[300px] w-full group">
          <div 
            className="h-full w-full"
            style={{
              background: coverImage.startsWith('http') || coverImage.startsWith('data:') 
                ? `url(${coverImage}) center/cover` 
                : coverImage
            }}
          />
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => updatePageCover("")}
              className="bg-white/90 hover:bg-white text-xs h-7"
            >
              Remove
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/90 hover:bg-white text-xs h-7"
            >
              Change cover
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-[900px] mx-auto px-[96px]">
        {/* Add Cover / Add Icon buttons */}
        {(!coverImage || !icon) && (
          <div className="flex gap-2 py-3 opacity-0 hover:opacity-100 transition-opacity">
            {!icon && (
              <button
                className="text-sm text-[#37352f80] hover:bg-[#37352f0a] px-3 py-1 rounded"
                onMouseEnter={() => setHoveredAddIcon(true)}
                onMouseLeave={() => setHoveredAddIcon(false)}
                onClick={() => setShowEmojiPicker(true)}
              >
                <Smile className="inline h-4 w-4 mr-1.5" />
                Add icon
              </button>
            )}
            {!coverImage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-sm text-[#37352f80] hover:bg-[#37352f0a] px-3 py-1 rounded"
                    onMouseEnter={() => setHoveredAddCover(true)}
                    onMouseLeave={() => setHoveredAddCover(false)}
                  >
                    <Image className="inline h-4 w-4 mr-1.5" />
                    Add cover
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground mb-2">Gradients</p>
                    <div className="grid grid-cols-3 gap-1">
                      {gradients.map((gradient, i) => (
                        <button
                          key={i}
                          className="h-12 rounded border hover:border-black/50"
                          style={{ background: gradient }}
                          onClick={() => updatePageCover(gradient)}
                        />
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <button className="text-sm text-[#37352f80] hover:bg-[#37352f0a] px-3 py-1 rounded">
              <MessageSquare className="inline h-4 w-4 mr-1.5" />
              Add comment
            </button>
          </div>
        )}

        {/* Icon */}
        {icon && (
          <div className="group relative inline-block mt-2">
            <button
              onClick={() => setShowEmojiPicker(true)}
              className="text-[78px] leading-none hover:bg-[#37352f0a] p-2 -ml-2 rounded transition-colors"
            >
              {icon}
            </button>
            <button
              onClick={() => updatePageIcon("")}
              className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-[#191919] rounded p-1 shadow-lg border"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Top Bar Actions */}
        <div className="flex items-center justify-end gap-2 py-2 text-sm text-[#37352f80]">
          <button className="hover:bg-[#37352f0a] px-2 py-1 rounded">
            Share
          </button>
          <button className="hover:bg-[#37352f0a] px-2 py-1 rounded">
            <MessageSquare className="h-4 w-4" />
          </button>
          <button className="hover:bg-[#37352f0a] px-2 py-1 rounded">
            <Clock className="h-4 w-4" />
          </button>
          <button className="hover:bg-[#37352f0a] px-2 py-1 rounded">
            <Star className="h-4 w-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hover:bg-[#37352f0a] p-1 rounded">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Move className="h-4 w-4 mr-2" />
                Move to
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Move to trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center" 
            onClick={() => setShowEmojiPicker(false)}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div 
              className="relative bg-white dark:bg-[#191919] rounded-lg p-4 shadow-xl border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-5 gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => updatePageIcon(emoji)}
                    className="text-2xl p-2 hover:bg-[#37352f0a] rounded"
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
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              const reader = new FileReader()
              reader.onloadend = () => {
                updatePageCover(reader.result as string)
              }
              reader.readAsDataURL(file)
            }
          }}
          className="hidden"
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Move to trash?</AlertDialogTitle>
              <AlertDialogDescription>
                "{page.title || "Untitled"}" will be moved to trash.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Moving..." : "Move to trash"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}