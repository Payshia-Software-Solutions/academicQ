
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Plus, Tag, DollarSign, Info, FileText, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </section>
            </div>
        );
    }

  if (!course) {
    notFound();
  }

  const BucketAccordion = ({ bucket, isAdmin }: { bucket: Bucket, isAdmin: boolean }) => {
    const totalContent = bucket.contents?.length || 0;
    const totalAssignments = bucket.assignments?.length || 0;

    const contentList = (
        <div>
            {isAdmin && totalContent > 0 && (
                 <div className="flex justify-end mb-4">
                    <Button asChild size="sm" variant="outline">
                        <Link href={`/classes/${course.id}/buckets/${bucket.id}/add-content`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Content
                        </Link>
                    </Button>
                </div>
            )}
            {totalContent > 0 ? (
                 <ul className="space-y-3">
                    {bucket.contents.map(item => (
                    <li key={`content-${item.id}`}>
                        <Link href={`/classes/${course.id}/buckets/${bucket.id}/content/${item.id}`}>
                            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-accent/10 rounded-lg">
                                        <BookOpen className="h-5 w-5 text-accent" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{item.content_title}</p>
                                        <Badge variant="outline" className="capitalize text-xs">{item.content_type}</Badge>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground"/>
                            </div>
                        </Link>
                    </li>
                    ))}
                </ul>
            ) : (
                 <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No content has been added to this bucket yet.</p>
                     {isAdmin && (
                        <Button asChild size="sm" variant="outline" className="mt-4">
                            <Link href={`/classes/${course.id}/buckets/${bucket.id}/add-content`}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Content
                            </Link>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
    
    const assignmentsList = (
         <div>
            {totalAssignments > 0 ? (
                    <ul className="space-y-3">
                    {bucket.assignments.map(item => (
                    <li key={`assignment-${item.id}`}>
                         <Link href={`/classes/${course!.id}/buckets/${bucket.id}/content/${item.id}/assignments/${item.id}`}>
                            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{item.content_title}</p>
                                        <Badge variant="secondary" className="capitalize text-xs">{item.content_type}</Badge>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground"/>
                            </div>
                        </Link>
                    </li>
                    ))}
                </ul>
            ) : (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No assignments are linked to this bucket yet.</p>
                </div>
            )}
        </div>
    );


    return (
        <AccordionItem value={`bucket-${bucket.id}`}>
            <AccordionTrigger className="hover:no-underline">
                <div className="flex-1 text-left">
                    <h3 className="font-semibold text-lg">{bucket.name}</h3>
                    <p className="text-sm text-muted-foreground">{bucket.description}</p>
                    <div className="flex items-center gap-4 text-xs mt-2">
                        <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">${parseFloat(bucket.payment_amount).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span className="capitalize">{bucket.payment_type || 'N/A'}</span>
                        </div>
                         <div className="flex items-center gap-1">
                            <Info className="h-3 w-3 text-muted-foreground" />
                            <span>Status: {bucket.is_active === "1" ? "Active" : "Inactive"}</span>
                        </div>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                {isAdmin ? (
                    <Tabs defaultValue="content" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="content">Content ({totalContent})</TabsTrigger>
                            <TabsTrigger value="assignments">Assignments ({totalAssignments})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="content" className="mt-4">
                           {contentList}
                        </TabsContent>
                        <TabsContent value="assignments" className="mt-4">
                           {assignmentsList}
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-lg mb-4">Content</h4>
                            {contentList}
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-4">Assignments</h4>
                            {assignmentsList}
                        </div>
                    </div>
                )}

            </AccordionContent>
        </AccordionItem>
    );
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
            <Accordion type="single" collapsible className="w-full">
                {buckets.map((bucket: any) => (
                    <BucketAccordion key={bucket.id} bucket={bucket} isAdmin={isAdmin} />
                ))}
            </Accordion>
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
