
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { StudentPaymentsList } from './_components/student-payments-list';

export default function StudentPaymentsPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/payments" className="hover:underline">Payments</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Student Payments</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Student Payments</h1>
        <p className="text-muted-foreground mt-1">Review and filter all student payment records.</p>
      </header>

      <StudentPaymentsList />

    </div>
  );
}

    