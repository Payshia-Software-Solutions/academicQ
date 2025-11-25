
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AddAssignmentForm } from './_components/add-assignment-form';

export default function AddAssignmentPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/classes" className="hover:underline">Classes</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Add Assignment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Create a New Assignment</h1>
        <p className="text-muted-foreground mt-1">Fill in the details below to create a new assignment.</p>
      </header>

      <AddAssignmentForm />

    </div>
  );
}

