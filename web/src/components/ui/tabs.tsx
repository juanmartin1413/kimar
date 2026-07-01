'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement>
type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
}
type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string
}

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

function Tabs({ value, defaultValue, onValueChange, className, children, ...props }: TabsProps) {
  const [currentValue, setCurrentValue] = React.useState(value ?? defaultValue ?? '')
  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setCurrentValue(newValue)
    }
    onValueChange?.(newValue)
  }

  React.useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value)
    }
  }, [value])

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn('space-y-4', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, children, ...props }: TabsListProps) {
  return (
    <div className={cn('inline-flex rounded-full border bg-muted p-1', className)} {...props}>
      {children}
    </div>
  )
}

function TabsTrigger({ className, value, children, ...props }: TabsTriggerProps) {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component')
  }

  const active = context.value === value

  return (
    <button
      type="button"
      className={cn(
        'rounded-full px-4 py-2 text-sm font-medium transition-all',
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-transparent',
        className
      )}
      onClick={() => context.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component')
  }

  if (context.value !== value) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)} {...props}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
