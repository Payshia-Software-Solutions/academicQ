
import { OrdersList } from './_components/orders-list';
import { ListOrdered, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AllOrdersPage() {
  return (
    <div className="space-y-6">
      <header>
         <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/study-packs" className="hover:underline">Study Packs</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>All Orders</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground flex items-center gap-3">
            <ListOrdered />
            All Student Orders
        </h1>
        <p className="text-muted-foreground mt-1">Review and manage all student study pack orders.</p>
      </header>

      <OrdersList />

    </div>
  );
}
