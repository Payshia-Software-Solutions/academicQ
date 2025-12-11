

'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { EditClassForm } from './_components/edit-class-form';
import { useParams } from 'next/navigation';

export default function EditClassPage() {
    const params = useParams();
    const classId = params.id as string;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/classes" className="hover:underline">Classes</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Edit Class</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Edit Class</h1>
        <p className="text-muted-foreground mt-1">Update the details for this course offering.</p>
      </header>

      <EditClassForm classId={classId} />

    </div>
  );
}
