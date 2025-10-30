'use client';

import React, { useMemo } from 'react';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc, DocumentReference } from 'firebase/firestore';
import type { User } from '@/lib/types';
import ModeratorDashboard from '@/components/dashboard/moderator-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

function AdminDashboard() {
  return <div className="text-3xl font-bold">Admin Dashboard</div>;
}

function DesignerDashboard() {
  return <div className="text-3xl font-bold">Designer Dashboard</div>;
}

function ClientDashboard() {
  return <div className="text-3xl font-bold">Client Dashboard</div>;
}

function TeamLeaderDashboard() {
  return <div className="text-3xl font-bold">Team Leader Dashboard</div>;
}

function DashboardSkeleton() {
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


export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid) as DocumentReference<User>;
  }, [firestore, user]);

  const { data: userProfile, loading: profileLoading } = useDoc<User>(userProfileRef);

  if (userLoading || profileLoading || !userProfile) {
    return <DashboardSkeleton />;
  }

  switch (userProfile.role) {
    case 'moderator':
      return <ModeratorDashboard user={userProfile} />;
    case 'admin':
      return <AdminDashboard />;
    case 'designer':
      return <DesignerDashboard />;
    case 'client':
      return <ClientDashboard />;
    case 'team_leader':
      return <TeamLeaderDashboard />;
    default:
      return <div>Unknown role. Please contact support.</div>;
  }
}
