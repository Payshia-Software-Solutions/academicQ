
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
import { Loader2, ArrowLeft, BookOpen, Inbox, FileVideo, Type, FileText, UploadCloud } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const addAssignmentSchema = z.object({
  course_id: z.string({ required_error: 'Please select a course.' }),
  course_bucket_id: z.string({ required_error: 'Please select a bucket.' }),
  content_type: z.string().min(1, { message: 'Content type is required.' }),
  content_title: z.string().min(1, { message: 'Assignment title is required.' }),
  content: z.string().min(1, { message: 'Assignment content is required.' }),
  file: z.any().optional(),
}).superRefine((data, ctx) => {
    const fileBasedTypes = ['video', 'image', 'pdf'];
    if (fileBasedTypes.includes(data.content_type.toLowerCase()) && (!data.file || data.file.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'A file is required for this content type.',
            path: ['file'],
        });
    }
});


type AddAssignmentFormValues = z.infer<typeof addAssignmentSchema>;

interface Course {
  id: string;
  course_name: string;
}
interface Bucket {
  id: string;
  name: string;
}

export function AddAssignmentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AddAssignmentFormValues>({
    resolver: zodResolver(addAssignmentSchema),
    defaultValues: {
      content_type: 'text',
    },
  });

  const selectedCourseId = form.watch('course_id');
  const contentType = form.watch('content_type');
  const isFileBased = ['video', 'image', 'pdf'].includes(contentType.toLowerCase());
  const fileRef = form.register("file");

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
      form.resetField('course_bucket_id');
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

  const onSubmit = async (data: AddAssignmentFormValues) => {
    setIsSubmitting(true);
    try {
       const user = JSON.parse(localStorage.getItem('user') || '{}');
       const userId = user.id || 5;

      const postData: any = {
        course_id: parseInt(data.course_id),
        course_bucket_id: parseInt(data.course_bucket_id),
        content_type: data.content_type,
        content_title: data.content_title,
        content: data.content,
        created_by: userId,
        updated_by: userId,
      }
      
      const formData = new FormData();
      formData.append('data', JSON.stringify(postData));

      if (isFileBased && data.file && data.file.length > 0) {
        formData.append('file', data.file[0]);
      }

      const response = await api.post('/assignments', formData, {
         headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201 || response.status === 200) {
        toast({
          title: 'Assignment Created',
          description: `The assignment "${data.content_title}" has been successfully created.`,
        });
        router.push(`/classes/${data.course_id}`);
      } else {
        toast({
          variant: 'destructive',
          title: 'Creation Failed',
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
            <CardTitle>New Assignment Details</CardTitle>
                <CardDescription>Fill in the details to create a new assignment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

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
                        <FormLabel>Payment Bucket</FormLabel>
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
                name="content_title"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Assignment Title</FormLabel>
                    <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                        <Input placeholder="e.g. Mid-term paper on PHP basics" {...field} className="pl-8" />
                    </FormControl>
                    </div>
                    <FormMessage />
                </FormItem>
                )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="content_type"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Content Type</FormLabel>
                        <div className="relative">
                        <FileVideo className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('file', null);
                            form.clearErrors(['file']);
                        }} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger className="pl-8">
                                <SelectValue placeholder="Select a content type" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="link">Link</SelectItem>
                            <SelectItem value="text">Text</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Content / Description</FormLabel>
                         <FormControl>
                            <Textarea
                              placeholder="Enter assignment description or content..."
                              className="resize-none"
                              rows={4}
                              {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            {isFileBased && (
                 <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload File</FormLabel>
                      <FormControl>
                        <div className="relative">
                           <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            )}
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
                    Creating...
                </>
                ) : (
                'Create Assignment'
                )}
            </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

    