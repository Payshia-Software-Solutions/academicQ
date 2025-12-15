
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { FileText, Eye, Lock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Preloader } from '@/components/ui/preloader';
import { format } from 'date-fns';

interface Assignment {
    id: string;
    content_title: string;
    deadline_date?: string;
    content: string;
    course_id: string;
    course_bucket_id: string;
}

interface BucketAssignmentsListProps {
    courseId: string;
    bucketId: string;
    isLocked: boolean;
    isAdmin: boolean;
}

export function BucketAssignmentsList({ courseId, bucketId, isLocked, isAdmin }: BucketAssignmentsListProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!bucketId || !courseId) return;

        async function fetchAssignments() {
            setIsLoading(true);
            try {
                const response = await api.get(`/assignments/filter/?course_id=${courseId}&course_bucket_id=${bucketId}`);
                if (response.data.status === 'success') {
                    setAssignments(response.data.data || []);
                } else {
                    setAssignments([]);
                }
            } catch (error: any) {
                setAssignments([]);
                toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch assignments.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchAssignments();
    }, [courseId, bucketId, toast]);
    
    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                    <Preloader />
                </CardContent>
            </Card>
        )
    }

    if (!isAdmin && assignments.length === 0) {
        return null; // Don't show the card if there are no assignments for a student
    }

    return (
        <Card className="relative">
             {isLocked && !isAdmin && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4 text-center p-4">
                    <Lock className="h-12 w-12 text-destructive" />
                    <h3 className="text-xl font-bold">Assignments Locked</h3>
                    <p className="text-muted-foreground">You must complete the payment for this bucket to view assignments.</p>
                </div>
             )}
            <CardHeader>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>
                    {isLocked && !isAdmin
                        ? `These assignments are locked. Complete payment to gain access.`
                        : `${assignments.length} assignment(s) found in this bucket.`
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                {assignments.length > 0 ? (
                    <ul className="space-y-3">
                        {assignments.map((item) => {
                           const viewHref = `/classes/${courseId}/buckets/${bucketId}/content/${item.id}/assignments/${item.id}`;
                           const isDeadlinePassed = item.deadline_date ? new Date(item.deadline_date) < new Date() : false;
                           
                           return (
                               <li key={item.id}>
                                     <div className={cn(
                                         "flex items-center justify-between p-4 rounded-lg border transition-colors gap-4",
                                         isLocked ? "bg-muted/50" : "hover:bg-muted/50",
                                     )}>
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                             <div className="p-2 bg-accent/10 rounded-lg">
                                                <FileText className="h-5 w-5 text-accent" />
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{item.content_title}</p>
                                                {item.deadline_date && (
                                                    <Badge variant={isDeadlinePassed ? 'destructive' : 'outline'} className="flex items-center gap-2 mt-1 w-fit">
                                                       <Calendar className="h-3 w-3"/>
                                                       Deadline: {format(new Date(item.deadline_date), 'PP')}
                                                    </Badge>
                                                 )}
                                             </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button asChild variant="ghost" size="sm" disabled={isLocked}>
                                                <Link href={viewHref}>
                                                    {isLocked ? (
                                                        <>
                                                            <Lock className="mr-2 h-4 w-4" /> Locked
                                                        </>
                                                    ) : (
                                                        <>
                                                            View
                                                            <Eye className="ml-2 h-4 w-4" />
                                                        </>
                                                    )}
                                                </Link>
                                            </Button>
                                        </div>
                                     </div>
                               </li>
                           )
                        })}
                    </ul>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No assignments have been added to this bucket yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
