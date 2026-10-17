import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[-0.005em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/30 focus-visible:ring-[3px] active:scale-[0.98] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "cursor-pointer bg-ink text-white hover:bg-ink-2 shadow-[0_8px_20px_-10px_rgba(10,26,53,0.6)]",
        destructive:
          "cursor-pointer bg-danger-soft text-danger hover:bg-danger hover:text-white focus-visible:ring-destructive/20",
        outline:
          "cursor-pointer border border-input bg-white text-ink hover:border-brand/40 hover:bg-brand-soft/60",
        secondary:
          "cursor-pointer bg-secondary text-secondary-foreground hover:bg-brand-soft/70",
        ghost:
          "cursor-pointer text-ink hover:bg-muted",
        sidebar:
          "cursor-pointer bg-transparent text-white hover:bg-white/5 rounded-xl",

        link: "cursor-pointer w-full bg-white text-ink border border-input hover:border-brand/40 hover:bg-brand-soft/50",

        link_card: "cursor-pointer w-full bg-transparent text-muted-foreground font-medium hover:text-brand underline-offset-4 hover:underline p-0 text-start",

        close: "cursor-pointer w-auto bg-white text-ink border border-input hover:bg-muted",

        create: "cursor-pointer w-auto bg-brand text-white hover:bg-brand-strong shadow-[0_10px_24px_-12px_rgba(31,86,240,0.85)]",

        dashed: "cursor-pointer border border-dashed border-brand/50 w-auto bg-brand-soft/50 text-brand hover:bg-brand-soft hover:border-brand",

        gold: "cursor-pointer bg-gold text-white hover:brightness-105 shadow-[0_10px_24px_-12px_rgba(201,154,46,0.9)]",
      },
      size: {
        default: "h-11 px-5 py-2 has-[>svg]:px-4",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 px-6 has-[>svg]:px-5",
        link: "h-auto w-auto",
        icon: "size-10",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
