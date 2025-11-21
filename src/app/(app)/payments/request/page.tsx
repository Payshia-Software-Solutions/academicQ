
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PaymentRequestForm } from './_components/payment-request-form';

export default function PaymentRequestPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/payments" className="hover:underline">Payments</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Request Payment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Create a Payment Request</h1>
        <p className="text-muted-foreground mt-1">Select a student and specify the amount to request a payment.</p>
      </header>

      <PaymentRequestForm />

    </div>
  );
}
