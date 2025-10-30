"use client"

import { Task, TaskStatus } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from 'date-fns'

const statusColors: Record<TaskStatus, string> = {
  new: "bg-blue-500",
  in_progress: "bg-yellow-500",
  submitted: "bg-purple-500",
  to_review: "bg-indigo-500",
  done: "bg-green-500",
  cancelled: "bg-gray-500",
}

const statusText: Record<TaskStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  submitted: "Submitted",
  to_review: "To Review",
  done: "Done",
  cancelled: "Cancelled",
}

export default function DueSoonTasks({ tasks }: { tasks: Task[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-muted-foreground" />
            <CardTitle id="due-soon-title" className="font-headline">Due Soon</CardTitle>
        </div>
        <CardDescription>Top 10 upcoming tasks based on due date.</CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                    <div className="w-1 h-10 bg-primary rounded-full mt-1"></div>
                    <div>
                        <p className="font-semibold">{task.clientName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3"/>
                            <span>{task.clientPhone}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium">{format(task.dueDate instanceof Date ? task.dueDate : task.dueDate.toDate(), "dd/MM HH:mm")}</p>
                    <Badge className={cn("mt-1 text-white text-xs", statusColors[task.status] || 'bg-gray-400')}>
                        {statusText[task.status] || task.status}
                    </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <p>No tasks due soon. Great job!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
