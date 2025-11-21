
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { users as allUsers } from '@/lib/data';
import { Loader2, DollarSign, Info, ArrowLeft, Users, Paperclip, Building, GitBranch } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const requestPaymentSchema = z.object({
  studentId: z.string({ required_error: 'Please select a student.' }),
  payment_amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a positive number.",
  }),
  bank: z.string().min(1, { message: "Bank name is required."}),
  branch: z.string().min(1, { message: "Branch name is required."}),
  ref: z.string().min(1, { message: "Reference is required."}),
  payment_slip: z
    .any()
    .refine((files) => files?.length == 1, "Payment slip is required.")
    .refine((files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), ".jpg, .jpeg, .png and .webp files are accepted.")
});

type RequestPaymentFormValues = z.infer<typeof requestPaymentSchema>;

export function PaymentRequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<RequestPaymentFormValues>({
    resolver: zodResolver(requestPaymentSchema),
    defaultValues: {
        payment_amount: '',
    }
  });
  
  const fileRef = form.register("payment_slip");

  const onSubmit = async (data: RequestPaymentFormValues) => {
    setIsSubmitting(true);
    
    const selectedStudent = allUsers.find(u => u.id === data.studentId);
    if (!selectedStudent || !selectedStudent.studentNumber) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Selected student does not have a student number.',
        });
        setIsSubmitting(false);
        return;
    }

    const formData = new FormData();
    
    const paymentData = {
        student_number: selectedStudent.studentNumber,
        payment_amount: data.payment_amount,
        bank: data.bank,
        branch: data.branch,
        ref: data.ref,
        request_status: 'pending'
    };

    formData.append('data', JSON.stringify(paymentData));

    if (data.payment_slip && data.payment_slip.length > 0) {
        formData.append('payment_slip', data.payment_slip[0]);
    }

    try {
        const response = await api.post('/payment_requests', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });

        if (response.status === 201 || response.status === 200) {
            toast({
                title: 'Payment Request Sent',
                description: `Request for $${data.payment_amount} sent to ${selectedStudent?.name}.`,
            });
            form.reset();
            router.push('/payments');
        } else {
             toast({
                variant: 'destructive',
                title: 'Request Failed',
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
            <CardTitle>Payment Request Details</CardTitle>
                <CardDescription>Fill in the details below to send a payment request to a student.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Select a student..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allUsers.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.studentNumber})
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
                  name="payment_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g. 1500.00" {...field} className="pl-8" />
                          </FormControl>
                        </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="bank"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank</FormLabel>
                           <div className="relative">
                             <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <FormControl>
                                <Input placeholder="e.g. ABC Bank" {...field} className="pl-8" />
                             </FormControl>
                           </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="branch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch</FormLabel>
                           <div className="relative">
                             <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <FormControl>
                                <Input placeholder="e.g. Main Street Branch" {...field} className="pl-8" />
                             </FormControl>
                           </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                <FormField
                  control={form.control}
                  name="ref"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference</FormLabel>
                       <div className="relative">
                         <Info className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input
                              placeholder="e.g., REF-XYZ-789"
                              {...field}
                               className="pl-8"
                            />
                          </FormControl>
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="payment_slip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attach Payment Slip</FormLabel>
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
                <Link href="/payments">
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Cancel
                </Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                </>
                ) : (
                'Send Request'
                )}
            </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
