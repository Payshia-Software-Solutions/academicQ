
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { FileVideo, Image, Link as LinkIcon, FileText, File, Eye, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BucketContent {
    id: string;
    course_id: string;
    course_bucket_id: string;
    content_type: string;
    content_title: string;
    content: string;
    is_active: string;
    created_at: string;
}

interface BucketContentListProps {
    courseId: string;
    bucketId: string;
    isLocked: boolean;
}

const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
        case 'video': return <FileVideo className="h-5 w-5 text-accent" />;
        case 'image': return <Image className="h-5 w-5 text-accent" />;
        case 'link': return <LinkIcon className="h-5 w-5 text-accent" />;
        case 'pdf': return <FileText className="h-5 w-5 text-accent" />;
        default: return <File className="h-5 w-5 text-accent" />;
    }
};

export function BucketContentList({ courseId, bucketId, isLocked }: BucketContentListProps) {
    const [content, setContent] = useState<BucketContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!bucketId || !courseId) return;

        async function fetchContent() {
            setIsLoading(true);
            try {
                const response = await api.get(`/course-bucket-contents?course_id=${courseId}&course_bucket_id=${bucketId}`);
                if (response.data.status === 'success') {
                    setContent(response.data.data || []);
                } else {
                    setContent([]);
                }
            } catch (error: any) {
                setContent([]);
                toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch bucket content.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchContent();
    }, [courseId, bucketId, toast]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bucket Content</CardTitle>
                <CardDescription>
                    {isLocked 
                        ? `This content is locked. Complete payment to gain access.`
                        : `${content.length} item(s) found in this bucket.`
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                {content.length > 0 ? (
                    <ul className="space-y-3">
                        {content.map((item) => {
                            const Wrapper = isLocked ? 'div' : Link;
                            const props = isLocked ? {} : { href: `/classes/${courseId}/buckets/${bucketId}/content/${item.id}`};
                           
                           return (
                               <li key={item.id}>
                                 <Wrapper {...props}>
                                     <div className={cn(
                                         "flex items-center justify-between p-4 rounded-lg border transition-colors gap-4",
                                         isLocked ? "bg-muted/50 cursor-not-allowed relative overflow-hidden" : "hover:bg-muted/50",
                                     )}>
                                        {isLocked && <div className="absolute inset-0 bg-background/30 backdrop-blur-sm z-10" />}
                                        <div className="flex items-center gap-4">
                                             <div className="p-2 bg-accent/10 rounded-lg">
                                                {getIconForType(item.content_type)}
                                             </div>
                                             <div>
                                                <p className="font-semibold">{item.content_title}</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="capitalize">{item.content_type.toLowerCase()}</Badge>
                                                    <Badge variant={item.is_active === '1' ? 'secondary' : 'destructive'}>
                                                        {item.is_active === '1' ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                             </div>
                                        </div>
                                        <Button asChild variant="ghost" size="sm" disabled={isLocked}>
                                            <div className="flex items-center">
                                                {isLocked ? (
                                                    <>
                                                        <Lock className="mr-2 h-4 w-4" /> Locked
                                                    </>
                                                ) : (
                                                    <>
                                                        View Content
                                                        <Eye className="ml-2 h-4 w-4" />
                                                    </>
                                                )}
                                            </div>
                                        </Button>
                                     </div>
                                 </Wrapper>
                               </li>
                           )
                        })}
                    </ul>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No content has been added to this bucket yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
