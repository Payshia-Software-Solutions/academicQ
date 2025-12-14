
'use client';

import { Suspense } from 'react';
import { CompleteProfileForm } from './_components/complete-profile-form';
import { Preloader } from '@/components/ui/preloader';

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

export default function CompleteProfilePage() {
    return (
        <Suspense fallback={<Preloader />}>
            <CompleteProfilePageContent />
        </Suspense>
    )
}
