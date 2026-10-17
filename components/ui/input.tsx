import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'text-ink file:text-foreground placeholder:text-muted-foreground/70 h-12 w-full min-w-0 rounded-xl border border-input bg-white px-4 py-1 text-base transition-[color,box-shadow,border-color] outline-none focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/10 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
