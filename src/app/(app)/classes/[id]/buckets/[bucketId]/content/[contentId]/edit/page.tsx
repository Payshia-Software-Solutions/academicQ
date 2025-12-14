
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { EditContentForm } from './_components/edit-content-form';
import { useParams } from 'next/navigation';

function EditContentPageContent() {
  const params = useParams();
  const { id: courseId, bucketId } = params;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/classes" className="hover:underline">Classes</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href={`/classes/${courseId}`} className="hover:underline">Course</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href={`/classes/${courseId}/buckets/${bucketId}`} className="hover:underline">Bucket</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="truncate">Edit Content</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Edit Content</h1>
        <p className="text-muted-foreground mt-1">Update the details for this content item.</p>
      </header>

      <EditContentForm />
    </div>
  );
}

export default function EditContentPage() {
    return <EditContentPageContent />;
}
