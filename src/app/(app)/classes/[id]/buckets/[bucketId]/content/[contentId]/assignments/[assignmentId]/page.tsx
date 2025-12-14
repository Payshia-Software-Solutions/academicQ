
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { ArrowLeft, Download, FileText, Paperclip, Upload, Loader2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Preloader } from '@/components/ui/preloader';

interface AssignmentDetails {
    id: string;
    content_type: string;
    content_title: string;
    content: string;
    file_url: string;
    created_at: string;
    course_bucket_id: string;
    deadline_date?: string;
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


export default function AssignmentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { id: courseId, bucketId, contentId, assignmentId } = params;

    const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);

    const form = useForm<SubmissionFormValues>({
        resolver: zodResolver(submissionSchema),
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        
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
    
    const getFullFileUrl = (filePath: string) => {
        if (!filePath) return '#';
        const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL;
        // Check if filePath is already a full URL
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }
        return `${baseUrl}${filePath}`;
    };


    const handleSubmissionSubmit = async (data: SubmissionFormValues) => {
        if (!assignment || !user || !user.student_number || !user.id) {
            toast({ variant: 'destructive', title: 'Error', description: 'Cannot submit assignment. User or assignment details missing.' });
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData();
        const submissionData = {
            student_number: user.student_number,
            course_bucket_id: parseInt(assignment.course_bucket_id),
            assigment_id: parseInt(assignment.id),
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
                setIsSubmissionDialogOpen(false);
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
        if (!assignment) return null;
        const fileUrl = getFullFileUrl(assignment.file_url || assignment.content);

        switch (assignment.content_type.toLowerCase()) {
            case 'video':
                return (
                     <div className="aspect-video w-full">
                        <iframe
                            src={fileUrl}
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
                            src={fileUrl}
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
                         <iframe src={fileUrl} className="w-full h-full border rounded-lg" title={assignment.content_title}>
                             <p>Your browser does not support PDFs. <a href={fileUrl}>Download the PDF</a>.</p>
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
        return <Preloader />;
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
    const isAdmin = user?.user_status === 'admin';
    const isDeadlinePassed = assignment.deadline_date ? new Date(assignment.deadline_date) < new Date() : false;

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
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <Badge variant="secondary" className="capitalize">{assignment.content_type} Assignment</Badge>
                     {assignment.deadline_date && (
                        <Badge variant={isDeadlinePassed ? 'destructive' : 'outline'} className="flex items-center gap-2">
                           <Calendar className="h-3 w-3"/>
                           Deadline: {format(new Date(assignment.deadline_date), 'PP')}
                        </Badge>
                     )}
                </div>
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
                        <div className="flex items-center gap-4 mt-4">
                            {assignment.file_url && (
                                <Button asChild>
                                    <a href={getFullFileUrl(assignment.file_url)} target="_blank" rel="noopener noreferrer">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Material
                                    </a>
                                </Button>
                            )}
                            {!isAdmin && (
                                <Button variant="default" onClick={() => setIsSubmissionDialogOpen(true)}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Submit Assignment
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit: {assignment?.content_title}</DialogTitle>
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
