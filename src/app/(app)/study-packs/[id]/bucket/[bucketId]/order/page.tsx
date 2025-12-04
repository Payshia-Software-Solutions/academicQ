
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { OrderStudyPackForm } from './_components/order-study-pack-form';

function OrderStudyPackContent() {
  const params = useParams();
  const { id: courseId } = params;
  
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/study-packs" className="hover:underline">Study Packs</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href={`/study-packs/${courseId}`} className="hover:underline">Course</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Order</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Order Study Pack</h1>
        <p className="text-muted-foreground mt-1">Select the study packs you wish to order for this bucket.</p>
      </header>
      
      <OrderStudyPackForm />
      
    </div>
  );
}

export default function OrderStudyPackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OrderStudyPackContent />
        </Suspense>
    )
}
