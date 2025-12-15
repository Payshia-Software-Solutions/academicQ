

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Plus, Folder, List, FileText, Clock, Loader2, Video, Edit, Trash2, Book, Eye } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import type { Plyr as PlyrInstance } from 'plyr';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Preloader } from "@/components/ui/preloader";


const Plyr = dynamic(() => import('plyr-react'), { ssr: false });

interface Course {
  id: string;
  course_name: string;
  description: string;
  intro_url?: string | null;
}

interface Content {
    id: string;
    content_title: string;
    content_type: string;
    content_id: string;
}

interface Assignment {
    id: string;
    content_title: string;
    content_type: string;
    submition_count?: string;
    courseId: string;
    bucketId: string;
    contentId: string;
    content_id?: string;
    course_bucket_id: string;
}

interface Bucket {
  id: string;
  name: string;
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
    status?: string; // from payment request
    payment_amount?: string; // from payment record
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

async function getStudentPayments(studentNumber: string, courseId: string, bucketId: string): Promise<StudentPayment[]> {
    try {
        const response = await api.get(`/student-payment-courses/filter/?student_number=${studentNumber}&course_id=${courseId}&course_bucket_id=${bucketId}`);
        if (response.data.status === 'success') {
            return response.data.data || [];
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch student payments:", error);
        return [];
    }
}

function getYouTubeId(url: string): string | null {
    if (!url) return null;
    let videoId = null;
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    if (match) {
        videoId = match[1];
    }
    return videoId;
}


export default function ClassDetailsPage() {
    const params = useParams();
    const courseId = params.id as string;
    const [course, setCourse] = useState<Course | null>(null);
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null);
    const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);
    const [studentPayments, setStudentPayments] = useState<Map<string, boolean>>(new Map());
    const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false);
    const playerRef = useRef<PlyrInstance | null>(null);
    const { toast } = useToast();
    
    const videoId = useMemo(() => getYouTubeId(course?.intro_url || ''), [course?.intro_url]);

    const allAssignments = useMemo(() => {
        return buckets.flatMap(bucket => 
            (bucket.assignments || []).map(assignment => ({
                ...assignment,
                courseId: courseId,
                bucketId: bucket.id,
                contentId: assignment.content_id || ''
            }))
        );
    }, [buckets, courseId]);


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
                getCourseDetails(courseId),
                getCourseBuckets(courseId),
            ]);
            setCourse(courseData);
            setBuckets(bucketsData);
            setLoading(false);
        }
        loadData();
    }, [courseId]);

    useEffect(() => {
        if (user?.user_status === 'student' && user.student_number && course?.id) {
            const checkEnrollment = async () => {
                setIsCheckingEnrollment(true);
                try {
                    const enrollmentRes = await api.get(`/enrollments/?student_id=${user.student_number}&course_id=${course.id}`);

                    if (enrollmentRes.data && enrollmentRes.data.length > 0) {
                        // Assuming the most recent enrollment is the one we care about
                        setEnrollmentStatus(enrollmentRes.data[0].status);
                    } else {
                        setEnrollmentStatus(null);
                    }
                } catch (error) {
                    setEnrollmentStatus(null);
                    console.error("Failed to check enrollment status:", error);
                } finally {
                    setIsCheckingEnrollment(false);
                }
            };
            checkEnrollment();
        } else if (user) {
             setIsCheckingEnrollment(false);
        }
    }, [user, course]);


    useEffect(() => {
        if (enrollmentStatus === 'approved' && user?.student_number && course?.id && buckets.length > 0) {
            const fetchPayments = async () => {
                 const paymentStatusMap = new Map<string, boolean>();
                for (const bucket of buckets) {
                    const payments = await getStudentPayments(user.student_number!, course.id, bucket.id);
                    if (payments.length > 0) {
                        // Assuming any payment record means it's "paid" for the context of this page
                        paymentStatusMap.set(bucket.id, true);
                    } else {
                        paymentStatusMap.set(bucket.id, false);
                    }
                }
                setStudentPayments(paymentStatusMap);
            };
            fetchPayments();
        }
    }, [enrollmentStatus, user, course, buckets]);


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

    const handleDeleteBucket = async (bucketId: string) => {
        try {
            const response = await api.delete(`/course_buckets/${bucketId}`);
            if (response.status === 200 || response.status === 204) {
                toast({
                    title: 'Bucket Deleted',
                    description: 'The course bucket has been successfully deleted.',
                });
                setBuckets(prev => prev.filter(b => b.id !== bucketId));
            } else {
                 throw new Error(response.data.message || "Failed to delete bucket");
            }
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: error.message || 'Could not delete the course bucket.',
            });
        }
    }


    if (loading) {
        return <Preloader />;
    }

  if (!course) {
    notFound();
  }

  const renderEnrollmentButton = () => {
    if (isCheckingEnrollment) {
        return <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</Button>;
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
        <AlertDialog open={isEnrollmentDialogOpen} onOpenChange={setIsEnrollmentDialogOpen}>
            <AlertDialogTrigger asChild>
                <Button>Enroll Now</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Enrollment</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to send an enrollment request for {'"'}
                        <span className="font-semibold">{course?.course_name}</span>{'"'}?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleEnroll} disabled={isEnrolling}>
                        {isEnrolling ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending Request...
                            </>
                        ) : (
                            'Confirm Enrollment'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
  };
  
    const canViewContent = isAdmin || enrollmentStatus === 'approved';
    const showIntroVideo = !isAdmin && enrollmentStatus !== 'approved' && course.intro_url;

    const plyrOptions = {
      youtube: {
        noCookie: true,
        rel: 0,
        showinfo: 0,
        modestbranding: 1,
      },
    };

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
                 <div className="flex items-center gap-2">
                    <Button asChild>
                        <Link href={`/classes/${courseId}/create-bucket?name=${encodeURIComponent(course.course_name)}&description=${encodeURIComponent(course.description)}`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Bucket
                        </Link>
                    </Button>
                </div>
            ) : (
                renderEnrollmentButton()
            )}
        </div>
      </header>

      {showIntroVideo && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Video /> Course Introduction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full aspect-video bg-background rounded-lg flex items-center justify-center border overflow-hidden relative">
                  {videoId && (
                    <Plyr 
                        ref={(player) => {
                            if (player?.plyr) {
                            playerRef.current = player.plyr;
                            }
                        }}
                        source={{
                            type: 'video',
                            sources: [
                                {
                                src: videoId,
                                provider: 'youtube',
                                },
                            ],
                        }}
                        options={plyrOptions}
                    />
                  )}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {canViewContent && (
        <>
            <section>
                <h2 className="text-xl font-bold mb-4">Payment Buckets</h2>
                {buckets.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {(buckets as any[]).map((bucket) => {
                            const totalContent = bucket.contents?.length || 0;
                            const totalAssignments = bucket.assignments?.length || 0;
                            
                            const isPaid = !isAdmin && (studentPayments.get(bucket.id) ?? false);

                            return (
                                <Card key={bucket.id} className="flex flex-col group h-full">
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
                                    <CardContent className="flex-grow">
                                        <h3 className="font-semibold text-lg truncate group-hover:text-primary">{bucket.name}</h3>
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
                                        <div className="flex items-center gap-2 mt-4 w-full">
                                            <Button asChild variant="outline" size="sm" className="flex-1">
                                                <Link href={`/classes/${course.id}/buckets/${bucket.id}`}>
                                                    View
                                                </Link>
                                            </Button>
                                            {isAdmin && (
                                                <>
                                                <Button asChild variant="secondary" size="icon" className="h-9 w-9">
                                                     <Link href={`/classes/${course.id}/buckets/${bucket.id}/edit`}>
                                                        <Edit className="h-4 w-4" />
                                                        <span className="sr-only">Edit Bucket</span>
                                                    </Link>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                         <Button variant="destructive" size="icon" className="h-9 w-9">
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Delete Bucket</span>
                                                         </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the bucket "{bucket.name}".
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteBucket(bucket.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                </>
                                            )}
                                        </div>
                                    </CardFooter>
                                </Card>
                            )
                            })}
                        </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No payment buckets found for this course.</p>
                        {isAdmin && (
                            <Button variant="outline" className="mt-4" asChild>
                                <Link href={`/classes/${courseId}/create-bucket?name=${encodeURIComponent(course.course_name)}&description=${encodeURIComponent(course.description)}`}>
                                    Create the First Bucket
                                </Link>
                            </Button>
                        )}
                    </div>
                )}
            </section>
            
            {isAdmin && (
                <section>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Manage Assignments</CardTitle>
                                 <div className="flex items-center gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/classes/${course.id}/assignments`}>
                                            View All
                                        </Link>
                                    </Button>
                                     <Button asChild size="sm">
                                        <Link href={`/classes/${course.id}/add-assignment`}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Assignment
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                            <CardDescription>
                                Create and manage assignments for this course.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {allAssignments && allAssignments.length > 0 ? (
                                <ul className="space-y-3">
                                    {allAssignments.slice(0, 5).map((assignment) => (
                                        <li key={assignment.id}>
                                            <Link href={`/classes/${assignment.courseId}/buckets/${assignment.bucketId}/content/${assignment.contentId}/assignments/${assignment.id}`}>
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
                                                    <Button variant="ghost" size="sm">
                                                        View <Eye className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground text-center">No assignments yet for this course.</p>
                            )}
                        </CardContent>
                    </Card>
                </section>
            )}
        </>
      )}
    </div>
  );
}
