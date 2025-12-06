
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { FilteredPaymentRequestsList } from './_components/filtered-payment-requests-list';

export default function FilteredPaymentRequestsPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/payments" className="hover:underline">Payments</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Filtered Requests</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Filter Payment Requests</h1>
        <p className="text-muted-foreground mt-1">Use the filters to view specific payment requests.</p>
      </header>

      <FilteredPaymentRequestsList />

    </div>
  );
}
