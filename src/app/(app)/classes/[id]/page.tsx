
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Plus, Tag, DollarSign, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  course_name: string;
  description: string;
}

interface Bucket {
  id: string;
  name: string;
  description: string;
  payment_amount: string;
  payment_type: string;
  is_active: string;
}

interface CurrentUser {
  user_status: 'admin' | 'student';
  [key: string]: any;
}


async function getCourseDetails(id: string): Promise<Course | null> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/courses`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.records.find((c: any) => c.id.toString() === id.toString());
    } catch (error) {
        console.error("Failed to fetch course details:", error);
        return null;
    }
}

async function getCourseBuckets(id: string): Promise<Bucket[]> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/course_buckets/course/${id}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error("Failed to fetch course buckets:", error);
        return [];
    }
}

export default function ClassDetailsPage({ params }: { params: { id: string } }) {
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </section>
            </div>
        );
    }

  if (!course) {
    notFound();
  }

  const BucketCard = ({ bucket }: { bucket: Bucket }) => {
    const cardContent = (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{bucket.name}</CardTitle>
          <CardDescription>{bucket.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">${parseFloat(bucket.payment_amount).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{bucket.payment_type || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span>Status: {bucket.is_active === "1" ? "Active" : "Inactive"}</span>
          </div>
        </CardContent>
      </Card>
    );

    if (isAdmin) {
      return (
        <Link href={`/classes/${course.id}/buckets/${bucket.id}/add-content`} className="block hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          {cardContent}
        </Link>
      );
    }
    
    return <div className="cursor-not-allowed">{cardContent}</div>;
  };

  return (
    <div className="space-y-6">
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
            {isAdmin && (
                <Button asChild>
                    <Link href={`/classes/${params.id}/create-bucket?name=${encodeURIComponent(course.course_name)}&description=${encodeURIComponent(course.description)}`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Bucket
                    </Link>
                </Button>
            )}
        </div>
      </header>

      <section>
        <h2 className="text-xl font-bold mb-4">Payment Buckets</h2>
        {buckets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buckets.map((bucket: any) => (
                    <BucketCard key={bucket.id} bucket={bucket} />
                ))}
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
    </div>
  );
}
