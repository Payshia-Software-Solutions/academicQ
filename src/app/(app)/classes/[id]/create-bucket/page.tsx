
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CreateBucketForm } from './_components/create-bucket-form';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CreateBucketPageContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || '';
  const description = searchParams.get('description') || '';

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/classes" className="hover:underline">Classes</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="truncate">{name}</span>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Create Bucket</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Create Course Bucket</h1>
        <p className="text-muted-foreground mt-1">Configure and create a new payment bucket for this course.</p>
      </header>

      <CreateBucketForm defaultName={name} defaultDescription={description} />

    </div>
  );
}


export default function CreateBucketPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateBucketPageContent />
        </Suspense>
    )
}
