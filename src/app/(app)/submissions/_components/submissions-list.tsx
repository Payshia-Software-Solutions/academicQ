
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
import { BookOpen, Inbox, Users, Link as LinkIcon, Download, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Submission {
    id: string;
    student_number: string;
    course_bucket_id: string;
    assigment_id: string;
    file_path: string;
    grade: string | null;
    created_at: string;
    course_id: string;
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

export function SubmissionsList() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const [courses, setCourses] = useState<Course[]>([]);
    const [allBuckets, setAllBuckets] = useState<Bucket[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);


    const [selectedCourse, setSelectedCourse] = useState('all-courses');
    const [selectedBucket, setSelectedBucket] = useState('all-buckets');
    const [selectedStudent, setSelectedStudent] = useState('all-students');

    useEffect(() => {
        async function fetchInitialData() {
            try {
                const [coursesRes, studentsRes, assignmentsRes, bucketsRes] = await Promise.all([
                    api.get('/courses'),
                    api.get('/users'),
                    api.get('/assignments'),
                    api.get('/course_buckets'), // Fetch all buckets
                ]);
                setCourses(coursesRes.data.records || []);
                setStudents(studentsRes.data.records.filter((u: any) => u.user_status === 'student' && u.student_number) || []);
                setAssignments(assignmentsRes.data.data || []);
                setAllBuckets(bucketsRes.data.data || []); // Store all buckets
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
    
    const courseBuckets = useMemo(() => {
        if (!selectedCourse || selectedCourse === 'all-courses') {
            return [];
        }
        return allBuckets.filter(b => b.course_id === selectedCourse);
    }, [selectedCourse, allBuckets]);


    useEffect(() => {
        async function fetchSubmissions() {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedCourse && selectedCourse !== 'all-courses') params.append('course_id', selectedCourse);
                if (selectedBucket && selectedBucket !== 'all-buckets') params.append('course_bucket_id', selectedBucket);
                if (selectedStudent && selectedStudent !== 'all-students') params.append('student_number', selectedStudent);

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
    }, [toast, selectedCourse, selectedBucket, selectedStudent]);
    
    const getFullUrl = (filePath: string) => {
       if (!filePath) return '#';
        // The file path from the API is already a full URL, so no need to prepend the base URL
        return filePath;
    }

    const getStudentName = (studentNumber: string) => {
        return students.find(s => s.student_number === studentNumber)?.name || studentNumber;
    };
    const getCourseName = (courseId: string) => {
        return courses.find(c => c.id.toString() === courseId.toString())?.course_name || `Course #${courseId}`;
    };
    const getBucketName = (bucketId: string) => {
        return allBuckets.find(b => b.id.toString() === bucketId.toString())?.name || `Bucket #${bucketId}`;
    };
    const getAssignmentTitle = (assignmentId: string) => {
        return assignments.find(a => a.id.toString() === assignmentId.toString())?.content_title || `Assignment #${assignmentId}`;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Filter Submissions</CardTitle>
                <CardDescription>
                    Select filters to narrow down the list of submissions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                     <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                        <SelectTrigger>
                            <BookOpen className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filter by course..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all-courses">All Courses</SelectItem>
                            {courses.map(course => (
                                <SelectItem key={course.id} value={course.id}>{course.course_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select value={selectedBucket} onValueChange={setSelectedBucket} disabled={!selectedCourse || selectedCourse === 'all-courses'}>
                        <SelectTrigger>
                            <Inbox className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filter by bucket..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all-buckets">All Buckets</SelectItem>
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
                </div>

                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Assignment</TableHead>
                                <TableHead>Submitted File</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Date</TableHead>
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
                                            <Badge variant={sub.grade ? 'secondary' : 'outline'}>{sub.grade || 'Not Graded'}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">{format(new Date(sub.created_at), 'PP p')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No submissions found for the selected filters.
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
