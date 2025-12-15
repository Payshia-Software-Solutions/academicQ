
'use client';

import Link from 'next/link';
import { ChevronRight, Plus, DollarSign, Lock, Clock, AlertCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { BucketContentList } from './_components/bucket-content-list';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Preloader } from '@/components/ui/preloader';
import { BucketAssignmentsList } from './_components/bucket-assignments-list';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { PaymentSlipUploadForm } from './_components/payment-slip-upload-form';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface CurrentUser {
  user_status: 'admin' | 'student';
  student_number?: string;
  [key: string]: any;
}

interface Course {
  id: string;
  course_name: string;
}
interface Assignment {
    id: string;
    content_title: string;
    deadline_date?: string;
    content: string;
    course_id: string;
    course_bucket_id: string;
}
interface Bucket {
  id: string;
  name: string;
  payment_amount: string;
  assignments: Assignment[];
}

interface StudentPayment {
    id: string;
    course_bucket_id: string;
    status: string;
}

interface PaymentRequest {
    id: string;
    request_status: 'pending' | 'approved' | 'rejected';
    [key: string]: any;
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

async function getPaymentRequests(studentNumber: string, courseId: string, bucketId: string): Promise<PaymentRequest[]> {
    try {
        const response = await api.get(`/payment_requests/filter/?student_number=${studentNumber}&course_id=${courseId}&course_bucket_id=${bucketId}`);
        if (response.data.status === 'success') {
            return response.data.data || [];
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch payment requests:", error);
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
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  
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
            const [payments, requests] = await Promise.all([
                getStudentPayments(currentUser.student_number, courseData.id, bucketData.id),
                getPaymentRequests(currentUser.student_number, courseData.id, bucketData.id),
            ]);

            const hasPaid = payments.some(p => p.status === 'approved');
            setIsPaid(hasPaid);
            setPaymentRequests(requests);
        }

        setLoading(false);
    }
    if (courseId && bucketId) {
      loadData();
    }
  }, [courseId, bucketId]);

  const isAdmin = user?.user_status === 'admin';
  
  const pendingRequest = useMemo(() => 
    paymentRequests.find(req => req.request_status === 'pending'), 
  [paymentRequests]);

  const rejectedRequest = useMemo(() => 
    paymentRequests.find(req => req.request_status === 'rejected'), 
  [paymentRequests]);
  
  const canViewContent = isAdmin || isPaid;
  const showPaymentButton = !isAdmin && !canViewContent && !pendingRequest;

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
      
      {!isAdmin && !isPaid && (
          <div className="space-y-4">
            {pendingRequest && (
                <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Payment Pending</AlertTitle>
                    <AlertDescription>
                        Your payment for this bucket is currently under review. You will be notified once it is approved.
                    </AlertDescription>
                </Alert>
            )}
            {rejectedRequest && !pendingRequest && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Payment Rejected</AlertTitle>
                    <AlertDescription>
                        Your previous payment was rejected. Please review the details and submit a new payment.
                    </AlertDescription>
                </Alert>
            )}
          </div>
      )}

      {showPaymentButton && (
           <Card className="relative">
             <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4 text-center p-4">
                <Lock className="h-12 w-12 text-destructive" />
                <h3 className="text-xl font-bold">Content Locked</h3>
                <p className="text-muted-foreground">You must complete the payment for this bucket to view its content.</p>
                <AlertDialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Add Payment
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="sm:max-w-[425px]">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Upload Payment Slip</AlertDialogTitle>
                            <AlertDialogDescription>
                                To access this content, please upload your proof of payment.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4">
                            <PaymentSlipUploadForm 
                                bucketAmount={bucket?.payment_amount || '0'}
                                courseId={courseId}
                                bucketId={bucketId}
                                onSuccess={() => setIsPaymentDialogOpen(false)}
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Close</AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
             <CardHeader>
                <CardTitle>Bucket Content</CardTitle>
             </CardHeader>
            <CardContent>
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">This content is locked.</p>
                </div>
            </CardContent>
           </Card>
      )}

      {canViewContent && (
        <BucketContentList 
            courseId={courseId} 
            bucketId={bucketId} 
            isLocked={!canViewContent}
            bucketAmount={bucket?.payment_amount || '0'}
            isAdmin={isAdmin}
        />
      )}

      <BucketAssignmentsList
        courseId={courseId}
        bucketId={bucketId}
        assignments={bucket?.assignments || []}
        isLocked={!canViewContent}
        isAdmin={isAdmin}
      />
    </div>
  );
}

export default function BucketContentPage() {
    return <BucketContentPageContent />;
}
