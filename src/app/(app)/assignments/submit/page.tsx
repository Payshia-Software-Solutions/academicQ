
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AssignmentSubmissionForm } from './_components/assignment-submission-form';

export default function SubmitAssignmentPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/classes" className="hover:underline">Classes</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Submit Assignment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Submit Your Assignment</h1>
        <p className="text-muted-foreground mt-1">Fill in the details below to upload your assignment file.</p>
      </header>

      <AssignmentSubmissionForm />

    </div>
  );
}
