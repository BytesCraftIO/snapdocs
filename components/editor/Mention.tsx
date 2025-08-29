'use client'

import { createReactInlineContentSpec } from '@blocknote/react'
import { cn } from '@/lib/utils'

export const Mention = createReactInlineContentSpec(
  {
    type: "mention" as const,
    propSchema: {
      user: {
        default: "Unknown" as const
      },
      userId: {
        default: undefined,
        type: "string" as const
      },
      email: {
        default: undefined,
        type: "string" as const
      }
    } as const,
    content: "none" as const,
  },
  {
    render: (props) => {
      const { user, userId, email } = props.inlineContent.props
      
      return (
        <span
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 mx-0.5",
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            "rounded-md text-sm font-medium",
            "hover:bg-blue-200 dark:hover:bg-blue-900/50",
            "cursor-pointer transition-colors duration-150",
            "align-baseline"
          )}
          data-mention-user={user}
          data-mention-userid={userId}
          data-mention-email={email}
          contentEditable={false}
        >
          @{user}
        </span>
      )
    }
  }
)