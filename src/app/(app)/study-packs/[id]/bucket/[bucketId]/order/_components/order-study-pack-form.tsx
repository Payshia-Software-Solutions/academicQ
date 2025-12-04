
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { ArrowLeft, Package, FileVideo, Image, Link as LinkIcon, FileText, File } from 'lucide-react';
import Link from 'next/link';

interface BucketContent {
    id: string;
    content_title: string;
    content_type: string;
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

export function OrderStudyPackForm() {
    const params = useParams();
    const { id: courseId, bucketId } = params;
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

    const handleOrderSubmit = (itemTitle: string) => {
        // Placeholder for order submission logic
        toast({
            title: "Order Placed (Simulation)",
            description: `Your order for "${itemTitle}" has been submitted.`,
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Orderable Items</CardTitle>
                <CardDescription>Select the item you wish to order from this study pack bucket.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : content.length > 0 ? (
                    <div className="space-y-4">
                        {content.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    {getIconForType(item.content_type)}
                                    <span className="font-medium">{item.content_title}</span>
                                </div>
                                <Button size="sm" onClick={() => handleOrderSubmit(item.content_title)}>
                                    <Package className="mr-2 h-4 w-4" />
                                    Order Now
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No orderable items found in this bucket.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <Button variant="outline" asChild>
                    <Link href={`/study-packs/${courseId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Back to Buckets
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
