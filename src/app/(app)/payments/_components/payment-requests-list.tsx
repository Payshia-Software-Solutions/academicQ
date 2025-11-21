
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
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '');
        return `${baseUrl}${slipUrl}`;
    }

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
                                <TableHead>Slip</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Bank / Branch</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={8}>
                                            <Skeleton className="h-8 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : requests.length > 0 ? (
                                requests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-mono text-xs">#{req.id}</TableCell>
                                        <TableCell>{req.student_number}</TableCell>
                                        <TableCell>
                                            {req.slip_url && (
                                                <div className="relative h-10 w-10">
                                                    <Image 
                                                        src={getFullImageUrl(req.slip_url)} 
                                                        alt={`Slip for ${req.student_number}`}
                                                        fill
                                                        style={{ objectFit: 'cover' }}
                                                        className="rounded-md"
                                                    />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>${parseFloat(req.payment_amount).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{req.bank}</div>
                                            <div className="text-xs text-muted-foreground">{req.branch}</div>
                                        </TableCell>
                                        <TableCell>{req.ref}</TableCell>
                                        <TableCell>
                                            <Badge variant={req.request_status === 'approved' ? 'secondary' : 'destructive'} className="capitalize">{req.request_status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">{format(new Date(req.created_at), 'PP p')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
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
