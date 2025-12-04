
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { ItemOrderForm } from './_components/item-order-form';

function OrderItemPageContent() {
  const params = useParams();
  const { id: courseId, bucketId } = params;
  
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/study-packs" className="hover:underline">Study Packs</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href={`/study-packs/${courseId}`} className="hover:underline">Course</Link>
             <ChevronRight className="h-4 w-4 mx-1" />
            <Link href={`/study-packs/${courseId}/bucket/${bucketId}`} className="hover:underline">Bucket</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Order</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Complete Your Order</h1>
        <p className="text-muted-foreground mt-1">Please confirm your delivery details below.</p>
      </header>
      
      <ItemOrderForm />
      
    </div>
  );
}

export default function OrderItemPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OrderItemPageContent />
        </Suspense>
    )
}
