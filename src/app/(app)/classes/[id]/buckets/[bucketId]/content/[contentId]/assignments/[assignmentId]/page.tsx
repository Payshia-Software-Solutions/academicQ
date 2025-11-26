
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { ArrowLeft, Download, FileText, Paperclip } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface AssignmentDetails {
    id: string;
    content_type: string;
    content_title: string;
    content: string;
    file_url: string;
    created_at: string;
}

export default function AssignmentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { id: courseId, bucketId, contentId, assignmentId } = params;

    const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!assignmentId) return;

        const fetchAssignmentDetails = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(`/assignments/${assignmentId}`);
                if (response.data.status === 'success') {
                    setAssignment(response.data.data);
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Failed to fetch assignment details.',
                    });
                    setAssignment(null);
                }
            } catch (error: any) {
                 toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch assignment details.',
                });
                setAssignment(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssignmentDetails();

    }, [assignmentId, toast]);
    
    const renderContent = () => {
        if (!assignment) return null;

        switch (assignment.content_type.toLowerCase()) {
            case 'video':
                return (
                     <div className="aspect-video w-full">
                        <iframe
                            src={assignment.file_url || assignment.content}
                            title={assignment.content_title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full rounded-lg"
                        ></iframe>
                    </div>
                );
            case 'image':
                return (
                    <div className="relative w-full h-96">
                        <Image
                            src={assignment.file_url || assignment.content}
                            alt={assignment.content_title}
                            fill
                            style={{ objectFit: 'contain' }}
                            className="rounded-lg"
                        />
                    </div>
                );
            case 'pdf':
                return (
                     <div className="h-[70vh]">
                         <iframe src={assignment.file_url || assignment.content} className="w-full h-full border rounded-lg" title={assignment.content_title}>
                             <p>Your browser does not support PDFs. <a href={assignment.file_url || assignment.content}>Download the PDF</a>.</p>
                         </iframe>
                    </div>
                );
            case 'link':
                 return (
                    <div className="p-6 bg-muted rounded-lg">
                        <p className="mb-2">This assignment requires you to visit an external link:</p>
                        <a href={assignment.content} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                            {assignment.content}
                        </a>
                    </div>
                )
            case 'text':
            default:
                return null; // Only description will be shown
        }
    };


    if (isLoading) {
        return (
            <div className="space-y-6">
                 <Skeleton className="h-10 w-48" />
                 <Skeleton className="h-96 w-full" />
                 <Skeleton className="h-24 w-full" />
            </div>
        )
    }

    if (!assignment) {
        return (
            <div className="text-center">
                <p className="text-muted-foreground mb-4">Assignment not found.</p>
                 <Button onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }
    
    const backUrl = `/classes/${courseId}/buckets/${bucketId}/content/${contentId}`;

    return (
        <div className="space-y-6">
            <header>
                 <Button variant="outline" size="sm" asChild className="mb-4">
                    <Link href={backUrl}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Content
                    </Link>
                </Button>
                <h1 className="text-2xl sm:text-3xl font-headline font-bold text-foreground">{assignment.content_title}</h1>
                <Badge variant="secondary" className="capitalize mt-2">{assignment.content_type} Assignment</Badge>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> Assignment Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="prose dark:prose-invert max-w-none">
                        <p>{assignment.content}</p>
                    </div>
                </CardContent>
            </Card>

            {(assignment.file_url || (assignment.content_type !== 'text' && assignment.content_type !== 'link')) && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Paperclip /> Associated Material</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderContent()}
                        {assignment.file_url && (
                             <Button asChild className="mt-4">
                                <a href={assignment.file_url} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Material
                                </a>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

    