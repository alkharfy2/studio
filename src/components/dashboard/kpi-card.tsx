import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    isCritical?: boolean;
}

export default function KpiCard({ title, value, icon: Icon, isCritical = false }: KpiCardProps) {
  return (
    <Card className={cn("transition-all hover:shadow-lg", isCritical ? "bg-red-50 border-red-200" : "")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={cn("text-sm font-medium", isCritical ? "text-red-800" : "")}>{title}</CardTitle>
            <Icon className={cn("h-4 w-4 text-muted-foreground", isCritical ? "text-red-600" : "")} />
        </CardHeader>
        <CardContent>
            <div className={cn("text-2xl font-bold", isCritical ? "text-red-900" : "")}>{value}</div>
        </CardContent>
    </Card>
  )
}
