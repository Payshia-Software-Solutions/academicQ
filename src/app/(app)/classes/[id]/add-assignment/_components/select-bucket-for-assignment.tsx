
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Folder, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Bucket {
  id: string;
  name: string;
  description: string;
}

interface SelectBucketForAssignmentProps {
    courseId: string;
}

export function SelectBucketForAssignment({ courseId }: SelectBucketForAssignmentProps) {
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!courseId) return;

        async function fetchBuckets() {
            setIsLoading(true);
            try {
                const response = await api.get(`/course_buckets/course/${courseId}`);
                if (response.data.status === 'success' && Array.isArray(response.data.data)) {
                    setBuckets(response.data.data);
                } else {
                    setBuckets([]);
                }
            } catch (error: any) {
                setBuckets([]);
                toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch course buckets.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchBuckets();
    }, [courseId, toast]);

    const handleSelectBucket = (bucketId: string) => {
        router.push(`/classes/${courseId}/buckets/${bucketId}/add-assignment`);
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({length: 3}).map((_, i) => (
                    <Card key={i}>
                        <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                        <CardContent><Skeleton className="h-4 w-full" /></CardContent>
                        <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Select a Course Bucket</CardTitle>
                <CardDescription>Choose the payment bucket where this assignment should be placed.</CardDescription>
            </CardHeader>
            <CardContent>
                {buckets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {buckets.map((bucket) => (
                            <Card key={bucket.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Folder className="h-8 w-8 text-primary" />
                                        <CardTitle className="text-lg">{bucket.name}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                     <p className="text-sm text-muted-foreground line-clamp-2">{bucket.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button size="sm" className="w-full" onClick={() => handleSelectBucket(bucket.id)}>
                                        Select Bucket
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No buckets found for this course.</p>
                        <p className="text-xs text-muted-foreground mt-1">You must create a bucket before you can add an assignment.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

