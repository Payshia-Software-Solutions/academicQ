
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, BookOpen, Inbox, FileText, Paperclip } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ACCEPTED_FILE_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

const assignmentSubmissionSchema = z.object({
  course_id: z.string({ required_error: 'Please select a course.' }),
  course_bucket_id: z.string({ required_error: 'Please select a bucket.' }),
  assigment_id: z.string({ required_error: 'Please select an assignment.' }),
  assignment_file: z
    .any()
    .refine((files) => files?.length == 1, "Assignment file is required.")
    // .refine((files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type), "Only .pdf and .doc/docx files are accepted.")
});

type AssignmentSubmissionFormValues = z.infer<typeof assignmentSubmissionSchema>;

interface Course {
  id: string;
  course_name: string;
}
interface Bucket {
  id: string;
  name: string;
}
interface Assignment {
    id: string;
    content_title: string;
}

interface LoggedInUser {
    student_number?: string;
    id?: number;
    [key: string]: any;
}


export function AssignmentSubmissionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }
  }, []);

  const form = useForm<AssignmentSubmissionFormValues>({
    resolver: zodResolver(assignmentSubmissionSchema),
  });

  const fileRef = form.register("assignment_file");
  const selectedCourseId = form.watch('course_id');
  const selectedBucketId = form.watch('course_bucket_id');


  useEffect(() => {
    async function fetchCourses() {
      try {
        const coursesRes = await api.get('/courses');
        setCourses(coursesRes.data.records || []);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load courses',
          description: 'Could not fetch courses.',
        });
      }
    }
    fetchCourses();
  }, [toast]);

  useEffect(() => {
    if (!selectedCourseId) {
      setBuckets([]);
      setAssignments([]);
      form.resetField('course_bucket_id');
      form.resetField('assigment_id');
      return;
    }
    async function fetchBuckets() {
      try {
        const response = await api.get(`/course_buckets/course/${selectedCourseId}`);
        setBuckets(response.data.data || []);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load buckets',
          description: 'Could not fetch buckets for the selected course.',
        });
        setBuckets([]);
      }
    }
    fetchBuckets();
  }, [selectedCourseId, toast, form]);

  useEffect(() => {
    if (!selectedBucketId) {
        setAssignments([]);
        form.resetField('assigment_id');
        return;
    }
    async function fetchAssignments() {
        try {
            // Assuming an endpoint exists to fetch assignments by bucket
            // This endpoint might need to be created in the backend
            const response = await api.get(`/assignments/bucket/${selectedBucketId}`);
            setAssignments(response.data.data || []);
        } catch (error) {
             // For now, let's use all assignments as a fallback
            try {
                const response = await api.get(`/assignments`);
                setAssignments(response.data.data || []);
            } catch (fallbackError) {
                toast({
                    variant: 'destructive',
                    title: 'Failed to load assignments',
                    description: 'Could not fetch assignments for the selected bucket.',
                });
                setAssignments([]);
            }
        }
    }
    fetchAssignments();
  }, [selectedBucketId, toast, form]);

  const onSubmit = async (data: AssignmentSubmissionFormValues) => {
    setIsSubmitting(true);

    if (!user || !user.student_number || !user.id) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not find student details. Please log in again.',
        });
        setIsSubmitting(false);
        return;
    }

    const formData = new FormData();
    
    const submissionData = {
      student_number: user.student_number,
      course_bucket_id: parseInt(data.course_bucket_id),
      assigment_id: parseInt(data.assigment_id),
      grade: null,
      created_by: user.id,
      is_active: 1
    };

    formData.append('data', JSON.stringify(submissionData));

    if (data.assignment_file && data.assignment_file.length > 0) {
        formData.append('assignment_file', data.assignment_file[0]);
    }

    try {
        const response = await api.post('/assignment-submissions', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });

        if (response.status === 201 || response.status === 200) {
            toast({
                title: 'Assignment Submitted',
                description: `Your assignment has been successfully submitted.`,
            });
            form.reset();
            router.push('/classes');
        } else {
             toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: response.data.message || 'An unknown error occurred.',
            });
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Submission Error',
            description:
            error.response?.data?.message ||
            'Could not connect to the server. Please try again later.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
                <CardTitle>Submit Your Assignment</CardTitle>
                <CardDescription>Select the course and assignment, then upload your file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {user && user.student_number && (
                    <div className="p-3 rounded-md bg-muted text-sm">
                        <span className="font-medium text-muted-foreground">Submitting as: </span>
                        <span className="font-mono">{user.student_number}</span>
                    </div>
                )}
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="course_id"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Course</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Select a course..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {courses.map(course => (
                                    <SelectItem key={course.id} value={course.id}>
                                    {course.course_name}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="course_bucket_id"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Bucket</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCourseId || buckets.length === 0}>
                                <FormControl>
                                <SelectTrigger>
                                    <Inbox className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder={!selectedCourseId ? "Select a course first" : "Select a bucket..."} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {buckets.map(bucket => (
                                    <SelectItem key={bucket.id} value={bucket.id}>
                                    {bucket.name}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
            
                <FormField
                    control={form.control}
                    name="assigment_id"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Assignment</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedBucketId || assignments.length === 0}>
                            <FormControl>
                            <SelectTrigger>
                                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder={!selectedBucketId ? "Select a bucket first" : "Select an assignment..."} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {assignments.map(assignment => (
                                <SelectItem key={assignment.id} value={assignment.id}>
                                {assignment.content_title}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="assignment_file"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Attach Assignment File</FormLabel>
                        <FormControl>
                            <div className="relative">
                            <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="file" 
                                    className="pl-10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    {...fileRef}
                                />
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                    <Link href="/classes">
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Cancel
                    </Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                    </>
                    ) : (
                    'Submit Assignment'
                    )}
                </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
