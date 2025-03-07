import * as React from "react"
import { cn } from "@/lib/utils"

export interface BlockQuoteProps
  extends React.BlockquoteHTMLAttributes<HTMLQuoteElement> {}

const BlockQuote = React.forwardRef<HTMLQuoteElement, BlockQuoteProps>(
  ({ className, ...props }, ref) => {
    return (
      <blockquote
        ref={ref}
        className={cn(
          "mt-6 border-l-2 border-muted pl-6 italic text-muted-foreground",
          className
        )}
        {...props}
      />
    )
  }
)
BlockQuote.displayName = "BlockQuote"

export { BlockQuote }