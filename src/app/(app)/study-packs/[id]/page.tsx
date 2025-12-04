
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Plus, Folder, List, FileText, Package } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import api from '@/lib/api';

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

interface Bucket {
  id: string;
  bucket_name: string;
  description: string;
  payment_amount: string;
  payment_type: string;
  is_active: string;
  contents: Content[];
}

interface CurrentUser {
  user_status: 'admin' | 'student';
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

export default function StudyPackDetailsPage({ params }: { params: { id: string } }) {
    const [course, setCourse] = useState<Course | null>(null);
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<CurrentUser | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
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

    const isAdmin = user?.user_status === 'admin';

    if (loading) {
        return (
             <div className="space-y-6">
                <header>
                    <Skeleton className="h-6 w-1/4 mb-4" />
                    <Skeleton className="h-10 w-1/2 mb-2" />
                    <Skeleton className="h-5 w-3/4" />
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

  return (
    <div className="space-y-8">
       <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/study-packs" className="hover:underline">Study Packs</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="truncate">{course.course_name}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">{course.course_name}</h1>
        <p className="text-muted-foreground mt-1">Select a payment bucket to order study packs.</p>
      </header>
        <section>
            <h2 className="text-xl font-bold mb-4">Payment Buckets</h2>
            {buckets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {buckets.map((bucket) => {
                        const totalContent = bucket.contents?.length || 0;
                        return (
                            <Link href={`/study-packs/${course.id}/bucket/${bucket.id}/order`} key={bucket.id} className="block group">
                                <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <Folder className="h-10 w-10 text-primary" />
                                            {isAdmin && (
                                                <Badge variant={bucket.is_active === "1" ? 'secondary' : 'destructive'}>
                                                    {bucket.is_active === "1" ? "Active" : "Inactive"}
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
                                         <div className="flex items-center gap-2 mt-1 font-semibold text-primary">
                                            <Package className="h-3 w-3" />
                                            <span>Order Study Packs</span>
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
                </div>
            )}
        </section>
    </div>
  );
}
