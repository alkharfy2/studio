'use client'

import { addMonths, isAfter, isBefore, isSameDay, isSameMonth, isWithinInterval, startOfDay, startOfMonth, subDays, subMonths, endOfMonth, toDate } from "date-fns";
import React, { useMemo } from 'react';
import { Task } from "@/lib/types";
import FinancialCard from "@/components/dashboard/financial-card";
import KpiCard from "@/components/dashboard/kpi-card";
import RecentTasks from "@/components/dashboard/recent-tasks";
import DueSoonTasks from "@/components/dashboard/due-soon-tasks";
import { Wallet, History, CreditCard, Target, BriefcaseBusiness, Clock, CalendarCheck, CheckCircle, TrendingUp, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useCollection, useFirestore } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

const MONTHLY_TARGET = 10000;

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


export default function ModeratorDashboard() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const tasksQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'tasks'),
      where('moderatorId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);
  
  const moderatorTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.map(t => ({
      ...t,
      // Convert Firestore Timestamps to JS Date objects
      createdAt: t.createdAt instanceof Timestamp ? t.createdAt.toDate() : new Date(t.createdAt),
      updatedAt: t.updatedAt instanceof Timestamp ? t.updatedAt.toDate() : new Date(t.updatedAt),
      dueDate: t.dueDate instanceof Timestamp ? t.dueDate.toDate() : new Date(t.dueDate),
      completedAt: t.completedAt ? (t.completedAt instanceof Timestamp ? t.completedAt.toDate() : new Date(t.completedAt)) : undefined,
      taskDate: t.taskDate instanceof Timestamp ? t.taskDate.toDate() : new Date(t.taskDate),
    }));
  }, [tasks]);


  const financialCalculations = React.useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    let currentMonthNet = 0;
    let previousMonthNet = 0;
    let currentMonthTotalPaid = 0;

    const completedTasks = moderatorTasks.filter(t => t.status === 'done' && t.completedAt);

    completedTasks.forEach(task => {
      const completedAtDate = task.completedAt!;
      if (isSameMonth(completedAtDate, currentMonthStart)) {
        const earnings = (task.financialPaid >= 100 ? task.financialPaid - 100 : task.financialPaid) * 0.20;
        currentMonthNet += earnings;
        currentMonthTotalPaid += task.financialPaid;
      } else if (isWithinInterval(completedAtDate, { start: prevMonthStart, end: prevMonthEnd })) {
        const earnings = (task.financialPaid >= 100 ? task.financialPaid - 100 : task.financialPaid) * 0.20;
        previousMonthNet += earnings;
      }
    });

    return {
      currentMonthNet,
      previousMonthNet,
      currentMonthTotalPaid,
      targetProgress: (currentMonthNet / MONTHLY_TARGET) * 100,
    };
  }, [moderatorTasks]);

  const kpiCalculations = React.useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const startOfToday = startOfDay(now);

    const openForReview = moderatorTasks.filter(t => ['submitted', 'to_review'].includes(t.status)).length;
    const overdue = moderatorTasks.filter(t => !['done', 'cancelled'].includes(t.status) && isBefore(t.dueDate, now)).length;
    const todayDeliveries = moderatorTasks.filter(t => t.completedAt && isSameDay(t.completedAt, startOfToday)).length;
    const doneLast7Days = moderatorTasks.filter(t => t.completedAt && isAfter(t.completedAt, sevenDaysAgo)).length;
    
    const paidLast7Days = moderatorTasks
      .filter(t => t.completedAt && isAfter(t.completedAt, sevenDaysAgo) && t.status === 'done')
      .reduce((sum, task) => sum + task.financialPaid, 0);

    return { openForReview, overdue, todayDeliveries, doneLast7Days, paidLast7Days };
  }, [moderatorTasks]);

  const dueSoonTasks = React.useMemo(() => {
    return moderatorTasks
      .filter(t => !['done', 'cancelled'].includes(t.status))
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 10);
  }, [moderatorTasks]);

  const recentTasks = React.useMemo(() => {
    return moderatorTasks
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }, [moderatorTasks]);


  if (userLoading || tasksLoading) {
    return <TaskSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="font-headline text-3xl font-bold text-foreground">Moderator Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.displayName || 'Moderator'}. Here's your performance overview.</p>
        </div>
        <Button>
          <PlusCircle />
          <span>Create Task</span>
        </Button>
      </div>

      <section aria-labelledby="financials-title">
        <h2 id="financials-title" className="sr-only">Financials</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FinancialCard 
            title="Net Earnings (Current Month)"
            value={financialCalculations.currentMonthNet}
            icon={Wallet}
            color="bg-purple-100 text-purple-800"
            isCurrency
          />
          <FinancialCard 
            title="Net Earnings (Previous Month)"
            value={financialCalculations.previousMonthNet}
            icon={History}
            color="bg-blue-100 text-blue-800"
            isCurrency
          />
          <FinancialCard 
            title="Total Paid (Current Month)"
            value={financialCalculations.currentMonthTotalPaid}
            icon={CreditCard}
            color="bg-cyan-100 text-cyan-800"
            isCurrency
          />
          <FinancialCard 
            title="Monthly Target"
            value={financialCalculations.targetProgress}
            icon={Target}
            color="bg-orange-100 text-orange-800"
            isPercentage
            target={MONTHLY_TARGET}
            current={financialCalculations.currentMonthNet}
          />
        </div>
      </section>

      <section aria-labelledby="kpis-title">
        <h2 id="kpis-title" className="sr-only">Key Performance Indicators</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard title="Open for Review" value={kpiCalculations.openForReview} icon={BriefcaseBusiness} />
          <KpiCard title="Overdue" value={kpiCalculations.overdue} icon={Clock} isCritical={kpiCalculations.overdue > 0} />
          <KpiCard title="Today's Deliveries" value={kpiCalculations.todayDeliveries} icon={CalendarCheck} />
          <KpiCard title="Done Last 7 Days" value={kpiCalculations.doneLast7Days} icon={CheckCircle} />
          <KpiCard title="Paid Last 7 Days" value={`EGP ${kpiCalculations.paidLast7Days.toLocaleString()}`} icon={TrendingUp} />
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
