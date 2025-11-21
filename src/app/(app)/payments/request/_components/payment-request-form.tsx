
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
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { users as allUsers } from '@/lib/data';
import { Loader2, DollarSign, CalendarIcon, Info, ArrowLeft, Users, FileImage, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const requestPaymentSchema = z.object({
  studentId: z.string({ required_error: 'Please select a student.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be a positive number.' }),
  dueDate: z.date({ required_error: 'Please select a due date.' }),
  description: z.string().min(1, { message: "Description is required."}),
  attachment: z
    .any()
    .refine((files) => files?.length == 1, "Attachment is required.")
    .refine((files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), ".jpg, .jpeg, .png and .webp files are accepted.")
    .optional(),
});

type RequestPaymentFormValues = z.infer<typeof requestPaymentSchema>;

export function PaymentRequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<RequestPaymentFormValues>({
    resolver: zodResolver(requestPaymentSchema),
  });

  const onSubmit = async (data: RequestPaymentFormValues) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const selectedStudent = allUsers.find(u => u.id === data.studentId);

    toast({
      title: 'Payment Request Sent (Simulation)',
      description: `Request for $${data.amount} sent to ${selectedStudent?.name}.`,
    });
    
    setIsSubmitting(false);
    form.reset();
    router.push('/payments');
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
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                           <div className="relative">
                             <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <FormControl>
                                <Input type="number" step="0.01" placeholder="e.g. 150.00" {...field} className="pl-8" />
                             </FormControl>
                           </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
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
                                disabled={(date) =>
                                  date < new Date()
                                }
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description / Notes</FormLabel>
                       <FormControl>
                        <Textarea
                          placeholder="e.g., Monthly fee for Web Development course..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="attachment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attach Image (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                           <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                type="file" 
                                className="pl-10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                onChange={(e) => field.onChange(e.target.files)}
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
