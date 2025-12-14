
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface Enrollment {
    id: string;
    student_id: string;
    course_id: string;
    course_name: string;
    enrollment_date: string | null;
    status: 'pending' | 'approved' | 'rejected' | null;
    created_at: string;
}

const statusOptions: Enrollment['status'][] = ['pending', 'approved', 'rejected'];
const ROWS_PER_PAGE = 10;

export function EnrollmentsList() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const { toast } = useToast();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
    const [targetStatus, setTargetStatus] = useState<Enrollment['status'] | null>(null);
    const [currentPage, setCurrentPage] = useState(1);


    useEffect(() => {
        async function fetchEnrollments() {
            setIsLoading(true);
            try {
                const response = await api.get('/enrollments/?enroll_status=pending');
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

    const openConfirmationDialog = (enrollment: Enrollment, status: Enrollment['status']) => {
        setSelectedEnrollment(enrollment);
        setTargetStatus(status);
        setIsDialogOpen(true);
    }

    const handleStatusChange = async () => {
        if (!selectedEnrollment || !targetStatus) return;

        const enrollmentId = selectedEnrollment.id;
        const newStatus = targetStatus;

        setUpdatingStatus(enrollmentId);
        setIsDialogOpen(false);

        const originalEnrollments = [...enrollments];
        
        // Optimistically remove from UI if not 'pending' anymore
        if (newStatus !== 'pending') {
            setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
        } else {
            setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, status: newStatus } : e));
        }


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
            setSelectedEnrollment(null);
            setTargetStatus(null);
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

    const totalPages = Math.ceil(enrollments.length / ROWS_PER_PAGE);
    const paginatedEnrollments = enrollments.slice(
        (currentPage - 1) * ROWS_PER_PAGE,
        currentPage * ROWS_PER_PAGE
    );


    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>Pending Enrollment Requests</CardTitle>
                <CardDescription>
                    A list of all student enrollment requests awaiting approval.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Enrollment ID</TableHead>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Course</TableHead>
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
                            ) : paginatedEnrollments.length > 0 ? (
                                paginatedEnrollments.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-mono text-xs">#{req.id}</TableCell>
                                        <TableCell>{req.student_id}</TableCell>
                                        <TableCell>{req.course_name}</TableCell>
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
                                                            onSelect={() => openConfirmationDialog(req, status)}
                                                            disabled={req.status === status}
                                                            className="capitalize"
                                                        >
                                                          {status}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                        <TableCell className="text-xs">{req.created_at ? format(new Date(req.created_at), 'PP p') : 'N/A'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No pending enrollment requests found.
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Status Change</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to change the status of this enrollment?
                    </DialogDescription>
                </DialogHeader>
                {selectedEnrollment && (
                    <div className="space-y-4 py-4">
                        <div className="flex justify-between items-center p-3 rounded-md bg-muted">
                            <span className="text-sm text-muted-foreground">Student ID</span>
                            <span className="font-semibold">{selectedEnrollment.student_id}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-md bg-muted">
                             <span className="text-sm text-muted-foreground">Course</span>
                            <span className="font-semibold">{selectedEnrollment.course_name}</span>
                        </div>
                         <div className="flex justify-between items-center p-3 rounded-md border-2 border-dashed">
                             <span className="text-sm text-muted-foreground">New Status</span>
                            <Badge variant={targetStatus === 'approved' ? 'secondary' : targetStatus === 'rejected' ? 'destructive' : 'outline'} className="capitalize">
                                {targetStatus}
                            </Badge>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                        Cancel
                        </Button>
                    </DialogClose>
                    <Button type="button" onClick={handleStatusChange}>
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
