
'use client';

import { useState, useEffect } from 'react';
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
import { Preloader } from '@/components/ui/preloader';

const editContentSchema = z.object({
  content_type: z.string().min(1, { message: 'Content type is required.' }),
  content_title: z.string().min(1, { message: 'Content title is required.' }),
  content: z.string().optional(),
  file: z.any().optional(),
  is_active: z.boolean().default(true),
}).superRefine((data, ctx) => {
  const textBasedTypes = ['LINK', 'TEXT', 'YOUTUBE_VIDEO'];
  
  if (textBasedTypes.includes(data.content_type) && !data.content) {
     ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Content is required for this content type.',
      path: ['content'],
    });
  }
});

type EditContentFormValues = z.infer<typeof editContentSchema>;

export function EditContentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { id: courseId, bucketId, contentId } = params;

  const form = useForm<EditContentFormValues>({
    resolver: zodResolver(editContentSchema),
  });

  const fileRef = form.register("file");
  const contentType = form.watch('content_type');
  const isFileBased = ['VIDEO', 'IMAGE', 'PDF'].includes(contentType);
  const cancelUrl = `/classes/${courseId}/buckets/${bucketId}`;

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await api.get(`/course-bucket-contents/${contentId}`);
        if (response.data.status === 'success') {
          const content = response.data.data;
          form.reset({
            content_type: content.content_type,
            content_title: content.content_title,
            content: content.content,
            is_active: content.is_active === '1'
          });
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch content data.' });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'API Error', description: 'Could not fetch content data.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchContent();
  }, [contentId, form, toast]);

  const onSubmit = async (data: EditContentFormValues) => {
    setIsSubmitting(true);
    
    if (Object.keys(form.formState.dirtyFields).length === 0 && !data.file?.[0]) {
        toast({ title: "No changes detected." });
        setIsSubmitting(false);
        return;
    }

    try {
      const formData = new FormData();
      const postData: any = {
        _method: 'PUT',
        content_type: data.content_type,
        content_title: data.content_title,
        is_active: data.is_active,
        course_id: parseInt(courseId as string),
        course_bucket_id: parseInt(bucketId as string),
      };

      if (!isFileBased) {
        postData.content = data.content;
      }
      
      formData.append('data', JSON.stringify(postData));

      if (isFileBased && data.file?.[0]) {
        formData.append('file', data.file[0]);
      }
      
      const response = await api.post(`/course-bucket-contents/${contentId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        toast({
          title: 'Content Updated',
          description: `The content "${data.content_title}" has been successfully updated.`,
        });
        router.push(cancelUrl);
        router.refresh();
      } else {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: response.data.message || 'An unknown error occurred.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: error.response?.data?.message || 'Could not connect to the server.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
      return (
          <Card>
              <CardContent>
                  <Preloader />
              </CardContent>
          </Card>
      );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
                <CardTitle>Edit Content</CardTitle>
                <CardDescription>Make changes to the content details below.</CardDescription>
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
                            <Input placeholder="e.g. Lesson 1: Introduction" {...field} className="pl-8" />
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
                        }} value={field.value}>
                            <FormControl>
                            <SelectTrigger className="pl-8">
                                <SelectValue placeholder="Select a content type" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="VIDEO">Video</SelectItem>
                            <SelectItem value="YOUTUBE_VIDEO">Youtube Video</SelectItem>
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
                        <FormLabel>New File (Optional)</FormLabel>
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
                        <FormDescription>Upload a new file to replace the existing one.</FormDescription>
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
                            <FormLabel>{contentType === 'YOUTUBE_VIDEO' ? 'YouTube Video URL' : 'Content / Link'}</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder={contentType === 'YOUTUBE_VIDEO' ? 'e.g. https://www.youtube.com/watch?v=...' : 'Enter content or URL...'}
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
                            Make this content available.
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
                    <Link href={cancelUrl}>
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Cancel
                    </Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </>
                    ) : (
                    'Save Changes'
                    )}
                </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
