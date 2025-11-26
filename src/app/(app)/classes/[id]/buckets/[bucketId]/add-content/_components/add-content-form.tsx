
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, BookOpen, Link as LinkIcon, Type, FileVideo, UploadCloud } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp", "video/mp4", "video/mpeg"];

const addContentSchema = z.object({
  content_type: z.string().min(1, { message: 'Content type is required.' }),
  content_title: z.string().min(1, { message: 'Content title is required.' }),
  content: z.string().optional(),
  file: z.any().optional(),
  is_active: z.boolean().default(true),
}).superRefine((data, ctx) => {
  const fileBasedTypes = ['VIDEO', 'IMAGE', 'PDF'];
  const textBasedTypes = ['LINK', 'TEXT'];

  if (fileBasedTypes.includes(data.content_type) && (!data.file || data.file.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A file is required for this content type.',
      path: ['file'],
    });
  }

  if (textBasedTypes.includes(data.content_type) && !data.content) {
     ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Content is required for this content type.',
      path: ['content'],
    });
  }
});


type AddContentFormValues = z.infer<typeof addContentSchema>;

export function AddContentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const bucketId = params.bucketId as string;

  const form = useForm<AddContentFormValues>({
    resolver: zodResolver(addContentSchema),
    defaultValues: {
      content_type: 'VIDEO',
      content_title: '',
      content: '',
      is_active: true,
    },
  });
  
  const fileRef = form.register("file");
  const contentType = form.watch('content_type');
  const isFileBased = ['VIDEO', 'IMAGE', 'PDF'].includes(contentType);

  const onSubmit = async (data: AddContentFormValues) => {
    setIsSubmitting(true);
    try {
       const user = JSON.parse(localStorage.getItem('user') || '{}');
       const userId = user.id || 5; // Fallback user ID

       const formData = new FormData();
       const postData: any = {
        content_type: data.content_type,
        content_title: data.content_title,
        is_active: data.is_active,
        course_id: parseInt(courseId),
        course_bucket_id: parseInt(bucketId),
        created_by: userId,
        updated_by: userId,
      };

      if (!isFileBased) {
        postData.content = data.content;
      }

      formData.append('data', JSON.stringify(postData));

      if (isFileBased && data.file && data.file.length > 0) {
        formData.append('file', data.file[0]);
      } else if (isFileBased) {
         toast({
            variant: 'destructive',
            title: 'File Required',
            description: `Please select a file for the ${data.content_type} content type.`,
         });
         setIsSubmitting(false);
         return;
      }


      const response = await api.post('/course-bucket-contents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201 || response.status === 200) {
        toast({
          title: 'Content Added',
          description: `The content "${data.content_title}" has been successfully added.`,
        });
        router.push(`/classes/${courseId}`);
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
            <CardTitle>Add New Content</CardTitle>
                <CardDescription>Fill in the details to add new content to this bucket.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <FormField
                control={form.control}
                name="content_title"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Content Title</FormLabel>
                    <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                        <Input placeholder="e.g. Lesson 1: Introduction to HTML" {...field} className="pl-8" />
                    </FormControl>
                    </div>
                    <FormMessage />
                </FormItem>
                )}
            />

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
                        form.setValue('content', '');
                        form.setValue('file', null);
                        form.clearErrors(['content', 'file']);
                    }} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger className="pl-8">
                            <SelectValue placeholder="Select a content type" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="VIDEO">Video</SelectItem>
                        <SelectItem value="IMAGE">Image</SelectItem>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="LINK">Link</SelectItem>
                        <SelectItem value="TEXT">Text</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                    <FormMessage />
                </FormItem>
                )}
            />

            {isFileBased ? (
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
            ) : (
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Content / Link</FormLabel>
                         <FormControl>
                            <Textarea
                              placeholder="Enter content or URL..."
                              className="resize-none"
                              rows={4}
                              {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}
            
            <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">
                        Activate Content
                        </FormLabel>
                        <FormDescription>
                        Make this content immediately available.
                        </FormDescription>
                    </div>
                    <FormControl>
                        <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    </FormItem>
                )}
                />

            </CardContent>
            <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
                <Link href={`/classes/${courseId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Cancel
                </Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                </>
                ) : (
                'Add Content'
                )}
            </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
