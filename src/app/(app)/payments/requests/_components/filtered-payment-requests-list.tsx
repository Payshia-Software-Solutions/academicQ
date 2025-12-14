
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Inbox, Loader2, Eye, Building, GitBranch, Info, Calendar, CheckCircle, ZoomIn, ZoomOut, RotateCcw, Package, CreditCard, Hash } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { CoursePaymentForm } from '../../course-payment/_components/course-payment-form';


interface PaymentRequest {
    id: string;
    student_number: string;
    slip_url: string;
    payment_amount: string;
    bank: string;
    branch: string;
    ref: string;
    request_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    course_id: string;
    course_bucket_id: string;
    course_name?: string;
    course_bucket_name?: string;
    payment_status: 'course_fee' | 'study_pack';
    ref_id: string;
}

interface Course {
  id: string;
  course_name: string;
}

interface Bucket {
  id: string;
  bucket_name: string;
  name?: string;
  course_id: string;
}

interface Student {
  id: string;
  student_number: string;
  f_name: string;
  l_name: string;
}

const statusOptions: PaymentRequest['request_status'][] = ['pending', 'approved', 'rejected'];
const ROWS_PER_PAGE = 10;

export function FilteredPaymentRequestsList() {
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const [courses, setCourses] = useState<Course[]>([]);
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedBucket, setSelectedBucket] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState<PaymentRequest['request_status'] | 'all'>('all');
    const [filterTrigger, setFilterTrigger] = useState(0);

    const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);

    const getFullImageUrl = (slipUrl: string) => {
        if (!slipUrl) return '';
        const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL || '';
        if (/^https?:\/\//.test(slipUrl)) {
            return slipUrl;
        }
        if (slipUrl.includes('student-lms-ftp.payshia.com')) {
            return `https://${slipUrl.substring(slipUrl.indexOf('student-lms-ftp.payshia.com'))}`;
        }
        return `${baseUrl}${slipUrl}`;
    };

    const fetchFilters = async () => {
        try {
            const [coursesRes, studentsRes] = await Promise.all([
                api.get('/courses'),
                api.get('/users?status=student')
            ]);
            setCourses(coursesRes.data.data || []);
            setStudents(studentsRes.data.data || []);
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load filter options.' });
        }
    };
    
    useEffect(() => {
        if (!selectedCourse) {
            setBuckets([]);
            setSelectedBucket('all');
            return;
        }

        async function fetchBucketsForCourse() {
            try {
                const response = await api.get(`/courses/full/details/?id=${selectedCourse}`);
                if (response.data.status === 'success' && response.data.data.buckets) {
                    setBuckets(response.data.data.buckets.map((b: any) => ({ ...b, bucket_name: b.name })));
                } else {
                    setBuckets([]);
                }
            } catch(err) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load buckets for the selected course.'});
                setBuckets([]);
            } finally {
                setSelectedBucket('all');
            }
        }
        fetchBucketsForCourse();
    }, [selectedCourse, toast]);
    
    const fetchPaymentRequests = async () => {
        
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedStudent !== 'all') params.append('student_number', selectedStudent);
            if (selectedCourse) params.append('course_id', selectedCourse);
            if (selectedBucket && selectedBucket !== 'all') params.append('course_bucket_id', selectedBucket);
            if (selectedStatus !== 'all') params.append('request_status', selectedStatus);
            
            const response = await api.get(`/payment_requests/filter/?${params.toString()}`);
            
            if (response.data.status === 'success') {
                setRequests(response.data.data || []);
            } else {
                setRequests([]);
            }
        } catch (error: any) {
            setRequests([]);
            toast({
                variant: 'destructive',
                title: 'API Error',
                description: error.message || 'Could not fetch payment requests.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFilters();
    }, [toast]);
    
    useEffect(() => {
        if (filterTrigger > 0) {
            fetchPaymentRequests();
        }
    }, [toast, filterTrigger]);


    const handleApplyFilters = () => {
        setCurrentPage(1);
        setFilterTrigger(prev => prev + 1);
    };

    const handleViewDetails = (req: PaymentRequest) => {
        setSelectedRequest(req);
        setIsDetailsOpen(true);
        setZoom(1);
    }
    
    const handleProceed = () => {
        setIsDetailsOpen(false);
        setIsPaymentOpen(true);
    }

     const handlePaymentSuccess = async () => {
        setIsPaymentOpen(false);
        if (selectedRequest) {
            try {
                await api.put(`/payment_requests/update/status/?id=${selectedRequest.id}&status=approved`);
                toast({
                    title: 'Request Approved',
                    description: `Payment request #${selectedRequest.id} has been marked as approved.`,
                });
                fetchPaymentRequests();
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Approval Failed',
                    description: error.message || 'Could not update the payment request status.',
                });
            }
        }
        setSelectedRequest(null);
    }
    
    const hasAppliedFilters = filterTrigger > 0;
    
    const totalPages = Math.ceil(requests.length / ROWS_PER_PAGE);
    const paginatedRequests = requests.slice(
        (currentPage - 1) * ROWS_PER_PAGE,
        currentPage * ROWS_PER_PAGE
    );

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Filter Requests</CardTitle>
                    <CardDescription>
                        Use the dropdowns to filter the payment requests. Click "Apply" to see results.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                            <SelectTrigger>
                                <Users className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter by student..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Students</SelectItem>
                                {students.map(student => (
                                    <SelectItem key={student.id} value={student.student_number}>{student.f_name} {student.l_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                            <SelectTrigger>
                                <BookOpen className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Select a course..." />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map(course => (
                                    <SelectItem key={course.id} value={course.id}>{course.course_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedBucket} onValueChange={setSelectedBucket} disabled={buckets.length === 0 || !selectedCourse}>
                            <SelectTrigger>
                                <Inbox className="mr-2 h-4 w-4" />
                                <SelectValue placeholder={!selectedCourse ? 'Select course first' : 'Select a bucket...'} />
                            </SelectTrigger>
                            <SelectContent>
                                 <SelectItem value="all">All Buckets</SelectItem>
                                {buckets.map(bucket => (
                                    <SelectItem key={bucket.id} value={bucket.id}>{bucket.bucket_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val as any)}>
                            <SelectTrigger>
                                <Package className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter by status..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {statusOptions.map(status => (
                                    <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleApplyFilters} disabled={isLoading} className="lg:col-span-4">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Apply Filters
                        </Button>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                         {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i} className="p-4"><Skeleton className="h-24 w-full" /></Card>
                            ))
                         ) : paginatedRequests.length > 0 ? (
                            paginatedRequests.map((req) => (
                                <Card key={req.id}>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{req.student_number}</p>
                                                <p className="text-xs text-muted-foreground">{req.course_name}</p>
                                            </div>
                                            <Badge variant={req.request_status === 'approved' ? 'secondary' : req.request_status === 'rejected' ? 'destructive' : 'outline'} className="capitalize">{req.request_status}</Badge>
                                        </div>
                                         <div className="mt-2 text-xs text-muted-foreground">
                                            <Badge variant="outline" className="capitalize">{req.payment_status?.replace('_', ' ')}</Badge>
                                        </div>
                                        <div className="flex justify-between items-end mt-4">
                                            <div className="text-sm">
                                                <p className="font-bold text-lg">${parseFloat(req.payment_amount).toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(req.created_at), 'PP p')}</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(req)}>
                                                <Eye className="mr-2 h-4 w-4"/>View
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                         ) : (
                             <p className="text-center text-muted-foreground py-10">
                                {hasAppliedFilters ? 'No requests found for the selected filters.' : 'Please apply filters to see results.'}
                             </p>
                         )}
                    </div>
                    
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Request ID</TableHead>
                                    <TableHead>Student No.</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Bucket</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Req Status</TableHead>
                                    <TableHead>Payment For</TableHead>
                                    <TableHead>Ref ID</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={9}>
                                                <Skeleton className="h-8 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : paginatedRequests.length > 0 ? (
                                    paginatedRequests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-mono text-xs">#{req.id}</TableCell>
                                            <TableCell>{req.student_number}</TableCell>
                                            <TableCell>{req.course_name || 'N/A'}</TableCell>
                                            <TableCell>{req.course_bucket_name || 'N/A'}</TableCell>
                                            <TableCell>${parseFloat(req.payment_amount).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant={req.request_status === 'approved' ? 'secondary' : req.request_status === 'rejected' ? 'destructive' : 'outline'} className="capitalize">{req.request_status}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">{req.payment_status?.replace('_', ' ')}</Badge>
                                            </TableCell>
                                            <TableCell>{req.ref_id || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(req)}><Eye className="mr-2 h-4 w-4" />View</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                        {hasAppliedFilters ? 'No payment requests found for the selected filters.' : 'Please apply filters to see results.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        >
                        Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages > 0 ? totalPages : 1}
                        </span>
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        >
                        Next
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                 {selectedRequest && (
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Request Details (#{selectedRequest.id})</DialogTitle>
                            <DialogDescription>
                                Full details for the payment request.
                            </DialogDescription>
                        </DialogHeader>
                         <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 py-4 max-h-[70vh] overflow-y-auto px-1">
                             <div className="space-y-2">
                                {selectedRequest.slip_url && (
                                    <div className="relative w-full h-[450px] bg-muted rounded-lg overflow-hidden border">
                                        <Image 
                                            src={getFullImageUrl(selectedRequest.slip_url)} 
                                            alt={`Slip for ${selectedRequest.student_number}`}
                                            fill
                                            className="transition-transform duration-300"
                                            style={{objectFit: "contain", transform: `scale(${zoom})`}}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center justify-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => setZoom(1)}>
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(3, z + 0.2))}>
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between p-2 rounded-md bg-muted">
                                    <span className="text-muted-foreground">Student:</span>
                                    <span className="font-semibold">{selectedRequest.student_number}</span>
                                </div>
                                <div className="flex justify-between p-2 rounded-md bg-muted">
                                    <span className="text-muted-foreground">Amount:</span>
                                    <span className="font-semibold">${parseFloat(selectedRequest.payment_amount).toFixed(2)}</span>
                                </div>
                                 <div className="flex justify-between p-2 rounded-md bg-muted">
                                    <span className="text-muted-foreground">Course:</span>
                                    <span className="font-semibold text-right">{selectedRequest.course_name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between p-2 rounded-md bg-muted">
                                    <span className="text-muted-foreground">Bucket:</span>
                                    <span className="font-semibold text-right">{selectedRequest.course_bucket_name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-md bg-muted">
                                    <span className="text-muted-foreground">Payment For:</span>
                                    <Badge variant="outline" className="capitalize">{selectedRequest.payment_status?.replace('_', ' ')}</Badge>
                                </div>
                                 <div className="flex justify-between items-center p-2 rounded-md bg-muted">
                                    <span className="text-muted-foreground">Ref ID:</span>
                                    <span className="font-semibold">{selectedRequest.ref_id || 'N/A'}</span>
                                </div>
                                <div className="p-3 rounded-md border space-y-2">
                                     <h4 className="font-medium text-base border-b pb-1 mb-2">Bank Details</h4>
                                    <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" /> <span>{selectedRequest.bank} - {selectedRequest.branch}</span></div>
                                    <div className="flex items-center gap-2"><Info className="h-4 w-4 text-muted-foreground" /> <span>{selectedRequest.ref}</span></div>
                                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>{format(new Date(selectedRequest.created_at), 'PP p')}</span></div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                             {selectedRequest.request_status === 'pending' && (
                                <Button onClick={handleProceed}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Proceed to Payment
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                 )}
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent className="max-w-4xl">
                     <DialogHeader>
                        <DialogTitle>Create Student Payment</DialogTitle>
                        <DialogDescription>
                            Confirm the details to create a payment record for this request.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <CoursePaymentForm 
                            paymentRequest={selectedRequest}
                            onPaymentSuccess={handlePaymentSuccess}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
