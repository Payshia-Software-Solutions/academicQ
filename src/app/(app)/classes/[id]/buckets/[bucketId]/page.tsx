
'use client';

import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { BucketContentList } from './_components/bucket-content-list';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Preloader } from '@/components/ui/preloader';
import { BucketAssignmentsList } from './_components/bucket-assignments-list';

interface CurrentUser {
  user_status: 'admin' | 'student';
  student_number?: string;
  [key: string]: any;
}

interface Course {
  id: string;
  course_name: string;
}
interface Bucket {
  id: string;
  name: string;
  payment_amount: string;
}

interface StudentPayment {
    id: string;
    course_bucket_id: string;
    status: string;
}

async function getCourseDetails(id: string): Promise<Course | null> {
    try {
        const response = await api.get(`/courses`);
        if (response.data.status !== 'success') return null;
        return response.data.data.find((c: any) => c.id.toString() === id.toString());
    } catch (error) {
        console.error("Failed to fetch course details:", error);
        return null;
    }
}

async function getBucketDetails(id: string): Promise<Bucket | null> {
    try {
        const response = await api.get(`/course_buckets/${id}`);
        if (!response.data || response.data.status !== 'success') return null;
        return { ...response.data.data, name: response.data.data.bucket_name };
    } catch (error) {
        console.error("Failed to fetch bucket details:", error);
        return null;
    }
}

async function getStudentPayments(studentNumber: string, courseId: string, bucketId: string): Promise<StudentPayment[]> {
    try {
        const response = await api.get(`/student-payment-courses/filter/?student_number=${studentNumber}&course_id=${courseId}&course_bucket_id=${bucketId}`);
        if (response.data.status === 'success') {
            return response.data.data || [];
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch student payments:", error);
        return [];
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
  const [isPaid, setIsPaid] = useState(false);
  
   useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(currentUser);

    async function loadData() {
        setLoading(true);
        const [courseData, bucketData] = await Promise.all([
            getCourseDetails(courseId),
            getBucketDetails(bucketId),
        ]);
        setCourse(courseData);
        setBucket(bucketData);

        if (currentUser?.user_status === 'student' && currentUser.student_number && bucketData && courseData) {
            const payments = await getStudentPayments(currentUser.student_number, courseData.id, bucketData.id);
            // Assuming any successful payment record means paid. A more robust check might be needed.
            const hasPaid = payments.length > 0;
            setIsPaid(hasPaid);
        }

        setLoading(false);
    }
    if (courseId && bucketId) {
      loadData();
    }
  }, [courseId, bucketId]);

  const isAdmin = user?.user_status === 'admin';
  const canViewContent = isAdmin || isPaid;
  
  if (loading) {
      return (
        <div className="space-y-6">
            <header>
                <Skeleton className="h-6 w-1/3" />
                <div className="flex items-center justify-between gap-4 mt-2">
                    <div>
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-4 w-80 mt-2" />
                    </div>
                     <Skeleton className="h-10 w-36" />
                </div>
            </header>
            <Preloader icon="book" />
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
      
      <BucketContentList 
        courseId={courseId} 
        bucketId={bucketId} 
        isLocked={!canViewContent}
        bucketAmount={bucket?.payment_amount || '0'}
        isAdmin={isAdmin}
       />

      <BucketAssignmentsList
        courseId={courseId}
        bucketId={bucketId}
        isLocked={!canViewContent}
        isAdmin={isAdmin}
      />
    </div>
  );
}

export default function BucketContentPage() {
    return <BucketContentPageContent />;
}
