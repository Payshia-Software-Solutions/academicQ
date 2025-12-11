

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
import { Loader2, ArrowLeft, BookOpen, Hash, FileText, Star, Tag, DollarSign, UploadCloud, Video } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const editClassSchema = z.object({
  course_name: z.string().min(1, { message: 'Course name is required.' }),
  course_code: z.string().min(1, { message: 'Course code is required.' }),
  description: z.string().min(1, { message: 'Description is required.' }),
  credits: z.coerce.number().positive({ message: 'Credits must be a positive number.' }),
  course_fee: z.coerce.number().nonnegative({ message: 'Course fee must be a positive number.' }),
  registration_fee: z.coerce.number().nonnegative({ message: 'Registration fee must be a positive number.' }),
  img_url: z.any().optional(),
  payment_status: z.string().min(1, { message: 'Payment status is required.' }),
  intro_url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type EditClassFormValues = z.infer<typeof editClassSchema>;

interface EditClassFormProps {
    classId: string;
}

export function EditClassForm({ classId }: EditClassFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<EditClassFormValues>({
    resolver: zodResolver(editClassSchema),
  });

  const getFullFileUrl = (filePath: string) => {
      if (!filePath) return '';
      if (filePath.startsWith('http')) return filePath;
      const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL || '';
      return `${baseUrl}${filePath}`;
  };

  useEffect(() => {
    async function fetchClassData() {
        try {
            const response = await api.get(`/courses/${classId}`);
            if (response.data.status === 'success') {
                const classData = response.data.data;
                form.reset({
                    course_name: classData.course_name,
                    course_code: classData.course_code,
                    description: classData.description,
                    credits: parseFloat(classData.credits),
                    course_fee: parseFloat(classData.course_fee),
                    registration_fee: parseFloat(classData.registration_fee),
                    payment_status: classData.payment_status,
                    intro_url: classData.intro_url || '',
                });
                if (classData.img_url) {
                    setCurrentImage(getFullFileUrl(classData.img_url));
                }
            } else {
                 toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch class data.' });
            }
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch class data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchClassData();
  }, [classId, form, toast]);
  
  const imgUrlRef = form.register("img_url");

  const onSubmit = async (data: EditClassFormValues) => {
    setIsSubmitting(true);
    
    const formData = new FormData();
    const changedData: { [key: string]: any } = {};
    const dirtyFields = form.formState.dirtyFields;

    Object.keys(dirtyFields).forEach(key => {
        const fieldKey = key as keyof EditClassFormValues;
        if (fieldKey !== 'img_url') {
             formData.append(fieldKey, data[fieldKey] as string);
        }
    });

    if (data.img_url && data.img_url[0]) {
      formData.append('img_url', data.img_url[0]);
    }
    
    if (Object.keys(dirtyFields).length === 0) {
        toast({ title: "No Changes", description: "You haven't made any changes." });
        setIsSubmitting(false);
        return;
    }
    
    // API expects `_method` for updates with FormData
    formData.append('_method', 'PUT');

    try {
      const response = await api.post(`/courses/${classId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'Class Updated',
          description: `${data.course_name} has been successfully updated.`,
        });
        router.push('/classes');
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
        title: 'Update Error',
        description:
          error.response?.data?.message ||
          'Could not connect to the server. Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
      return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-8">
          <Card>
              <CardHeader>
                <CardTitle>Edit Class Details</CardTitle>
                 <CardDescription>Make changes to the class information below.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="course_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Name</FormLabel>
                           <div className="relative">
                             <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <FormControl>
                                <Input placeholder="e.g. Intro to Programming" {...field} className="pl-8" />
                             </FormControl>
                           </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="course_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Code</FormLabel>
                           <div className="relative">
                             <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <FormControl>
                                <Input placeholder="e.g. CS101" {...field} className="pl-8" />
                             </FormControl>
                           </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                       <div className="relative">
                         <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Basic programming concepts using C and Python."
                              className="resize-none pl-8"
                              {...field}
                            />
                          </FormControl>
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="intro_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intro Video URL (Optional)</FormLabel>
                       <div className="relative">
                         <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                             <Input placeholder="e.g., https://www.youtube.com/watch?v=..." {...field} className="pl-8" />
                          </FormControl>
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="course_fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Fee</FormLabel>
                           <div className="relative">
                             <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <FormControl>
                                <Input type="number" step="0.01" placeholder="e.g. 299.99" {...field} />
                             </FormControl>
                           </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="registration_fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Fee</FormLabel>
                           <div className="relative">
                             <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <FormControl>
                                <Input type="number" step="0.01" placeholder="e.g. 25.00" {...field} />
                             </FormControl>
                           </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="credits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credits</FormLabel>
                           <div className="relative">
                             <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <FormControl>
                                <Input type="number" placeholder="e.g. 3" {...field} className="pl-8" />
                             </FormControl>
                           </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label>Current Image</Label>
                        <div className="mt-2 w-full h-48 relative rounded-md border bg-muted overflow-hidden">
                            {currentImage ? (
                                <Image src={currentImage} alt="Current course image" fill style={{ objectFit: 'cover' }} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">No image</div>
                            )}
                        </div>
                    </div>
                  <FormField
                    control={form.control}
                    name="img_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Course Image (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                  type="file" 
                                  className="pl-10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                  accept="image/*"
                                  {...imgUrlRef}
                              />
                          </div>
                        </FormControl>
                         <FormDescription>
                            Upload a new image to replace the current one.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 </div>
                 <FormField
                    control={form.control}
                    name="payment_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Frequency</FormLabel>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="pl-8">
                                <SelectValue placeholder="Select a payment frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="year">Yearly</SelectItem>
                              <SelectItem value="once">Once</SelectItem>
                            </SelectContent>
                          </Select>
                          </div>
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
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardFooter>
            </Card>
        </div>
      </form>
    </Form>
  );
}
