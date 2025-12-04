
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AddItemForm } from './_components/add-item-form';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AddItemPageContent() {
  const params = useParams();
  const courseId = params.id;
  const bucketId = params.bucketId;
  
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/study-packs" className="hover:underline">Study Packs</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href={`/study-packs/${courseId}`} className="hover:underline">Course</Link>
             <ChevronRight className="h-4 w-4 mx-1" />
            <Link href={`/study-packs/${courseId}/bucket/${bucketId}`} className="hover:underline">Bucket</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Add Orderable Item</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Add New Orderable Item</h1>
        <p className="text-muted-foreground mt-1">Configure and add a new item to this study pack bucket.</p>
      </header>

      <AddItemForm />
    </div>
  );
}

export default function AddItemPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AddItemPageContent />
        </Suspense>
    )
}
