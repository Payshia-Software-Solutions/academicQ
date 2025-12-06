
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CurrentUser {
  user_status: 'admin' | 'student';
  f_name: string;
  l_name: string;
  student_number?: string;
  [key: string]: any;
}

interface Enrollment {
  id: string;
  course_id: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface Course {
    id: string;
    course_name: string;
    description: string;
    img_url?: string;
    enrollment_status?: 'pending' | 'approved' | 'rejected';
}

export default function StudentDashboardPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [approvedCourses, setApprovedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [profileSkipped, setProfileSkipped] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const isSkipped = sessionStorage.getItem('profileSkipped') === 'true';
    setProfileSkipped(isSkipped);
  }, []);

  useEffect(() => {
    if (user?.student_number) {
      async function fetchDashboardData() {
        setLoading(true);
        try {
          // 1. Fetch all courses to get details like description and image
          const coursesRes = await api.get('/courses');
          const allCourses: Course[] = coursesRes.data.data || [];
          
          // 2. Fetch student-specific approved enrollments
          const enrollmentsRes = await api.get(`/enrollments/?student_number=${user.student_number}&status=approved`);
          const enrollments: Enrollment[] = enrollmentsRes.data || [];
          const approvedCourseIds = new Set(enrollments.map(e => e.course_id.toString()));

          // 3. Filter allCourses to get the details of the approved ones
          const coursesToShow = allCourses.filter(course => approvedCourseIds.has(course.id.toString()));

          setApprovedCourses(coursesToShow);

        } catch (error) {
          console.error("Failed to fetch dashboard data:", error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not load your courses.',
          });
        } finally {
          setLoading(false);
        }
      }
      fetchDashboardData();
    } else if (user) {
        setLoading(false);
    }
  }, [user, toast]);
  
  const getFullFileUrl = (filePath?: string) => {
    if (!filePath || filePath.startsWith('http')) return filePath || 'https://placehold.co/600x400';
    const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL || '';
    return `${baseUrl}${filePath}`;
  };

  const getStatusVariant = (status?: string) => {
    switch (status) {
        case 'approved': return 'secondary';
        case 'rejected': return 'destructive';
        case 'pending':
        default: return 'outline';
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">
          Welcome, {user?.f_name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here is an overview of your enrolled courses and their status.
        </p>
      </header>

      {profileSkipped && (
         <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Complete Your Profile</AlertTitle>
          <AlertDescription>
            Your profile details are incomplete. Please fill them out to ensure full access to all features.
             <Button asChild variant="link" className="p-0 h-auto ml-2 text-destructive-foreground font-semibold">
                <Link href="/complete-profile">Complete Profile</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <section>
        <h2 className="text-xl font-bold mb-4">My Classes</h2>
        {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                ))}
            </div>
        ) : approvedCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {approvedCourses.map((course) => (
                <Card key={course.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                    <CardHeader className="p-0">
                        <div className="relative h-48 w-full">
                            <Image
                                src={getFullFileUrl(course.img_url)}
                                alt={course.course_name}
                                fill
                                style={{objectFit: "cover"}}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 flex-grow">
                        <div className="flex justify-between items-start mb-2">
                             <CardTitle className="font-headline text-xl">{course.course_name}</CardTitle>
                             <Badge variant="secondary" className="capitalize">Approved</Badge>
                        </div>
                        <CardDescription>{course.description}</CardDescription>
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                         <Button asChild size="sm" className="w-full">
                            <Link href={`/classes/${course.id}`}>
                                View Course
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
            </div>
        ) : (
             <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">You are not enrolled in any approved courses yet.</p>
                 <Button variant="outline" className="mt-4" asChild>
                    <Link href="/classes">
                       Browse Courses
                    </Link>
                </Button>
            </div>
        )}
      </section>
    </div>
  );
}
