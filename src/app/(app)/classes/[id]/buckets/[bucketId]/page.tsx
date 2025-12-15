

'use client';

import Link from 'next/link';
import { ChevronRight, Plus, DollarSign, Lock, Clock, AlertCircle, Info, Building, Eye, Trash2, Loader2, Wallet } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { BucketContentList } from './_components/bucket-content-list';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Preloader } from '@/components/ui/preloader';
import { BucketAssignmentsList } from './_components/bucket-assignments-list';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { PaymentSlipUploadForm } from './_components/payment-slip-upload-form';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { Dialog, DialogClose } from '@/components/ui/dialog';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
    payment_amount: string;
    bank: string;
    ref: string;
    created_at: string;
    slip_url: string;
    [key: string]: any;
}

interface BalanceDetails {
    course_bucket_price: string;
    total_pay_amount: number;
    balance: number;
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

async function getBalanceDetails(studentNumber: string, courseId: string, bucketId: string): Promise<BalanceDetails | null> {
    try {
        const response = await api.get(`/student-payment-courses/balance/?student_number=${studentNumber}&course_id=${courseId}&course_bucket_id=${bucketId}`);
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch balance details:", error);
        return null;
    }
}


function BucketContentPageContent() {
  const params = useParams();
  const courseId = params.id as string;
  const bucketId = params.bucketId as string;
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [bucket, setBucket] = useState<Bucket | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSlipDialogOpen, setIsSlipDialogOpen] = useState(false);
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [balance, setBalance] = useState<BalanceDetails | null>(null);


  const loadData = async () => {
        setLoading(true);
        const storedUser = localStorage.getItem('user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;
        setUser(currentUser);

        const [courseData, bucketData] = await Promise.all([
            getCourseDetails(courseId),
            getBucketDetails(bucketId),
        ]);
        setCourse(courseData);
        setBucket(bucketData);

        if (currentUser?.user_status === 'student' && currentUser.student_number && bucketData && courseData) {
            const [payments, requests, balanceData] = await Promise.all([
                getStudentPayments(currentUser.student_number, courseData.id, bucketData.id),
                getPaymentRequests(currentUser.student_number, courseData.id, bucketData.id),
                getBalanceDetails(currentUser.student_number, courseData.id, bucketData.id)
            ]);
            
            const hasApprovedPayment = requests.some(req => req.request_status === 'approved');
            const totalPaid = balanceData?.total_pay_amount ?? 0;
            
            // Unlock if there is any approved payment and some amount has been paid
            setIsPaid(hasApprovedPayment && totalPaid > 0);

            setPaymentRequests(requests.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            setBalance(balanceData);
        }

        setLoading(false);
    }
  
   useEffect(() => {
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

  const getFullFileUrl = (filePath: string) => {
    if (!filePath) return '#';
    const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL;
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }
    return `${baseUrl}${filePath}`;
  };

  const openSlipDialog = (slipUrl: string) => {
      setSelectedSlipUrl(slipUrl);
      setIsSlipDialogOpen(true);
  }
  
  const handleDeleteRequest = async (requestId: string) => {
      setIsDeleting(true);
      try {
        const response = await api.delete(`/payment_requests/${requestId}`);
        if (response.status === 200 || response.status === 204) {
             toast({
                title: "Request Deleted",
                description: "Your rejected payment request has been removed.",
            });
            // Refetch data to update the UI
            await loadData();
        } else {
            throw new Error(response.data.message || "Failed to delete request.");
        }
      } catch (error: any) {
           toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: error.message || "Could not delete the payment request.",
        });
      } finally {
          setIsDeleting(false);
      }
  }

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
      
      {!isAdmin && balance && (
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                      <Wallet />
                      Balance Summary
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div>
                          <p className="text-sm text-muted-foreground">Bucket Price</p>
                          <p className="text-xl font-bold">LKR {parseFloat(balance.course_bucket_price).toLocaleString()}</p>
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Total Paid</p>
                          <p className="text-xl font-bold text-green-600">LKR {balance.total_pay_amount.toLocaleString()}</p>
                      </div>
                      <div>
                          <p className={`text-xl font-bold ${balance.balance <= 0 ? 'text-green-600' : 'text-destructive'}`}>
                              LKR {Math.abs(balance.balance).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">{balance.balance <= 0 ? 'Paid' : 'Balance Due'}</p>
                      </div>
                  </div>
              </CardContent>
          </Card>
      )}

      {!isAdmin && !isPaid && (
          <div className="space-y-4">
            {pendingRequest && (
                <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Payment Pending Review</AlertTitle>
                    <AlertDescription>
                        Your payment for this bucket is currently under review. You will be notified once it is approved.
                         <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2 text-xs">
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground flex items-center gap-2"><DollarSign className="h-3 w-3" /> Amount</span>
                                <span className="font-mono">LKR {parseFloat(pendingRequest.payment_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground flex items-center gap-2"><Building className="h-3 w-3" /> Bank</span>
                                <span>{pendingRequest.bank}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground flex items-center gap-2"><Info className="h-3 w-3" /> Reference</span>
                                <span className="font-mono">{pendingRequest.ref}</span>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => openSlipDialog(pendingRequest.slip_url)}>
                            <Eye className="mr-2 h-4 w-4" /> View Submitted Slip
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
            {rejectedRequest && !pendingRequest && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Previous Payment Rejected</AlertTitle>
                    <AlertDescription>
                        Your previous payment attempt was rejected. You can delete this record and submit a new payment.
                        <div className="mt-4 p-4 bg-destructive/10 rounded-lg space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2"><DollarSign className="h-3 w-3" /> Amount</span>
                                <span className="font-mono">LKR {parseFloat(rejectedRequest.payment_amount).toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2"><Building className="h-3 w-3" /> Bank</span>
                                <span>{rejectedRequest.bank}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2"><Info className="h-3 w-3" /> Reference</span>
                                <span className="font-mono">{rejectedRequest.ref}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                             <Button variant="secondary" size="sm" onClick={() => openSlipDialog(rejectedRequest.slip_url)}>
                                <Eye className="mr-2 h-4 w-4" /> View Rejected Slip
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
                                        Delete Request
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete your rejected payment request. You will be able to submit a new one after this.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteRequest(rejectedRequest.id)} disabled={isDeleting}>
                                            {isDeleting ? "Deleting..." : "Confirm Delete"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
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
                                bucketAmount={balance && balance.balance > 0 ? String(balance.balance) : bucket?.payment_amount || '0'}
                                courseId={courseId}
                                bucketId={bucketId}
                                onSuccess={async () => {
                                    setIsPaymentDialogOpen(false);
                                    await loadData();
                                }}
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
      
      <Dialog open={isSlipDialogOpen} onOpenChange={setIsSlipDialogOpen}>
          <DialogContent className="max-w-lg">
              <DialogHeader>
                  <DialogTitle>Payment Slip</DialogTitle>
              </DialogHeader>
              <div className="mt-4 relative h-96 w-full bg-muted rounded-md overflow-hidden">
                  {selectedSlipUrl && (
                      <Image
                        src={getFullFileUrl(selectedSlipUrl)}
                        alt="Payment Slip"
                        fill
                        style={{ objectFit: 'contain' }}
                      />
                  )}
              </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BucketContentPage() {
    return <BucketContentPageContent />;
}

    
