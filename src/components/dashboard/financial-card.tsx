import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface FinancialCardProps {
  title: string
  value: number
  icon: LucideIcon
  color: string
  isCurrency?: boolean
  isPercentage?: boolean
  target?: number,
  current?: number,
}

export default function FinancialCard({ title, value, icon: Icon, color, isCurrency, isPercentage, target, current }: FinancialCardProps) {
  const formattedValue = isCurrency 
    ? `EGP ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}` 
    : isPercentage
    ? `${value.toFixed(1)}%`
    : value.toLocaleString();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-2 rounded-md", color)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {isPercentage && target && current !== undefined ? (
          <>
            <p className="text-xs text-muted-foreground mt-1">
              {`Target: EGP ${target.toLocaleString()}`}
            </p>
            <Progress value={value} className="mt-2 h-2" />
          </>
        ) : (
            <p className="text-xs text-muted-foreground mt-1 invisible">No extra data</p>
        )}
      </CardContent>
    </Card>
  )
}
