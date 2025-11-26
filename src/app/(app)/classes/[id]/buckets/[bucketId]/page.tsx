
'use client';

import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { BucketContentList } from './_components/bucket-content-list';
import { Skeleton } from '@/components/ui/skeleton';

interface CurrentUser {
  user_status: 'admin' | 'student';
  [key: string]: any;
}

interface Course {
  id: string;
  course_name: string;
}
interface Bucket {
  id: string;
  name: string;
}

async function getCourseDetails(id: string): Promise<Course | null> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/courses`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.records.find((c: any) => c.id.toString() === id.toString());
    } catch (error) {
        return null;
    }
}

async function getBucketDetails(id: string): Promise<Bucket | null> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/course_buckets/${id}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.data;
    } catch (error) {
        return null;
    }
}


function BucketContentPageContent() {
  const params = useParams();
  const courseId = params.id as string;
  const bucketId = params.bucketId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [bucket, setBucket] = useState<Bucket | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);

   useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    async function loadData() {
        setLoading(true);
        const [courseData, bucketData] = await Promise.all([
            getCourseDetails(courseId),
            getBucketDetails(bucketId),
        ]);
        setCourse(courseData);
        setBucket(bucketData);
        setLoading(false);
    }
    loadData();
  }, [courseId, bucketId]);

  const isAdmin = user?.user_status === 'admin';
  
  if (loading) {
      return (
          <div className="space-y-6">
              <header>
                <Skeleton className="h-6 w-3/4 mb-4" />
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <Skeleton className="h-10 w-1/2 mb-2" />
                        <Skeleton className="h-5 w-3/4" />
                    </div>
                    <Skeleton className="h-10 w-36" />
                </div>
              </header>
              <Skeleton className="h-96 w-full" />
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/classes" className="hover:underline">Classes</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href={`/classes/${courseId}`} className="hover:underline">{course?.course_name || 'Course'}</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="truncate">{bucket?.name || 'Bucket'}</span>
        </div>
         <div className="flex items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">{bucket?.name}</h1>
                <p className="text-muted-foreground mt-1">Content available in this payment bucket.</p>
            </div>
            {isAdmin && (
                <Button asChild>
                    <Link href={`/classes/${courseId}/buckets/${bucketId}/add-content`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Content
                    </Link>
                </Button>
            )}
        </div>
      </header>
      
      <BucketContentList courseId={courseId} bucketId={bucketId} />

    </div>
  );
}

export default function BucketContentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BucketContentPageContent />
        </Suspense>
    )
}
