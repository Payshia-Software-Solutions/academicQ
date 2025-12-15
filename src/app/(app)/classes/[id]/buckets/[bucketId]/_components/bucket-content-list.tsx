

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { FileVideo, Image, Link as LinkIcon, FileText, File, Eye, Lock, DollarSign, Youtube, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PaymentSlipUploadForm } from './payment-slip-upload-form';
import { Preloader } from '@/components/ui/preloader';

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

    const handleDeleteContent = async (contentId: string) => {
         try {
            const response = await api.delete(`/course-bucket-contents/${contentId}`);
            if (response.status === 200 || response.status === 204) {
                toast({
                    title: 'Content Deleted',
                    description: 'The content item has been successfully deleted.',
                });
                setContent(prev => prev.filter(c => c.id !== contentId));
            } else {
                 throw new Error(response.data.message || "Failed to delete content");
            }
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: error.message || 'Could not delete the content item.',
            });
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent>
                    <Preloader icon="book" />
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
                    <AlertDialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Add Payment
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-[425px]">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Upload Payment Slip</AlertDialogTitle>
                                <AlertDialogDescription>
                                    To access this content, please upload your proof of payment.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4">
                                <PaymentSlipUploadForm 
                                    bucketAmount={bucketAmount || '0'}
                                    courseId={courseId}
                                    bucketId={bucketId}
                                />
                            </div>
                             <AlertDialogFooter>
                                <AlertDialogCancel>Close</AlertDialogCancel>
                             </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
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
                                                <>
                                                <Button asChild variant="secondary" size="icon" className="h-9 w-9" disabled={isLocked}>
                                                    <Link href={editHref}><Edit className="h-4 w-4" /></Link>
                                                </Button>
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon" className="h-9 w-9" disabled={isLocked}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the content item "{item.content_title}".
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteContent(item.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                </>
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

    