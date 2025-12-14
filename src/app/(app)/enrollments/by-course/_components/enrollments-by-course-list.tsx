
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen } from 'lucide-react';

interface Enrollment {
    id: string;
    student_id: string;
    course_id: string;
    course_name: string;
    enrollment_date: string | null;
    status: 'pending' | 'approved' | 'rejected' | null;
    created_at: string;
}

interface Course {
  id: string;
  course_name: string;
}

const ROWS_PER_PAGE = 10;

export function EnrollmentsByCourseList() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingCourses, setIsFetchingCourses] = useState(true);
    const { toast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        async function fetchCourses() {
            setIsFetchingCourses(true);
            try {
                const response = await api.get('/courses');
                if (response.data.status === 'success' && Array.isArray(response.data.data)) {
                    setCourses(response.data.data || []);
                } else {
                    setCourses([]);
                }
            } catch (error: any) {
                 toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: 'Could not fetch courses.',
                });
                setCourses([]);
            } finally {
                setIsFetchingCourses(false);
            }
        }
        fetchCourses();
    }, [toast]);


    useEffect(() => {
        if (!selectedCourse) {
            setEnrollments([]);
            return;
        };

        async function fetchEnrollments() {
            setIsLoading(true);
            try {
                const response = await api.get(`/enrollments/?course_id=${selectedCourse}`);
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
                    description: error.message || 'Could not fetch enrollments for this course.',
                });
            } finally {
                setIsLoading(false);
                setCurrentPage(1);
            }
        }
        fetchEnrollments();
    }, [selectedCourse, toast]);
    
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
        <Card>
            <CardHeader>
                <CardTitle>Filter by Course</CardTitle>
                <CardDescription>
                    Select a course to view all associated enrollments.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-6 max-w-sm">
                    <Select onValueChange={setSelectedCourse} value={selectedCourse} disabled={isFetchingCourses}>
                        <SelectTrigger>
                            <BookOpen className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Select a course..." />
                        </SelectTrigger>
                        <SelectContent>
                            {courses.map(course => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.course_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
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
                                            <StatusBadge status={req.status} />
                                        </TableCell>
                                        <TableCell className="text-xs">{req.created_at ? format(new Date(req.created_at), 'PP p') : 'N/A'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    {selectedCourse ? 'No enrollments found for this course.' : 'Please select a course to see enrollments.'}
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
    );
}
