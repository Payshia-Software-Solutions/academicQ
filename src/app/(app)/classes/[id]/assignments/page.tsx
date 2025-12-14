
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AllAssignmentsList } from './_components/all-assignments-list';
import { useParams } from 'next/navigation';

function AllAssignmentsPageContent() {
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
            <span>All Assignments</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">All Course Assignments</h1>
        <p className="text-muted-foreground mt-1">A complete list of all assignments for this course.</p>
      </header>

      <AllAssignmentsList courseId={courseId} />
    </div>
  );
}

export default function AllAssignmentsPage() {
    return <AllAssignmentsPageContent />;
}
