
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Building, GitBranch, Info, Calendar, CheckCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { CoursePaymentForm } from '../../payments/course-payment/_components/course-payment-form';

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
}

const ROWS_PER_PAGE = 10;

export function PaymentRequestsList() {
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchPaymentRequests = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/payment_requests');
            if (response.data.status === 'success') {
                setRequests(response.data.data || []);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to load requests',
                    description: response.data.message || 'An unknown error occurred.',
                });
            }
        } catch (error: any) {
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
        fetchPaymentRequests();
    }, []);
    
    const getFullImageUrl = (slipUrl: string) => {
        if (!slipUrl) return '';
        const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL || '';
        // If slipUrl is already a full URL, don't prepend the base URL.
        if (/^https?:\/\//.test(slipUrl)) {
            return slipUrl;
        }
        // Special handling for malformed URLs from the API
        if (slipUrl.includes('student-lms-ftp.payshia.com')) {
            return `https://${slipUrl.substring(slipUrl.indexOf('student-lms-ftp.payshia.com'))}`;
        }
        return `${baseUrl}${slipUrl}`;
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
                fetchPaymentRequests(); // Refetch to update the list
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

    const totalPages = Math.ceil(requests.length / ROWS_PER_PAGE);
    const paginatedRequests = requests.slice(
        (currentPage - 1) * ROWS_PER_PAGE,
        currentPage * ROWS_PER_PAGE
    );


    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Payment Requests</CardTitle>
                    <CardDescription>
                        A list of all submitted payment requests from students.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Request ID</TableHead>
                                    <TableHead>Student No.</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Bucket</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={7}>
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
                                                <Badge variant={req.request_status === 'approved' ? 'secondary' : 'destructive'} className="capitalize">{req.request_status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(req)}><Eye className="mr-2 h-4 w-4" />View</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No payment requests found.
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
