
import { EnrollmentsList } from './_components/enrollments-list';

export default function EnrollmentsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Enrollments</h1>
        <p className="text-muted-foreground mt-1">Review and manage all student enrollment requests.</p>
      </header>

      <EnrollmentsList />

    </div>
  );
}
