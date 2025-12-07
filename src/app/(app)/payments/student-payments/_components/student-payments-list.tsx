
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Inbox, Users } from 'lucide-react';

interface StudentPayment {
    id: string;
    course_id: string;
    course_bucket_id: string;
    student_number: string;
    payment_request_id: string | null;
    payment_amount: string;
    discount_amount: string | null;
    created_at: string;
    course_name: string | null;
    course_bucket_name: string | null;
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

export function StudentPaymentsList() {
    const [payments, setPayments] = useState<StudentPayment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const [courses, setCourses] = useState<Course[]>([]);
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedBucket, setSelectedBucket] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('all');

    useEffect(() => {
        async function fetchFilters() {
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
        fetchFilters();
    }, [toast]);
    
    useEffect(() => {
        if (!selectedCourse) {
            setBuckets([]);
            setSelectedBucket('');
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
                setSelectedBucket('');
            }
        }
        fetchBucketsForCourse();
    }, [selectedCourse, toast]);
    
    useEffect(() => {
        async function fetchPayments() {
            if (!selectedCourse || !selectedBucket) {
                setPayments([]);
                return;
            }
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedStudent !== 'all') params.append('student_number', selectedStudent);
                if (selectedCourse) params.append('course_id', selectedCourse);
                if (selectedBucket) params.append('course_bucket_id', selectedBucket);
                
                const response = await api.get(`/student-payment-courses/filter/?${params.toString()}`);
                
                if (response.data.status === 'success') {
                    setPayments(response.data.data || []);
                } else {
                    setPayments([]);
                }
            } catch (error: any) {
                setPayments([]);
                toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch payments.',
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchPayments();
    }, [toast, selectedCourse, selectedBucket, selectedStudent]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Filter Payments</CardTitle>
                <CardDescription>
                    Use the dropdowns to filter student payment records.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                            <SelectItem value="">Select a course</SelectItem>
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
                             <SelectItem value="">Select a bucket</SelectItem>
                            {buckets.map(bucket => (
                                <SelectItem key={bucket.id} value={bucket.id}>{bucket.bucket_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Payment ID</TableHead>
                                <TableHead>Student No.</TableHead>
                                <TableHead>Course</TableHead>
                                <TableHead>Bucket</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Discount</TableHead>
                                <TableHead>Date</TableHead>
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
                            ) : payments.length > 0 ? (
                                payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-mono text-xs">#{payment.id}</TableCell>
                                        <TableCell>{payment.student_number}</TableCell>
                                        <TableCell>{payment.course_name || 'N/A'}</TableCell>
                                        <TableCell>{payment.course_bucket_name || 'N/A'}</TableCell>
                                        <TableCell className="text-right font-semibold">${parseFloat(payment.payment_amount).toFixed(2)}</TableCell>
                                        <TableCell className="text-right text-green-600">${parseFloat(payment.discount_amount || '0').toFixed(2)}</TableCell>
                                        <TableCell className="text-xs">{format(new Date(payment.created_at), 'PP p')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    {selectedCourse && selectedBucket ? 'No payments found for the selected filters.' : 'Please select a course and bucket to view payments.'}
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

    
