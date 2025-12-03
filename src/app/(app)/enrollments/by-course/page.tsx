
import { EnrollmentsByCourseList } from './_components/enrollments-by-course-list';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function EnrollmentsByCoursePage() {
  return (
    <div className="space-y-6">
      <header>
         <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/enrollments" className="hover:underline">Enrollments</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>By Course</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Enrollments by Course</h1>
        <p className="text-muted-foreground mt-1">Review and manage enrollments filtered by a specific course.</p>
      </header>

      <EnrollmentsByCourseList />

    </div>
  );
}
