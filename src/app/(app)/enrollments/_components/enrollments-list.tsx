
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Loader2 } from 'lucide-react';

interface Enrollment {
    id: string;
    student_id: string;
    course_id: string;
    enrollment_date: string | null;
    status: 'pending' | 'approved' | 'rejected' | null;
    created_at: string;
}

const statusOptions: Enrollment['status'][] = ['pending', 'approved', 'rejected'];

export function EnrollmentsList() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchEnrollments() {
            setIsLoading(true);
            try {
                const response = await api.get('/enrollments');
                if (response.data) {
                    setEnrollments(response.data || []);
                } else {
                    setEnrollments([]);
                }
            } catch (error: any) {
                setEnrollments([]);
                toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch enrollments.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchEnrollments();
    }, [toast]);

    const handleStatusChange = async (enrollmentId: string, newStatus: Enrollment['status']) => {
        if (!newStatus) return;
        setUpdatingStatus(enrollmentId);

        const originalEnrollments = [...enrollments];
        setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, status: newStatus } : e));

        try {
            const response = await api.put(`/enrollments/${enrollmentId}`, { status: newStatus });
             if (response.data.message !== 'Enrollment updated successfully.') {
                throw new Error(response.data.message || 'Failed to update status.');
            }
            toast({
                title: 'Status Updated',
                description: `Enrollment #${enrollmentId} status set to ${newStatus}.`,
            });
        } catch (error: any) {
            setEnrollments(originalEnrollments);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'Could not update enrollment status.',
            });
        } finally {
            setUpdatingStatus(null);
        }
    };
    
    const StatusBadge = ({ status }: { status: Enrollment['status']}) => {
        const statusMap = {
            pending: { variant: 'outline', text: 'Pending' },
            approved: { variant: 'secondary', text: 'Approved' },
            rejected: { variant: 'destructive', text: 'Rejected' },
        };
        const currentStatus = status && statusMap[status] ? statusMap[status] : { variant: 'outline', text: 'N/A' };
        
        return (
            <Badge variant={currentStatus.variant as any} className="capitalize">{currentStatus.text}</Badge>
        )
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>All Enrollment Requests</CardTitle>
                <CardDescription>
                    A list of all student enrollment requests.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Enrollment ID</TableHead>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Course ID</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Request Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5}>
                                            <Skeleton className="h-8 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : enrollments.length > 0 ? (
                                enrollments.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-mono text-xs">#{req.id}</TableCell>
                                        <TableCell>{req.student_id}</TableCell>
                                        <TableCell>{req.course_id}</TableCell>
                                         <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="flex items-center gap-1" disabled={updatingStatus === req.id}>
                                                        {updatingStatus === req.id 
                                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                                            : <StatusBadge status={req.status} />
                                                        }
                                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {statusOptions.map(status => (
                                                        <DropdownMenuItem 
                                                            key={status} 
                                                            onSelect={() => handleStatusChange(req.id, status)}
                                                            disabled={req.status === status}
                                                            className="capitalize"
                                                        >
                                                          {status}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                        <TableCell className="text-xs">{format(new Date(req.created_at), 'PP p')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No enrollment requests found.
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
