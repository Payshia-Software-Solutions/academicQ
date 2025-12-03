
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Plus, Folder, List, FileText, Clock, Loader2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";


interface Course {
  id: string;
  course_name: string;
  description: string;
}

interface Content {
    id: string;
    content_title: string;
    content_type: string;
}

interface Assignment {
    id: string;
    content_title: string;
    content_type: string;
    submition_count?: string;
}

interface Bucket {
  id: string;
  bucket_name: string;
  description: string;
  payment_amount: string;
  payment_type: string;
  is_active: string;
  contents: Content[];
  assignments: Assignment[];
}

interface CurrentUser {
  user_status: 'admin' | 'student';
  id?: number;
  student_number?: string;
  [key: string]: any;
}

interface StudentPayment {
    id: string;
    course_bucket_id: string;
    status: string;
}


async function getCourseDetails(id: string): Promise<Course | null> {
    try {
        const response = await api.get(`/courses`);
        if (response.data.status !== 'success') return null;
        return response.data.data.find((c: any) => c.id.toString() === id.toString());
    } catch (error) {
        console.error("Failed to fetch course details:", error);
        return null;
    }
}

async function getCourseBuckets(id: string): Promise<Bucket[]> {
    try {
        const response = await api.get(`/course_buckets/course/${id}`);
        if (response.data.status !== 'success') return [];
        return response.data.data || [];
    } catch (error) {
        console.error("Failed to fetch course buckets:", error);
        return [];
    }
}

async function getStudentPayments(studentNumber: string): Promise<StudentPayment[]> {
    try {
        const response = await api.get(`/student_payment_courses/student/${studentNumber}`);
        if (response.data.status === 'success') {
            return response.data.data || [];
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch student payments:", error);
        return [];
    }
}


export default function ClassDetailsPage({ params }: { params: { id: string } }) {
    const [course, setCourse] = useState<Course | null>(null);
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null);
    const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);
    const [studentPayments, setStudentPayments] = useState<StudentPayment[]>([]);
    const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
             setIsCheckingEnrollment(false);
        }

        async function loadData() {
            setLoading(true);
            const [courseData, bucketsData] = await Promise.all([
                getCourseDetails(params.id),
                getCourseBuckets(params.id),
            ]);
            setCourse(courseData);
            setBuckets(bucketsData);
            setLoading(false);
        }
        loadData();
    }, [params.id]);

    useEffect(() => {
        if (user?.user_status === 'student' && user.student_number && course?.id) {
            const checkEnrollmentAndPayments = async () => {
                setIsCheckingEnrollment(true);
                try {
                    const [enrollmentRes, paymentsRes] = await Promise.all([
                        api.get(`/enrollments/?student_id=${user.student_number}&course_id=${course.id}`),
                        getStudentPayments(user.student_number as string)
                    ]);

                    if (enrollmentRes.data && enrollmentRes.data.length > 0) {
                        setEnrollmentStatus(enrollmentRes.data[0].status);
                    } else {
                        setEnrollmentStatus(null);
                    }
                    setStudentPayments(paymentsRes);
                } catch (error) {
                    setEnrollmentStatus(null);
                    setStudentPayments([]);
                    console.error("Failed to check enrollment status or payments:", error);
                } finally {
                    setIsCheckingEnrollment(false);
                }
            };
            checkEnrollmentAndPayments();
        } else {
             setIsCheckingEnrollment(false);
        }
    }, [user, course]);


    const handleEnroll = async () => {
        if (!user || !course || !user.student_number) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'User information is missing. Please log in again.'
            });
            return;
        }


        setIsEnrolling(true);
        try {
            const enrollmentData = {
                student_id: user.student_number,
                course_id: parseInt(course.id),
                enrollment_date: new Date().toISOString().split('T')[0],
                status: 'pending'
            };

            const response = await api.post('/enrollments', enrollmentData);
            
            if (response.status === 201 || response.status === 200) {
                 toast({
                    title: 'Enrollment Submitted',
                    description: `Your request to enroll in "${course.course_name}" has been sent.`,
                });
                setEnrollmentStatus('pending'); // Update status locally
                setIsEnrollmentDialogOpen(false);
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Enrollment Failed',
                    description: response.data.message || 'Could not complete the enrollment process.',
                });
            }
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Enrollment Failed',
                description: error.response?.data?.message || 'Could not complete the enrollment process.',
            });
        } finally {
            setIsEnrolling(false);
        }
    };


    const isAdmin = user?.user_status === 'admin';

    const allAssignments = useMemo(() => {
        return buckets.flatMap(bucket => bucket.assignments || []);
    }, [buckets]);

    if (loading) {
        return (
             <div className="space-y-6">
                <header>
                    <Skeleton className="h-6 w-1/4 mb-4" />
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <Skeleton className="h-10 w-1/2 mb-2" />
                            <Skeleton className="h-5 w-3/4" />
                        </div>
                        <Skeleton className="h-10 w-36" />
                    </div>
                </header>
                <section>
                    <Skeleton className="h-8 w-1/3 mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </section>
            </div>
        );
    }

  if (!course) {
    notFound();
  }

  const renderEnrollmentButton = () => {
    if (isCheckingEnrollment) {
        return <Skeleton className="h-10 w-36" />;
    }

    if (enrollmentStatus) {
        return (
            <Badge 
                variant={enrollmentStatus === 'pending' || enrollmentStatus === 'rejected' ? 'destructive' : 'secondary'} 
                className="flex items-center gap-2 capitalize text-base"
            >
                <Clock className="h-4 w-4" />
                Status: {enrollmentStatus}
            </Badge>
        );
    }

    return (
        <Dialog open={isEnrollmentDialogOpen} onOpenChange={setIsEnrollmentDialogOpen}>
            <DialogTrigger asChild>
                <Button>Enroll Now</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Enrollment</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to send an enrollment request for {'"'}
                        <span className="font-semibold">{course?.course_name}</span>{'"'}?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleEnroll} disabled={isEnrolling}>
                        {isEnrolling ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending Request...
                            </>
                        ) : (
                            'Confirm Enrollment'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
  };
  
    const canViewContent = isAdmin || enrollmentStatus === 'approved';

  return (
    <div className="space-y-8">
       <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/classes" className="hover:underline">Classes</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="truncate">{course.course_name}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">{course.course_name}</h1>
                <p className="text-muted-foreground mt-1">{course.description}</p>
            </div>
            {isAdmin ? (
                <Button asChild>
                    <Link href={`/classes/${params.id}/create-bucket?name=${encodeURIComponent(course.course_name)}&description=${encodeURIComponent(course.description)}`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Bucket
                    </Link>
                </Button>
            ) : (
                renderEnrollmentButton()
            )}
        </div>
      </header>

      {canViewContent && (
        <>
            <section>
                <h2 className="text-xl font-bold mb-4">Payment Buckets</h2>
                {buckets.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {buckets.map((bucket: any) => {
                            const totalContent = bucket.contents?.length || 0;
                            const totalAssignments = bucket.assignments?.length || 0;
                            
                            const isPaid = !isAdmin && studentPayments.some(p => p.course_bucket_id === bucket.id && p.status === 'approved');

                            return (
                                <Link href={`/classes/${course.id}/buckets/${bucket.id}`} key={bucket.id} className="block group">
                                    <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <Folder className="h-10 w-10 text-primary" />
                                                {isAdmin ? (
                                                    <Badge variant={bucket.is_active === "1" ? 'secondary' : 'destructive'}>
                                                        {bucket.is_active === "1" ? "Active" : "Inactive"}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant={isPaid ? 'secondary' : 'destructive'}>
                                                        {isPaid ? "Paid" : "Not Paid"}
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <h3 className="font-semibold text-lg truncate group-hover:text-primary">{bucket.bucket_name}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{bucket.description}</p>
                                        </CardContent>
                                        <CardFooter className="flex-col items-start text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <List className="h-3 w-3" />
                                                <span>{totalContent} content item(s)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-3 w-3" />
                                                <span>{totalAssignments} assignment(s)</span>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            )
                            })}
                        </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No payment buckets found for this course.</p>
                        {isAdmin && (
                            <Button variant="outline" className="mt-4" asChild>
                                <Link href={`/classes/${params.id}/create-bucket?name=${encodeURIComponent(course.course_name)}&description=${encodeURIComponent(course.description)}`}>
                                    Create the First Bucket
                                </Link>
                            </Button>
                        )}
                    </div>
                )}
            </section>
            
            <section>
                <Card>
                    <CardHeader>
                        <CardTitle>All Assignments</CardTitle>
                        <CardDescription>{allAssignments.length} assignment(s) found for this course.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {allAssignments.length > 0 ? (
                            <ul className="space-y-3">
                                {allAssignments.map((assignment) => (
                                    <li key={assignment.id}>
                                        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-4">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="p-2 bg-accent/10 rounded-lg">
                                                    <FileText className="h-5 w-5 text-accent" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold truncate">{assignment.content_title}</p>
                                                    <Badge variant="outline" className="capitalize mt-1">{assignment.content_type}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">No assignments found for this course.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </>
      )}
    </div>
  );
}

    
