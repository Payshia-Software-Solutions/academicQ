
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
import { BookOpen, Users, Inbox, Loader2 } from 'lucide-react';


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
    course_id: string;
    course_bucket_id: string;
}

interface Course {
  id: string;
  course_name: string;
}

interface Bucket {
  id: string;
  bucket_name: string;
  course_id: string;
}

interface Student {
  id: string;
  student_number: string;
  f_name: string;
  l_name: string;
}

export function FilteredPaymentRequestsList() {
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const [courses, setCourses] = useState<Course[]>([]);
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedBucket, setSelectedBucket] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState('all');
    const [filterTrigger, setFilterTrigger] = useState(0);

    const getFullImageUrl = (slipUrl: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL;
        return `${baseUrl}${slipUrl}`;
    }

    useEffect(() => {
        async function fetchFilters() {
            try {
                const [coursesRes, bucketsRes, studentsRes] = await Promise.all([
                    api.get('/courses'),
                    api.get('/course_buckets'),
                    api.get('/users?status=student')
                ]);
                setCourses(coursesRes.data.data || []);
                setBuckets(bucketsRes.data.data || []);
                setStudents(studentsRes.data.data || []);
            } catch(e) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load filter options.' });
            }
        }
        fetchFilters();
    }, [toast]);
    

    useEffect(() => {
        async function fetchPaymentRequests() {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedStudent !== 'all') params.append('student_number', selectedStudent);
                if (selectedCourse !== 'all') params.append('course_id', selectedCourse);
                if (selectedBucket !== 'all') params.append('course_bucket_id', selectedBucket);
                
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
        }
        fetchPaymentRequests();
    }, [toast, filterTrigger, selectedCourse, selectedBucket, selectedStudent]);

    const handleApplyFilters = () => {
        setFilterTrigger(prev => prev + 1);
    };

    const filteredBuckets = selectedCourse === 'all' 
        ? buckets 
        : buckets.filter(b => b.course_id.toString() === selectedCourse.toString());


    return (
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
                            <SelectValue placeholder="Filter by course..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            {courses.map(course => (
                                <SelectItem key={course.id} value={course.id}>{course.course_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select value={selectedBucket} onValueChange={setSelectedBucket} disabled={filteredBuckets.length === 0}>
                        <SelectTrigger>
                            <Inbox className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filter by bucket..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Buckets</SelectItem>
                            {filteredBuckets.map(bucket => (
                                <SelectItem key={bucket.id} value={bucket.id}>{bucket.bucket_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleApplyFilters} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Apply Filters
                    </Button>
                </div>
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
                                    No payment requests found for the selected filters.
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
