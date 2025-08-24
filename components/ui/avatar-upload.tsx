"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Upload, X } from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  userName?: string | null
  userEmail?: string
  onUpload?: (avatarUrl: string) => void
  size?: "sm" | "md" | "lg"
  editable?: boolean
}

export function AvatarUpload({
  currentAvatarUrl,
  userName,
  userEmail,
  onUpload,
  size = "md",
  editable = true
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-20 w-20",
    lg: "h-32 w-32"
  }
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }
    
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload avatar")
      }
      
      const data = await response.json()
      setAvatarUrl(data.avatarUrl)
      onUpload?.(data.avatarUrl)
      toast.success("Avatar updated successfully")
    } catch (error) {
      console.error("Avatar upload error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload avatar")
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }
  
  const handleRemoveAvatar = async () => {
    setIsUploading(true)
    
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          avatarUrl: null
        })
      })
      
      if (!response.ok) {
        throw new Error("Failed to remove avatar")
      }
      
      setAvatarUrl(null)
      onUpload?.("")
      toast.success("Avatar removed")
    } catch (error) {
      console.error("Remove avatar error:", error)
      toast.error("Failed to remove avatar")
    } finally {
      setIsUploading(false)
    }
  }
  
  const getInitials = () => {
    if (userName) {
      return userName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return userEmail?.[0]?.toUpperCase() || "?"
  }
  
  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], "relative")}>
        <AvatarImage src={avatarUrl || undefined} alt={userName || userEmail} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      
      {editable && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "absolute bottom-0 right-0 rounded-full bg-white dark:bg-gray-800 p-1.5 shadow-lg",
              "border border-gray-200 dark:border-gray-700",
              "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              size === "sm" && "p-1"
            )}
            title="Change avatar"
          >
            {isUploading ? (
              <div className="animate-spin h-3 w-3 border-2 border-gray-500 border-t-transparent rounded-full" />
            ) : (
              <Camera className={cn("text-gray-600 dark:text-gray-400", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
            )}
          </button>
          
          {avatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              disabled={isUploading}
              className={cn(
                "absolute -top-1 -right-1 rounded-full bg-red-500 p-1 shadow-lg",
                "hover:bg-red-600 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              title="Remove avatar"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
      )}
    </div>
  )
}