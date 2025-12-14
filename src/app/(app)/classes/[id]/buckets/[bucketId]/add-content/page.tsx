
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AddContentForm } from './_components/add-content-form';
import { useParams } from 'next/navigation';

function AddContentPageContent() {
  const params = useParams();
  const courseId = params.id;
  
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/classes" className="hover:underline">Classes</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href={`/classes/${courseId}`} className="hover:underline">Course Details</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Add Content</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Add Content to Bucket</h1>
        <p className="text-muted-foreground mt-1">Configure and add new content to a specific payment bucket.</p>
      </header>

      <AddContentForm />
    </div>
  );
}

export default function AddContentPage() {
    return <AddContentPageContent />;
}
