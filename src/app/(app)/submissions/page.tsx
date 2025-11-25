
import { SubmissionsList } from './_components/submissions-list';

export default function SubmissionsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Assignment Submissions</h1>
        <p className="text-muted-foreground mt-1">Review and filter all student assignment submissions.</p>
      </header>

      <SubmissionsList />

    </div>
  );
}
