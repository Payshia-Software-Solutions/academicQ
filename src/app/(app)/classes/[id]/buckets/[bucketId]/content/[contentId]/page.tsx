
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { ArrowLeft, FileText, Image as ImageIcon, Video, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

interface Assignment {
    id: string;
    content_title: string;
    content_type: string;
    file_url: string;
    course_bucket_id: string;
}

interface ContentDetails {
    id: string;
    content_type: string;
    content_title: string;
    content: string;
    assignments: Assignment[];
}

interface CurrentUser {
  user_status: 'admin' | 'student';
  student_number?: string;
  id?: number;
  [key: string]: any;
}

const submissionSchema = z.object({
  assignment_file: z.any().refine((files) => files?.length == 1, "Assignment file is required."),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

export default function ContentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { id: courseId, bucketId, contentId } = params;

    const [content, setContent] = useState<ContentDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const form = useForm<SubmissionFormValues>({
        resolver: zodResolver(submissionSchema),
    });

    useEffect(() => {
        if (!contentId) return;

        const fetchContentDetails = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(`/course-bucket-contents/${contentId}`);
                if (response.data.status === 'success') {
                    setContent(response.data.data);
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Failed to fetch content details.',
                    });
                    setContent(null);
                }
            } catch (error: any) {
                 toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch content details.',
                });
                setContent(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchContentDetails();

    }, [contentId, toast]);

    const handleSubmissionSubmit = async (data: SubmissionFormValues) => {
        if (!selectedAssignment || !user || !user.student_number || !user.id) {
            toast({ variant: 'destructive', title: 'Error', description: 'Cannot submit assignment. User or assignment details missing.' });
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData();
        const submissionData = {
            student_number: user.student_number,
            course_bucket_id: parseInt(selectedAssignment.course_bucket_id),
            assigment_id: parseInt(selectedAssignment.id),
            grade: null,
            created_by: user.id,
            is_active: 1
        };

        formData.append('data', JSON.stringify(submissionData));
        formData.append('assignment_file', data.assignment_file[0]);

        try {
            const response = await api.post('/assignment-submissions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.status === 201 || response.status === 200) {
                toast({ title: 'Assignment Submitted', description: 'Your assignment has been successfully submitted.' });
                setSelectedAssignment(null);
                form.reset();
            } else {
                toast({ variant: 'destructive', title: 'Submission Failed', description: response.data.message || 'An unknown error occurred.' });
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Submission Error',
                description: error.response?.data?.message || 'Could not connect to the server.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderContent = () => {
        if (!content) return null;

        switch (content.content_type.toLowerCase()) {
            case 'video':
                return (
                    <div className="aspect-video w-full">
                        <iframe
                            src={content.content}
                            title={content.content_title}
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
                            src={content.content}
                            alt={content.content_title}
                            fill
                            style={{ objectFit: 'contain' }}
                            className="rounded-lg"
                        />
                    </div>
                );
            case 'pdf':
                return (
                     <div className="h-[70vh]">
                         <iframe src={content.content} className="w-full h-full border rounded-lg" title={content.content_title}>
                             <p>Your browser does not support PDFs. <a href={content.content}>Download the PDF</a>.</p>
                         </iframe>
                    </div>
                );
            case 'link':
                 return (
                    <div className="p-6 bg-muted rounded-lg text-center">
                        <p className="mb-4">This is an external link. Click below to open it in a new tab.</p>
                        <Button asChild>
                            <a href={content.content} target="_blank" rel="noopener noreferrer">
                                Open Link
                            </a>
                        </Button>
                    </div>
                )
            case 'text':
            default:
                return (
                    <div className="prose dark:prose-invert max-w-none p-6 bg-muted rounded-lg">
                        <p>{content.content}</p>
                    </div>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                 <Skeleton className="h-10 w-48" />
                 <Skeleton className="h-96 w-full" />
                 <Skeleton className="h-48 w-full" />
            </div>
        )
    }

    if (!content) {
        return (
            <div className="text-center">
                <p className="text-muted-foreground mb-4">Content not found.</p>
                 <Button onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }
    
    const isAdmin = user?.user_status === 'admin';

    return (
        <div className="space-y-6">
            <header>
                 <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Bucket
                </Button>
                <h1 className="text-2xl sm:text-3xl font-headline font-bold text-foreground">{content.content_title}</h1>
                <Badge variant="outline" className="capitalize mt-2">{content.content_type}</Badge>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Content</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Associated Assignments</CardTitle>
                    <CardDescription>
                        {content.assignments?.length || 0} assignment(s) linked to this content.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {content.assignments && content.assignments.length > 0 ? (
                         <ul className="space-y-3">
                            {content.assignments.map(assignment => (
                                <li key={assignment.id}>
                                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-accent/10 rounded-lg">
                                                <FileText className="h-5 w-5 text-accent" />
                                            </div>
                                            <div>
                                              <p className="font-semibold">{assignment.content_title}</p>
                                              <Badge variant="outline" className="capitalize mt-1">{assignment.content_type}</Badge>
                                            </div>
                                        </div>
                                        {isAdmin ? (
                                            <Button asChild variant="outline" size="sm">
                                                <a href={assignment.file_url} target="_blank" rel="noopener noreferrer">
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download
                                                </a>
                                            </Button>
                                        ) : (
                                            <Button variant="default" size="sm" onClick={() => setSelectedAssignment(assignment)}>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Submit Assignment
                                            </Button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No assignments are associated with this content.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Dialog open={!!selectedAssignment} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit: {selectedAssignment?.content_title}</DialogTitle>
                        <DialogDescription>
                            Upload your file to complete the submission.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmissionSubmit)} className="space-y-4">
                             <FormField
                                control={form.control}
                                name="assignment_file"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Assignment File</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="file" 
                                            onChange={(e) => field.onChange(e.target.files)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                    Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={isSubmitting}>
                                     {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                        ) : (
                                        'Submit'
                                     )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

        </div>
    )

}
