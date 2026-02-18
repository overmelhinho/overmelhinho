import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Input seguro para React 18 + Formik + Radix.
 * Garante que "props" nunca sejam undefined e elimina o erro "reading 'disabled'".
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "text", ...props }, ref) => {
    const normalizedProps = React.useMemo(() => {
      // Garante que props seja sempre um objeto válido
      const safe = props || {}
      return {
        ...safe,
        disabled: !!safe.disabled,
        readOnly: !!safe.readOnly,
      }
    }, [props])

    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...normalizedProps}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
