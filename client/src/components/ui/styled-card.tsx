import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StyledCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function StyledCard({
  className,
  title,
  description,
  children,
  footer,
  ...props
}: StyledCardProps) {
  return (
    <Card
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm dark:shadow-none transition-all",
        "hover:shadow-md dark:hover:border-muted",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="flex items-center h-full">{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}

// Special dashboard card for stats
interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  className,
}: StatCardProps) {
  return (
    <StyledCard className={cn("h-32", className)}>
      <div className="flex items-center justify-between w-full">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center mt-2">
              {trend === "up" ? (
                <span className="text-green-500 text-xs">
                  ↑ {trendValue}
                </span>
              ) : trend === "down" ? (
                <span className="text-red-500 text-xs">
                  ↓ {trendValue}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">
                  → {trendValue}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="bg-primary/10 p-3 rounded-full dark:bg-primary/20">
            {icon}
          </div>
        )}
      </div>
    </StyledCard>
  )
} 