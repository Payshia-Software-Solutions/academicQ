import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AddClassForm } from './_components/add-class-form';
import { Suspense } from 'react';
import { Preloader } from '@/components/ui/preloader';

export default function AddClassPage() {
  return (
    <Suspense fallback={<Preloader />}>
      <div className="space-y-6">
        <header>
          <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
              <Link href="/classes" className="hover:underline">Classes</Link>
              <ChevronRight className="h-4 w-4 mx-1" />
              <span>Add Class</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Create a New Class</h1>
          <p className="text-muted-foreground mt-1">Fill in the details below to create a new course offering.</p>
        </header>

        <AddClassForm />

      </div>
    </Suspense>
  );
}
