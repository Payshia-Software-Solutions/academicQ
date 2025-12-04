
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function OrderStudyPackContent() {
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
            <span>Order</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Order Study Pack</h1>
        <p className="text-muted-foreground mt-1">Select the study packs you wish to order for this bucket.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Order Form</CardTitle>
          <CardDescription>This feature is coming soon. Check back later to order your study packs.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Study pack ordering will be available here.</p>
                 <Button variant="outline" className="mt-4" asChild>
                    <Link href={`/study-packs/${courseId}`}>
                       Back to Buckets
                    </Link>
                </Button>
            </div>
        </CardContent>
      </Card>
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
