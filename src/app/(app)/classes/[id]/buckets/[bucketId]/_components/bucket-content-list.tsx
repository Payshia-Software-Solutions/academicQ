
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { FileVideo, Image, Link as LinkIcon, FileText, File, Eye, Lock, DollarSign, Youtube, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PaymentSlipUploadForm } from './payment-slip-upload-form';

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
    bucketAmount: string;
    isAdmin: boolean;
}

const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
        case 'video': return <FileVideo className="h-5 w-5 text-accent" />;
        case 'youtube_video': return <Youtube className="h-5 w-5 text-red-500" />;
        case 'image': return <Image className="h-5 w-5 text-accent" />;
        case 'link': return <LinkIcon className="h-5 w-5 text-accent" />;
        case 'pdf': return <FileText className="h-5 w-5 text-accent" />;
        default: return <File className="h-5 w-5 text-accent" />;
    }
};

export function BucketContentList({ courseId, bucketId, isLocked, bucketAmount, isAdmin }: BucketContentListProps) {
    const [content, setContent] = useState<BucketContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);


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
        <Card className="relative">
             {isLocked && !isAdmin && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4 text-center p-4">
                    <Lock className="h-12 w-12 text-destructive" />
                    <h3 className="text-xl font-bold">Content Locked</h3>
                    <p className="text-muted-foreground">You must complete the payment for this bucket to view its content.</p>
                    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Add Payment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Upload Payment Slip</DialogTitle>
                                <DialogDescription>
                                    To access this content, please upload your proof of payment.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <PaymentSlipUploadForm 
                                    bucketAmount={bucketAmount || '0'}
                                    courseId={courseId}
                                    bucketId={bucketId}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
             )}
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
                           const viewHref = `/classes/${courseId}/buckets/${bucketId}/content/${item.id}`;
                           const editHref = `/classes/${courseId}/buckets/${bucketId}/content/${item.id}/edit`;
                           
                           return (
                               <li key={item.id}>
                                     <div className={cn(
                                         "flex items-center justify-between p-4 rounded-lg border transition-colors gap-4",
                                         isLocked ? "bg-muted/50" : "hover:bg-muted/50",
                                     )}>
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                             <div className="p-2 bg-accent/10 rounded-lg">
                                                {getIconForType(item.content_type)}
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{item.content_title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="capitalize">{item.content_type.toLowerCase().replace(/_/g, ' ')}</Badge>
                                                    <Badge variant={item.is_active === '1' ? 'secondary' : 'destructive'}>
                                                        {item.is_active === '1' ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                             </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isAdmin && (
                                                <Button asChild variant="secondary" size="sm" disabled={isLocked}>
                                                    <Link href={editHref}><Edit className="mr-2 h-3 w-3" />Edit</Link>
                                                </Button>
                                            )}
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
                        <p className="text-muted-foreground">No content has been added to this bucket yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

    
