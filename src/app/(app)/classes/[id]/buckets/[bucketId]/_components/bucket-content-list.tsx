
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { FileVideo, Image, Link as LinkIcon, FileText, File, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    bucketId: string;
}

const getIconForType = (type: string) => {
    switch (type.toUpperCase()) {
        case 'VIDEO': return <FileVideo className="h-5 w-5 text-accent" />;
        case 'IMAGE': return <Image className="h-5 w-5 text-accent" />;
        case 'LINK': return <LinkIcon className="h-5 w-5 text-accent" />;
        case 'PDF': return <FileText className="h-5 w-5 text-accent" />;
        default: return <File className="h-5 w-5 text-accent" />;
    }
};

export function BucketContentList({ bucketId }: BucketContentListProps) {
    const [content, setContent] = useState<BucketContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!bucketId) return;

        async function fetchContent() {
            setIsLoading(true);
            try {
                const response = await api.get(`/course_bucket_contents/bucket/${bucketId}`);
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
    }, [bucketId, toast]);

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
                    {content.length} item(s) found in this bucket.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {content.length > 0 ? (
                    <ul className="space-y-3">
                        {content.map((item) => (
                           <li key={item.id}>
                             <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-4">
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
                                <Button asChild variant="ghost" size="sm">
                                    <Link href={item.content} target="_blank" rel="noopener noreferrer">
                                        View Content
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                             </div>
                           </li>
                        ))}
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
