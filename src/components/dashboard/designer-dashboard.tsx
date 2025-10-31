'use client'

import { addMonths, isAfter, isBefore, isSameDay, isSameMonth, isWithinInterval, startOfDay, startOfMonth, subDays, subMonths, endOfMonth, toDate } from "date-fns";
import React, { useMemo } from 'react';
import type { Task, User } from "@/lib/types";
import FinancialCard from "@/components/dashboard/financial-card";
import KpiCard from "@/components/dashboard/kpi-card";
import RecentTasks from "@/components/dashboard/recent-tasks";
import DueSoonTasks from "@/components/dashboard/due-soon-tasks";
import { Wallet, History, CreditCard, Target, BriefcaseBusiness, Clock, CalendarCheck, CheckCircle, TrendingUp, PlusCircle, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const MONTHLY_TARGET = 15000; // Designer monthly target

function TaskSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-9 w-72 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
       <section aria-labelledby="financials-title">
        <h2 id="financials-title" className="sr-only">Financials</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </section>
      <section aria-labelledby="kpis-title">
        <h2 id="kpis-title" className="sr-only">Key Performance Indicators</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </section>
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </section>
    </div>
  );
}


export default function DesignerDashboard({ user }: { user: User }) {
  const firestore = useFirestore();

  const tasksQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'tasks'),
      where('designerId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);

  const designerTasks = useMemo(() => {
    if (!tasks) return [];
    // The useCollection hook returns documents with Firestore Timestamps.
    // We convert them to JavaScript Date objects for easier manipulation with date-fns.
    return tasks.map(t => ({
      ...t,
      createdAt: t.createdAt instanceof Timestamp ? t.createdAt.toDate() : new Date(t.createdAt),
      updatedAt: t.updatedAt instanceof Timestamp ? t.updatedAt.toDate() : new Date(t.updatedAt),
      dueDate: t.dueDate instanceof Timestamp ? t.dueDate.toDate() : new Date(t.dueDate),
      completedAt: t.completedAt ? (t.completedAt instanceof Timestamp ? t.completedAt.toDate() : new Date(t.completedAt)) : undefined,
      taskDate: t.taskDate instanceof Timestamp ? t.taskDate.toDate() : new Date(t.taskDate),
    }));
  }, [tasks]);


  const financialCalculations = React.useMemo(() => {
    if (!designerTasks) return { currentMonthTotal: 0, previousMonthTotal: 0, currentMonthCompleted: 0, targetProgress: 0 };
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    let currentMonthTotal = 0;
    let previousMonthTotal = 0;
    let currentMonthCompleted = 0;

    const completedTasks = designerTasks.filter(t => t.status === 'done' && t.completedAt);

    completedTasks.forEach(task => {
      const completedAtDate = task.completedAt!;
      if (isSameMonth(completedAtDate, currentMonthStart)) {
        currentMonthTotal += task.financialTotal;
        currentMonthCompleted += 1;
      } else if (isWithinInterval(completedAtDate, { start: prevMonthStart, end: prevMonthEnd })) {
        previousMonthTotal += task.financialTotal;
      }
    });

    return {
      currentMonthTotal,
      previousMonthTotal,
      currentMonthCompleted,
      targetProgress: (currentMonthTotal / MONTHLY_TARGET) * 100,
    };
  }, [designerTasks]);

  const kpiCalculations = React.useMemo(() => {
    if (!designerTasks) return { inProgress: 0, overdue: 0, todayDeliveries: 0, doneLast7Days: 0, totalAssigned: 0 };
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const startOfToday = startOfDay(now);

    const inProgress = designerTasks.filter(t => t.status === 'in_progress').length;
    const overdue = designerTasks.filter(t => !['done', 'cancelled'].includes(t.status) && isBefore(new Date(t.dueDate), now)).length;
    const todayDeliveries = designerTasks.filter(t => t.completedAt && isSameDay(new Date(t.completedAt), startOfToday)).length;
    const doneLast7Days = designerTasks.filter(t => t.completedAt && isAfter(new Date(t.completedAt), sevenDaysAgo)).length;
    const totalAssigned = designerTasks.length;

    return { inProgress, overdue, todayDeliveries, doneLast7Days, totalAssigned };
  }, [designerTasks]);

  const dueSoonTasks = React.useMemo(() => {
    if (!designerTasks) return [];
    return designerTasks
      .filter(t => !['done', 'cancelled'].includes(t.status))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 10);
  }, [designerTasks]);

  const recentTasks = React.useMemo(() => {
    if (!designerTasks) return [];
    return designerTasks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [designerTasks]);


  if (tasksLoading) {
    return <TaskSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="font-headline text-3xl font-bold text-foreground">Designer Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name || 'Designer'}. Here's your performance overview.</p>
        </div>
        <Link href="/dashboard/tasks">
          <Button>
            <Palette />
            <span>My Tasks</span>
          </Button>
        </Link>
      </div>

      <section aria-labelledby="financials-title">
        <h2 id="financials-title" className="sr-only">Financials</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FinancialCard
            title="Total Value (Current Month)"
            value={financialCalculations.currentMonthTotal}
            icon={Wallet}
            color="bg-purple-100 text-purple-800"
            isCurrency
          />
          <FinancialCard
            title="Total Value (Previous Month)"
            value={financialCalculations.previousMonthTotal}
            icon={History}
            color="bg-blue-100 text-blue-800"
            isCurrency
          />
          <FinancialCard
            title="Completed (Current Month)"
            value={financialCalculations.currentMonthCompleted}
            icon={CheckCircle}
            color="bg-green-100 text-green-800"
          />
          <FinancialCard
            title="Monthly Target"
            value={financialCalculations.targetProgress}
            icon={Target}
            color="bg-orange-100 text-orange-800"
            isPercentage
            target={MONTHLY_TARGET}
            current={financialCalculations.currentMonthTotal}
          />
        </div>
      </section>

      <section aria-labelledby="kpis-title">
        <h2 id="kpis-title" className="sr-only">Key Performance Indicators</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard title="In Progress" value={kpiCalculations.inProgress} icon={Palette} />
          <KpiCard title="Overdue" value={kpiCalculations.overdue} icon={Clock} isCritical={kpiCalculations.overdue > 0} />
          <KpiCard title="Today's Deliveries" value={kpiCalculations.todayDeliveries} icon={CalendarCheck} />
          <KpiCard title="Done Last 7 Days" value={kpiCalculations.doneLast7Days} icon={CheckCircle} />
          <KpiCard title="Total Assigned" value={kpiCalculations.totalAssigned} icon={BriefcaseBusiness} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div aria-labelledby="due-soon-title">
            <DueSoonTasks tasks={dueSoonTasks} />
        </div>
        <div aria-labelledby="recent-tasks-title">
            <RecentTasks tasks={recentTasks} />
        </div>
      </section>
    </div>
  );
}
