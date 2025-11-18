
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
import { Loader2, ArrowLeft, BookOpen, DollarSign, FileText, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const createBucketSchema = z.object({
  name: z.string().min(1, { message: 'Bucket name is required.' }),
  description: z.string().min(1, { message: 'Description is required.' }),
  payment_type: z.string().min(1, { message: 'Payment type is required.' }),
  payment_amount: z.coerce.number().positive({ message: 'Amount must be a positive number.' }),
  is_active: z.boolean().default(true),
});

type CreateBucketFormValues = z.infer<typeof createBucketSchema>;

interface CreateBucketFormProps {
    defaultName: string;
    defaultDescription: string;
}

export function CreateBucketForm({ defaultName, defaultDescription }: CreateBucketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const form = useForm<CreateBucketFormValues>({
    resolver: zodResolver(createBucketSchema),
    defaultValues: {
      name: defaultName || '',
      description: defaultDescription || '',
      payment_type: 'month',
      is_active: true,
    },
  });

  const onSubmit = async (data: CreateBucketFormValues) => {
    setIsSubmitting(true);
    try {
       const user = JSON.parse(localStorage.getItem('user') || '{}');
       const userId = user.id || 5; // Fallback to 5 if user id not found

      const postData = {
        ...data,
        course_id: parseInt(courseId),
        created_by: userId,
        updated_by: userId,
      }

      const response = await api.post('/course_buckets', postData);

      if (response.status === 201 || response.status === 200) {
        toast({
          title: 'Course Bucket Created',
          description: `The bucket "${data.name}" has been successfully created.`,
        });
        router.push('/classes');
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
        title: 'Creation Error',
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
        <div className="grid grid-cols-1 gap-8">
          <Card>
              <CardHeader>
                <CardTitle>New Course Bucket Details</CardTitle>
                 <CardDescription>This bucket will define a payment plan for the course.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Bucket Name</FormLabel>
                        <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                            <Input placeholder="e.g. Monthly Subscription" {...field} className="pl-8" />
                        </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
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
                              placeholder="e.g., Access to all course materials on a monthly basis."
                              className="resize-none pl-8"
                              {...field}
                            />
                          </FormControl>
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="payment_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Amount</FormLabel>
                           <div className="relative">
                             <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <FormControl>
                                <Input type="number" step="0.01" placeholder="e.g. 99.99" {...field} className="pl-8" />
                             </FormControl>
                           </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="payment_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Type</FormLabel>
                           <div className="relative">
                             <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="pl-8">
                                  <SelectValue placeholder="Select a payment type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="month">Monthly</SelectItem>
                                <SelectItem value="year">Yearly</SelectItem>
                                <SelectItem value="once">One-Time</SelectItem>
                              </SelectContent>
                            </Select>
                           </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">
                            Activate Bucket
                            </FormLabel>
                            <FormDescription>
                            Make this payment bucket available for new enrollments.
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
                    'Create Bucket'
                  )}
                </Button>
              </CardFooter>
            </Card>
        </div>
      </form>
    </Form>
  );
}

