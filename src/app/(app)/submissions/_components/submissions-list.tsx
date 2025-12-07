

'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Inbox, Users, Download, ChevronDown, Loader2, Edit, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Submission {
    id: string;
    student_number: string;
    course_bucket_id: string;
    assigment_id: string;
    file_path: string;
    grade: string | null;
    created_at: string;
    course_id: string;
    sub_status: 'submitted' | 'graded' | 'rejected' | null;
}

interface Course {
  id: string;
  course_name: string;
}
interface Bucket {
  id: string;
  name: string;
  course_id: string;
}
interface Student {
  id: string;
  student_number: string;
  name: string;
}
interface Assignment {
    id: string;
    content_title: string;
}

const statusOptions: Submission['sub_status'][] = ['submitted', 'graded', 'rejected'];


export function SubmissionsList() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const [courses, setCourses] = useState<Course[]>([]);
    const [courseBuckets, setCourseBuckets] = useState<Bucket[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);


    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedBucket, setSelectedBucket] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('all-students');
    const [selectedStatus, setSelectedStatus] = useState<Submission['sub_status'] | 'all'>('all');
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [currentGrade, setCurrentGrade] = useState('');
    const [updatingGrade, setUpdatingGrade] = useState<string | null>(null);


    useEffect(() => {
        async function fetchInitialData() {
            try {
                const [coursesRes, usersRes, assignmentsRes, approvedEnrollmentsRes] = await Promise.all([
                    api.get('/courses'),
                    api.get('/users'),
                    api.get('/assignments'),
                    api.get('/enrollments/?enroll_status=approved')
                ]);
                
                setCourses(coursesRes.data.data || []);
                setAssignments(assignmentsRes.data.data || []);
                
                const allUsers = usersRes.data.records || [];
                const approvedEnrollments = approvedEnrollmentsRes.data || [];
                const approvedStudentNumbers = new Set(approvedEnrollments.map((e: any) => e.student_id));
                
                const approvedStudents = allUsers.filter((u: any) => u.user_status === 'student' && u.student_number && approvedStudentNumbers.has(u.student_number));
                setStudents(approvedStudents);

            } catch (error) {
                toast({
                variant: 'destructive',
                title: 'Failed to load filters',
                description: 'Could not fetch initial data.',
                });
            }
        }
        fetchInitialData();
    }, [toast]);
    

    useEffect(() => {
        if (!selectedCourse) {
            setCourseBuckets([]);
            setSelectedBucket('');
            return;
        }

        async function fetchCourseBuckets() {
            try {
                const response = await api.get(`/courses/full/details/?id=${selectedCourse}`);
                if (response.data.status === 'success' && response.data.data.buckets) {
                    setCourseBuckets(response.data.data.buckets);
                } else {
                    setCourseBuckets([]);
                }
            } catch(error) {
                setCourseBuckets([]);
                 toast({
                    variant: 'destructive',
                    title: 'Failed to load buckets',
                    description: 'Could not fetch buckets for the selected course.',
                });
            } finally {
                setSelectedBucket('');
            }
        }

        fetchCourseBuckets();

    }, [selectedCourse, toast]);


    useEffect(() => {
        async function fetchSubmissions() {
            if (!selectedCourse || !selectedBucket) {
                setSubmissions([]);
                return;
            }
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedCourse) params.append('course_id', selectedCourse);
                if (selectedBucket) params.append('course_bucket_id', selectedBucket);
                if (selectedStudent && selectedStudent !== 'all-students') params.append('student_number', selectedStudent);
                if (selectedStatus && selectedStatus !== 'all') params.append('sub_status', selectedStatus);

                const response = await api.get(`/assignment-submissions/filter?${params.toString()}`);
                
                if (response.data.status === 'success') {
                    setSubmissions(response.data.data || []);
                } else {
                    setSubmissions([]);
                }
            } catch (error: any) {
                setSubmissions([]);
                toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch submissions.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchSubmissions();
    }, [toast, selectedCourse, selectedBucket, selectedStudent, selectedStatus]);

    const handleStatusChange = async (submissionId: string, newStatus: Submission['sub_status']) => {
        if (!newStatus) return;
        setUpdatingStatus(submissionId);

        const originalSubmissions = [...submissions];
        setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, sub_status: newStatus } : s));

        try {
            const response = await api.put(`/assignment-submissions/update/status/?id=${submissionId}&status=${newStatus}`);
            if (response.data.status !== 'success') {
                throw new Error(response.data.message || 'Failed to update status.');
            }
            toast({
                title: 'Status Updated',
                description: `Submission #${submissionId} status set to ${newStatus}.`,
            });
        } catch (error: any) {
            setSubmissions(originalSubmissions);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'Could not update submission status.',
            });
        } finally {
            setUpdatingStatus(null);
        }
    };
    
    const handleGradeUpdate = async (submissionId: string) => {
        if (!currentGrade) {
            toast({ variant: 'destructive', title: 'Grade cannot be empty.' });
            return;
        }
        setUpdatingGrade(submissionId);

        const originalSubmissions = [...submissions];
        setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, grade: currentGrade } : s));
        
        try {
            const response = await api.put(`/assignment-submissions/stu/update/grade/?id=${submissionId}&grade=${currentGrade}`);
            if (response.data.status !== 'success') {
                 throw new Error(response.data.message || 'Failed to update grade.');
            }
            toast({
                title: 'Grade Updated',
                description: `Submission #${submissionId} grade set to ${currentGrade}.`,
            });
            // Close popover by finding a better method if available
            document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

        } catch (error: any) {
            setSubmissions(originalSubmissions);
            toast({
                variant: 'destructive',
                title: 'Grade Update Failed',
                description: error.message,
            });
        } finally {
            setUpdatingGrade(null);
            setCurrentGrade('');
        }
    };


    const getFullUrl = (filePath: string) => {
       if (!filePath) return '#';
        const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL;
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }
        return `${baseUrl}${filePath}`;
    }

    const getStudentName = (studentNumber: string) => {
        return students.find(s => s.student_number === studentNumber)?.name || studentNumber;
    };
    const getCourseName = (courseId: string) => {
        return courses.find(c => c.id.toString() === courseId.toString())?.course_name || `Course #${courseId}`;
    };
    const getBucketName = (bucketId: string) => {
        return courseBuckets.find(b => b.id.toString() === bucketId.toString())?.name || `Bucket #${bucketId}`;
    };
    const getAssignmentTitle = (assignmentId: string) => {
        return assignments.find(a => a.id.toString() === assignmentId.toString())?.content_title || `Assignment #${assignmentId}`;
    }

    const StatusBadge = ({ status }: { status: Submission['sub_status']}) => {
        const statusMap = {
            submitted: { variant: 'outline', text: 'Submitted' },
            graded: { variant: 'secondary', text: 'Graded' },
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
                <CardTitle>Filter Submissions</CardTitle>
                <CardDescription>
                    Select filters to narrow down the list of submissions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                     <Select value={selectedBucket} onValueChange={setSelectedBucket} disabled={!selectedCourse || courseBuckets.length === 0}>
                        <SelectTrigger>
                            <Inbox className="mr-2 h-4 w-4" />
                            <SelectValue placeholder={!selectedCourse ? 'Select course first' : 'Select a bucket...'} />
                        </SelectTrigger>
                        <SelectContent>
                            {courseBuckets.map(bucket => (
                                <SelectItem key={bucket.id} value={bucket.id}>{bucket.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                        <SelectTrigger>
                            <Users className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filter by student..." />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all-students">All Students</SelectItem>
                            {students.map(student => (
                                <SelectItem key={student.id} value={student.student_number}>{student.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
                        <SelectTrigger>
                            <CheckSquare className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filter by status..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {statusOptions.map(status => (
                                <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Assignment</TableHead>
                                <TableHead>Submitted File</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}>
                                            <Skeleton className="h-8 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : submissions.length > 0 ? (
                                submissions.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell>
                                            <div className="font-medium">{getStudentName(sub.student_number)}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{sub.student_number}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{getAssignmentTitle(sub.assigment_id)}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {getCourseName(sub.course_id)} / {getBucketName(sub.course_bucket_id)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button asChild variant="outline" size="sm">
                                                <a href={getFullUrl(sub.file_path)} target="_blank" rel="noopener noreferrer">
                                                    <Download className="mr-2 h-3 w-3" />
                                                    Download
                                                </a>
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="flex items-center gap-1" disabled={updatingStatus === sub.id}>
                                                        {updatingStatus === sub.id 
                                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                                            : <StatusBadge status={sub.sub_status} />
                                                        }
                                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {statusOptions.map(status => (
                                                        <DropdownMenuItem 
                                                            key={status} 
                                                            onSelect={() => handleStatusChange(sub.id, status)}
                                                            disabled={sub.sub_status === status}
                                                            className="capitalize"
                                                        >
                                                          {status}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                        <TableCell>
                                            <Popover onOpenChange={(open) => !open && setCurrentGrade('')}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="sm" onClick={() => setCurrentGrade(sub.grade || '')}>
                                                        {sub.grade ? (
                                                            <>
                                                                <span className="font-semibold">{sub.grade}</span>
                                                                <Edit className="ml-2 h-3 w-3" />
                                                            </>
                                                        ) : 'Add Grade'}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-48">
                                                    <div className="grid gap-4">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium leading-none">Set Grade</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                Enter a grade for this submission.
                                                            </p>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor={`grade-${sub.id}`}>Grade</Label>
                                                            <Input
                                                                id={`grade-${sub.id}`}
                                                                value={currentGrade}
                                                                onChange={(e) => setCurrentGrade(e.target.value)}
                                                                className="h-8"
                                                            />
                                                        </div>
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => handleGradeUpdate(sub.id)}
                                                            disabled={updatingGrade === sub.id}
                                                        >
                                                             {updatingGrade === sub.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                             ) : 'Save'}
                                                        </Button>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </TableCell>
                                        <TableCell className="text-xs">{format(new Date(sub.created_at), 'PP p')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    {selectedCourse && selectedBucket ? 'No submissions found for the selected filters.' : 'Please select a course and bucket to view submissions.'}
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
