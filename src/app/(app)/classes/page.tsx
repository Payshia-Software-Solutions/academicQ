
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";
import type { Class } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface CurrentUser {
  user_status: 'admin' | 'student';
  student_number?: string;
  [key: string]: any;
}

interface ApiCourse {
    id: string;
    course_name: string;
    description: string;
    img_url?: string;
    [key: string]: any;
}

interface Enrollment {
  id: string;
  course_id: string;
  status: 'pending' | 'approved' | 'rejected';
}


function ClassCard({ cls, enrollmentStatus }: { cls: Class, enrollmentStatus?: string }) {
    const getFullFileUrl = (filePath: string) => {
        if (!filePath || filePath.startsWith('http')) return filePath;
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
    };

    return (
        <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
            <CardHeader className="p-0">
            <div className="relative h-48 w-full">
                <Image
                src={getFullFileUrl(cls.imageUrl)}
                alt={cls.name}
                fill
                style={{objectFit: "cover"}}
                data-ai-hint="online course"
                />
                 {enrollmentStatus && (
                    <Badge variant={getStatusVariant(enrollmentStatus)} className="capitalize absolute top-2 right-2">
                        {enrollmentStatus}
                    </Badge>
                )}
            </div>
            </CardHeader>
            <CardContent className="p-6 flex-grow">
            <CardTitle className="font-headline text-xl mb-2">{cls.name}</CardTitle>
            <CardDescription>{cls.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-6 pt-0 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
            <div>
                <p className="text-sm font-medium text-foreground">{cls.teacher}</p>
                <p className="text-xs text-muted-foreground">{cls.schedule}</p>
            </div>
            <Button asChild size="sm" className="w-full sm:w-auto">
                <Link href={`/classes/${cls.id}`}>
                    {enrollmentStatus ? 'View Details' : 'Enroll Now'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
            </CardFooter>
        </Card>
    )
}

function CourseListSection({ title, courses, enrollmentStatusMap }: { title: string, courses: Class[], enrollmentStatusMap?: Map<string, string> }) {
    const isMobile = useIsMobile();
    if (courses.length === 0) return null;

    const renderContent = () => {
        if (isMobile) {
            return (
                <Carousel opts={{ align: "start", loop: false }} className="w-full">
                    <CarouselContent>
                        {courses.map((cls) => (
                            <CarouselItem key={cls.id} className="basis-full sm:basis-1/2">
                               <div className="p-1 h-full">
                                 <ClassCard cls={cls} enrollmentStatus={enrollmentStatusMap?.get(cls.id)} />
                               </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex" />
                    <CarouselNext className="hidden sm:flex" />
                </Carousel>
            )
        }
        return (
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {courses.map((cls) => (
                    <ClassCard key={cls.id} cls={cls} enrollmentStatus={enrollmentStatusMap?.get(cls.id)} />
                ))}
            </div>
        )
    };

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-bold">{title}</h2>
            {renderContent()}
        </section>
    )
}


export default function ClassesPage() {
  const [allCourses, setAllCourses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    async function loadData() {
        setLoading(true);
        try {
            const coursesRes = await api.get('/courses');
            const fetchedCourses: Class[] = coursesRes.data.data.map((record: ApiCourse) => ({
                id: record.id,
                name: record.course_name,
                description: record.description,
                teacher: 'N/A', 
                schedule: 'N/A', 
                studentIds: [], 
                imageUrl: record.img_url || 'https://placehold.co/600x400.png'
            }));
            setAllCourses(fetchedCourses);

            if (user?.user_status === 'student' && user.student_number) {
                 const enrollmentsRes = await api.get(`/enrollments/?student_id=${user.student_number}`);
                 setEnrollments(enrollmentsRes.data || []);
            }
        } catch(error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load class data.',
            });
        } finally {
            setLoading(false);
        }
    }

    loadData();
  }, [user, toast]);


  const isAdmin = user?.user_status === 'admin';

  const { approvedCourses, pendingCourses, rejectedCourses, availableCourses, enrollmentStatusMap } = useMemo(() => {
    if (isAdmin) {
        return { approvedCourses: [], pendingCourses: [], rejectedCourses: [], availableCourses: allCourses, enrollmentStatusMap: new Map() };
    }

    const enrollmentStatusMap = new Map<string, string>();
    const enrolledCourseIds = new Set<string>();

    enrollments.forEach(e => {
        enrollmentStatusMap.set(e.course_id, e.status);
        enrolledCourseIds.add(e.course_id);
    });
    
    const approved = allCourses.filter(c => enrollmentStatusMap.get(c.id) === 'approved');
    const pending = allCourses.filter(c => enrollmentStatusMap.get(c.id) === 'pending');
    const rejected = allCourses.filter(c => enrollmentStatusMap.get(c.id) === 'rejected');
    const available = allCourses.filter(c => !enrolledCourseIds.has(c.id));
    
    return { approvedCourses: approved, pendingCourses: pending, rejectedCourses: rejected, availableCourses: available, enrollmentStatusMap };
  }, [isAdmin, allCourses, enrollments]);


  const renderLoadingSkeletons = () => (
     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="flex flex-col overflow-hidden">
           <CardHeader className="p-0">
              <Skeleton className="h-48 w-full" />
            </CardHeader>
            <CardContent className="p-6 flex-grow">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2 mt-1" />
            </CardContent>
            <CardFooter className="p-6 pt-0">
                <Skeleton className="h-10 w-28" />
            </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Classes</h1>
            <p className="text-muted-foreground">Browse and manage class schedules and lessons.</p>
        </div>
        {isAdmin && (
            <Button asChild>
                <Link href="/classes/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Class
                </Link>
            </Button>
        )}
      </header>
      
      {loading ? (
        renderLoadingSkeletons()
      ) : isAdmin ? (
        <CourseListSection title="All Classes" courses={allCourses} />
      ) : (
        <div className="space-y-8">
            <CourseListSection title="Approved Classes" courses={approvedCourses} enrollmentStatusMap={enrollmentStatusMap} />
            <CourseListSection title="Pending Classes" courses={pendingCourses} enrollmentStatusMap={enrollmentStatusMap} />
            <CourseListSection title="Rejected Classes" courses={rejectedCourses} enrollmentStatusMap={enrollmentStatusMap} />
            <CourseListSection title="Available Classes" courses={availableCourses} />
            {(approvedCourses.length + pendingCourses.length + rejectedCourses.length + availableCourses.length) === 0 && (
                 <p className="col-span-full text-center text-muted-foreground">No classes found.</p>
            )}
        </div>
      )}
    </div>
  );
}
