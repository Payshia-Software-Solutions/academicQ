
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AddAssignmentForm } from './_components/add-assignment-form';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';

function AddAssignmentPageContent() {
  const params = useParams();
  const { id: courseId, bucketId, contentId } = params;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/classes" className="hover:underline">Classes</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href={`/classes/${courseId}`} className="hover:underline">Course Details</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href={`/classes/${courseId}/buckets/${bucketId}`} className="hover:underline">Bucket</Link>
             <ChevronRight className="h-4 w-4 mx-1" />
             <Link href={`/classes/${courseId}/buckets/${bucketId}/content/${contentId}`} className="hover:underline">Content</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Add Assignment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Add New Assignment</h1>
        <p className="text-muted-foreground mt-1">Create a new assignment associated with this content.</p>
      </header>
      <AddAssignmentForm />
    </div>
  );
}

export default function AddAssignmentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AddAssignmentPageContent />
        </Suspense>
    )
}
