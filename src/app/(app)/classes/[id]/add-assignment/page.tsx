
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import { SelectContentForAssignment } from './_components/select-content-for-assignment';

function AddAssignmentContentPage() {
  const params = useParams();
  const courseId = params.id as string;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/classes" className="hover:underline">Classes</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href={`/classes/${courseId}`} className="hover:underline">Course Details</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Add Assignment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Add New Assignment</h1>
        <p className="text-muted-foreground mt-1">First, select the content this assignment will be associated with.</p>
      </header>
      <SelectContentForAssignment courseId={courseId} />
    </div>
  );
}

export default function AddAssignmentPage() {
    return <AddAssignmentContentPage />;
}
