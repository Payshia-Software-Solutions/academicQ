
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, DollarSign, ArrowLeft, Users, BookOpen, Inbox, Receipt } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

const coursePaymentSchema = z.object({
  course_id: z.string({ required_error: 'Please select a course.' }),
  course_bucket_id: z.string({ required_error: 'Please select a bucket.' }),
  student_number: z.string({ required_error: 'Please select a student.' }),
  payment_request_id: z.coerce.number().optional(),
  payment_amount: z.coerce.number().positive({ message: 'Amount must be a positive number.' }),
  discount_amount: z.coerce.number().min(0, { message: 'Discount cannot be negative.' }).optional(),
});

type CoursePaymentFormValues = z.infer<typeof coursePaymentSchema>;

interface Course {
  id: string;
  course_name: string;
}
interface Bucket {
  id: string;
  name: string;
  bucket_name?: string;
}
interface Student {
  id: string;
  student_number: string;
  name: string;
}

interface PaymentRequest {
    id: string;
    student_number: string;
    payment_amount: string;
    course_id: string;
    course_bucket_id: string;
}

interface CoursePaymentFormProps {
    paymentRequest?: PaymentRequest;
    onPaymentSuccess?: () => void;
}


export function CoursePaymentForm({ paymentRequest, onPaymentSuccess }: CoursePaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const isDialogMode = !!paymentRequest;

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CoursePaymentFormValues>({
    resolver: zodResolver(coursePaymentSchema),
    defaultValues: {
      student_number: paymentRequest?.student_number || '',
      course_id: paymentRequest?.course_id || '',
      course_bucket_id: paymentRequest?.course_bucket_id || '',
      payment_request_id: paymentRequest ? parseInt(paymentRequest.id) : undefined,
      payment_amount: paymentRequest ? parseFloat(paymentRequest.payment_amount) : undefined,
      discount_amount: 0.00
    }
  });

  const selectedCourseId = form.watch('course_id');

  useEffect(() => {
    async function fetchInitialData() {
      if (isDialogMode) return;
      try {
        const [coursesRes, studentsRes] = await Promise.all([
          api.get('/courses'),
          api.get('/users'),
        ]);
        setCourses(coursesRes.data.records || []);
        
        setStudents(studentsRes.data.records.filter((u: any) => u.user_status === 'student' && u.student_number) || []);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load data',
          description: 'Could not fetch courses or students.',
        });
      }
    }
    fetchInitialData();
  }, [toast, isDialogMode]);
  
  useEffect(() => {
    if (paymentRequest) {
        const { student_number, course_id, course_bucket_id, payment_amount, id } = paymentRequest;
        form.reset({
            student_number: student_number,
            course_id: course_id.toString(),
            course_bucket_id: course_bucket_id.toString(),
            payment_amount: parseFloat(payment_amount),
            payment_request_id: parseInt(id),
            discount_amount: 0.00,
        });
    }
  }, [paymentRequest, form]);

  useEffect(() => {
    if (!selectedCourseId) {
      setBuckets([]);
      return;
    }
    async function fetchBuckets() {
      try {
        const response = await api.get(`/course_buckets/course/${selectedCourseId}`);
        setBuckets(response.data.data || []);
        if(!isDialogMode) {
          form.setValue('course_bucket_id', ''); 
        }
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
  }, [selectedCourseId, toast, form, isDialogMode]);

  const onSubmit = async (data: CoursePaymentFormValues) => {
    setIsSubmitting(true);
    
    const postData = {
      ...data,
      course_id: parseInt(data.course_id),
      course_bucket_id: parseInt(data.course_bucket_id),
      payment_request_id: data.payment_request_id || null,
    }

    try {
      const response = await api.post('/student-payment-courses', postData);
      if (response.status === 201 || response.status === 200) {
        toast({
          title: 'Payment Recorded',
          description: `The payment has been successfully recorded.`,
        });
        if (onPaymentSuccess) {
            onPaymentSuccess();
        } else {
            router.push('/payments');
        }
      } else {
         toast({
            variant: 'destructive',
            title: 'Payment Failed',
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

  const formContent = (
      <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField
              control={form.control}
              name="student_number"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isDialogMode}>
                      <FormControl>
                      <SelectTrigger>
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Select a student..." />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      {students.map(student => (
                          <SelectItem key={student.id} value={student.student_number}>
                          {student.name} ({student.student_number})
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
              name="course_id"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isDialogMode}>
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={isDialogMode || !selectedCourseId || buckets.length === 0}>
                      <FormControl>
                      <SelectTrigger>
                          <Inbox className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder={!selectedCourseId ? "Select a course first" : "Select a bucket..."} />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      {buckets.map(bucket => (
                          <SelectItem key={bucket.id} value={bucket.id}>
                          {bucket.name || bucket.bucket_name}
                          </SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
              />
          </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="payment_amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Payment Amount</FormLabel>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g. 25000.00" {...field} className="pl-8" disabled={isDialogMode}/>
                            </FormControl>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="discount_amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Discount Amount (Optional)</FormLabel>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g. 2000.00" {...field} className="pl-8" />
                            </FormControl>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="payment_request_id"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Payment Request ID (Optional)</FormLabel>
                          <div className="relative">
                            <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                            <Input type="number" placeholder="e.g. 45" {...field} className="pl-8" disabled={isDialogMode}/>
                            </FormControl>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
      </CardContent>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {isDialogMode ? (
            <>
                {formContent}
                 <div className="flex justify-end pt-6">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Recording Payment...
                        </>
                        ) : (
                        'Confirm and Record Payment'
                        )}
                    </Button>
                </div>
            </>
        ) : (
            <Card>
                <CardHeader>
                    <CardTitle>Course Payment Details</CardTitle>
                    <CardDescription>Fill in the details to record a student's payment for a course bucket.</CardDescription>
                </CardHeader>
                {formContent}
                <CardFooter className="flex justify-between">
                    <Button variant="outline" asChild>
                        <Link href="/payments">
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
                        'Record Payment'
                        )}
                    </Button>
                </CardFooter>
            </Card>
        )}
      </form>
    </Form>
  );
}
