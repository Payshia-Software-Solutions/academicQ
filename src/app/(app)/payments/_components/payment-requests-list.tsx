
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Building, GitBranch, Info, Calendar } from 'lucide-react';

interface PaymentRequest {
    id: string;
    student_number: string;
    slip_url: string;
    payment_amount: string;
    bank: string;
    branch: string;
    ref: string;
    request_status: string;
    created_at: string;
    course_name?: string;
    course_bucket_name?: string;
}

export function PaymentRequestsList() {
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchPaymentRequests() {
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
        }
        fetchPaymentRequests();
    }, [toast]);
    
    const getFullImageUrl = (slipUrl: string) => {
        if (!slipUrl) return '';
        if (slipUrl.startsWith('http')) return slipUrl;
        const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL || '';
        return `${baseUrl}${slipUrl.replace(/^http:\/\/[^/]+/, '')}`;
    };

    return (
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
                            ) : requests.length > 0 ? (
                                requests.map((req) => (
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
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm"><Eye className="mr-2 h-4 w-4" />View</Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Request Details (#{req.id})</DialogTitle>
                                                        <DialogDescription>
                                                            Full details for the payment request.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-2 py-4 text-sm">
                                                        {req.slip_url && (
                                                            <div className="flex justify-center mb-4">
                                                                <Image 
                                                                    src={getFullImageUrl(req.slip_url)} 
                                                                    alt={`Slip for ${req.student_number}`}
                                                                    width={200}
                                                                    height={280}
                                                                    className="rounded-md object-contain"
                                                                />
                                                            </div>
                                                        )}
                                                         <div className="flex justify-between p-2 rounded-md bg-muted">
                                                            <span className="text-muted-foreground">Student:</span>
                                                            <span className="font-semibold">{req.student_number}</span>
                                                        </div>
                                                         <div className="flex justify-between p-2 rounded-md bg-muted">
                                                            <span className="text-muted-foreground">Amount:</span>
                                                            <span className="font-semibold">${parseFloat(req.payment_amount).toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between p-2 rounded-md bg-muted">
                                                            <span className="text-muted-foreground">Course:</span>
                                                            <span className="font-semibold text-right">{req.course_name || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between p-2 rounded-md bg-muted">
                                                            <span className="text-muted-foreground">Bucket:</span>
                                                            <span className="font-semibold text-right">{req.course_bucket_name || 'N/A'}</span>
                                                        </div>
                                                        <div className="p-3 rounded-md border space-y-2">
                                                            <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" /> <span>{req.bank} - {req.branch}</span></div>
                                                            <div className="flex items-center gap-2"><Info className="h-4 w-4 text-muted-foreground" /> <span>{req.ref}</span></div>
                                                            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>{format(new Date(req.created_at), 'PP p')}</span></div>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
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
            </CardContent>
        </Card>
    );
}
