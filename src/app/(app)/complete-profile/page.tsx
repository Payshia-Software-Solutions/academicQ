
'use client';

import { Suspense } from 'react';
import { CompleteProfileForm } from './_components/complete-profile-form';
import { Skeleton } from '@/components/ui/skeleton';

function CompleteProfilePageContent() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Edit Your Profile</h1>
        <p className="text-muted-foreground mt-1">Please provide or update your full details.</p>
      </header>

      <CompleteProfileForm />
    </div>
  );
}

function PageFallback() {
    return (
        <div className="space-y-6">
            <header>
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </header>
            <Skeleton className="h-[500px] w-full" />
        </div>
    )
}

export default function CompleteProfilePage() {
    return (
        <Suspense fallback={<PageFallback />}>
            <CompleteProfilePageContent />
        </Suspense>
    )
}
