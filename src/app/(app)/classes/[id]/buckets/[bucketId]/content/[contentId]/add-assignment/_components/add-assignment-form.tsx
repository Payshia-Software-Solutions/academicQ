
'use client';

import { useState } from 'react';
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
import { Loader2, ArrowLeft, FileText, UploadCloud, FileVideo, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const addAssignmentSchema = z.object({
  content_type: z.string().min(1, { message: 'Content type is required.' }),
  content_title: z.string().min(1, { message: 'Assignment title is required.' }),
  content: z.string().min(1, { message: 'Assignment content is required.' }),
  deadline_date: z.date({ required_error: 'Deadline date is required.' }),
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

export function AddAssignmentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { id: courseId, bucketId, contentId } = params;


  const form = useForm<AddAssignmentFormValues>({
    resolver: zodResolver(addAssignmentSchema),
    defaultValues: {
      content_type: 'text',
    },
  });

  const contentType = form.watch('content_type');
  const isFileBased = ['video', 'image', 'pdf'].includes(contentType.toLowerCase());
  const fileRef = form.register("file");


  const onSubmit = async (data: AddAssignmentFormValues) => {
    setIsSubmitting(true);
    try {
       const user = JSON.parse(localStorage.getItem('user') || '{}');
       const userId = user.id || 5;

      const postData: any = {
        course_id: parseInt(courseId as string),
        course_bucket_id: parseInt(bucketId as string),
        content_id: parseInt(contentId as string),
        content_type: data.content_type,
        content_title: data.content_title,
        content: data.content,
        deadline_date: format(data.deadline_date, 'yyyy-MM-dd'),
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
        router.push(`/classes/${courseId}/buckets/${bucketId}/content/${contentId}`);
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
  
  const cancelUrl = `/classes/${courseId}/buckets/${bucketId}/content/${contentId}`;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
            <CardTitle>New Assignment Details</CardTitle>
                <CardDescription>Fill in the details to create a new assignment for this content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
               <FormField
                  control={form.control}
                  name="deadline_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Deadline</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
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

            <FormField
                control={form.control}
                name="content_type"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Supporting Material Type (Optional)</FormLabel>
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
                        <SelectItem value="text">No File</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                    <FormMessage />
                </FormItem>
                )}
            />
            
            {isFileBased && (
                 <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Supporting File</FormLabel>
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
                <Link href={cancelUrl}>
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

    
