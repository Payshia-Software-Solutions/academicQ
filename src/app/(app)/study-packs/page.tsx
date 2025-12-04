
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package } from "lucide-react";
import type { Class } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

function StudyPackCourseCard({ cls }: { cls: Class }) {
    const [imageError, setImageError] = useState(false);

    const getFullFileUrl = (filePath: string) => {
        if (!filePath || filePath.startsWith('http')) return filePath;
        const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL || '';
        return `${baseUrl}${filePath}`;
    };

    return (
        <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
            <CardHeader className="p-0">
            <div className="relative h-48 w-full bg-muted flex items-center justify-center">
                {!imageError ? (
                    <Image
                        src={getFullFileUrl(cls.imageUrl)}
                        alt={cls.name}
                        fill
                        style={{objectFit: "cover"}}
                        data-ai-hint="online course"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <Avatar className="h-24 w-24 text-3xl">
                        <AvatarFallback>{cls.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
            </div>
            </CardHeader>
            <CardContent className="p-6 flex-grow">
            <CardTitle className="font-headline text-xl mb-2">{cls.name}</CardTitle>
            <CardDescription>{cls.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-6 pt-0">
            <Button asChild size="sm" className="w-full">
                <Link href={`/study-packs/${cls.id}`}>
                    View Buckets
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
            </CardFooter>
        </Card>
    )
}

export default function StudyPacksPage() {
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

    if (user) {
        loadData();
    }
  }, [user, toast]);


  const isAdmin = user?.user_status === 'admin';

  const approvedCourses = useMemo(() => {
    if (isAdmin) {
        return allCourses;
    }
    const approvedCourseIds = new Set(enrollments.filter(e => e.status === 'approved').map(e => e.course_id));
    return allCourses.filter(c => approvedCourseIds.has(c.id));
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
                <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground flex items-center gap-3"><Package /> Study Packs</h1>
        <p className="text-muted-foreground">Select a course to view and order available study packs.</p>
      </header>
      
      {loading ? (
        renderLoadingSkeletons()
      ) : (
        <section>
            <h2 className="text-xl font-bold mb-4">{isAdmin ? 'All Courses' : 'Your Approved Courses'}</h2>
            {approvedCourses.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {approvedCourses.map((cls) => (
                        <StudyPackCourseCard key={cls.id} cls={cls} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">You have no approved courses available for study packs.</p>
                     {!isAdmin && (
                         <Button variant="outline" className="mt-4" asChild>
                            <Link href="/classes">
                                Browse Classes
                            </Link>
                        </Button>
                     )}
                </div>
            )}
        </section>
      )}
    </div>
  );
}

