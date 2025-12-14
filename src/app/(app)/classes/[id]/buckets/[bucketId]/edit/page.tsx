
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { EditBucketForm } from './_components/edit-bucket-form';
import { useParams } from 'next/navigation';

function EditBucketPageContent() {
  const params = useParams();
  const courseId = params.id as string;
  const bucketId = params.bucketId as string;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/classes" className="hover:underline">Classes</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href={`/classes/${courseId}`} className="hover:underline">Course Details</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Edit Bucket</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Edit Course Bucket</h1>
        <p className="text-muted-foreground mt-1">Update the details for this payment bucket.</p>
      </header>

      <EditBucketForm bucketId={bucketId} />
    </div>
  );
}

export default function EditBucketPage() {
    return <EditBucketPageContent />;
}
