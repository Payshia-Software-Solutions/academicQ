

'use client';

import { useState, useMemo } from 'react';
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
import { users as allUsers, payments as allPayments } from '@/lib/data';
import { Loader2, DollarSign, CalendarIcon, Info, ArrowLeft, Users, Receipt, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const addPaymentSchema = z.object({
  studentId: z.string({ required_error: 'Please select a student.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be a positive number.' }),
  date: z.date({ required_error: 'Please select a payment date.' }),
  paymentMethod: z.string({ required_error: 'Please select a payment method.' }),
  notes: z.string().optional(),
});

type AddPaymentFormValues = z.infer<typeof addPaymentSchema>;

export function AddPaymentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AddPaymentFormValues>({
    resolver: zodResolver(addPaymentSchema),
  });

  const selectedStudentId = form.watch('studentId');

  const studentInfo = useMemo(() => {
    if (!selectedStudentId) return null;
    const student = allUsers.find(u => u.id === selectedStudentId);
    if (!student) return null;

    const studentPayments = allPayments
      .filter(p => p.studentId === selectedStudentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
    const dueBalance = studentPayments
      .filter(p => p.status === 'Pending')
      .reduce((acc, p) => acc + p.amount, 0);

    return {
      name: student.name,
      paymentHistory: studentPayments,
      dueBalance,
    };
  }, [selectedStudentId]);

  const onSubmit = async (data: AddPaymentFormValues) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: 'Payment Recorded (Simulation)',
      description: `Payment of LKR ${data.amount.toLocaleString()} for ${studentInfo?.name} on ${format(data.date, 'PPP')} has been recorded.`,
    });
    
    setIsSubmitting(false);
    form.reset();
    router.push('/payments');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Student Selection & Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> Student</CardTitle>
                <CardDescription>Select a student to view their financial details and record a payment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                
                {studentInfo && (
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between p-3 text-sm border rounded-lg bg-muted/50">
                             <span className="text-muted-foreground">Due Balance</span>
                             <span className="font-bold text-lg text-destructive">LKR {studentInfo.dueBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2 text-sm flex items-center gap-2"><Receipt /> Payment History</h4>
                            <Card className="h-96 overflow-y-auto">
                                <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentInfo.paymentHistory.length > 0 ? studentInfo.paymentHistory.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell className="text-xs">{format(new Date(p.date), 'dd MMM yyyy')}</TableCell>
                                                <TableCell className="text-xs font-medium">LKR {p.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                <TableCell className="text-xs"><Badge variant={p.status === 'Paid' ? 'secondary' : 'destructive'}>{p.status}</Badge></TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No history</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

              </CardContent>
            </Card>
          </div>

          {/* Right Column: Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>New Payment Details</CardTitle>
                 <CardDescription>Enter the new payment information. This action cannot be undone.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                                <Input type="number" step="0.01" placeholder="e.g. 150.00" {...field} className="pl-8" disabled={!selectedStudentId} />
                             </FormControl>
                           </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Payment Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={!selectedStudentId}
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
                                  date > new Date() || date < new Date("1900-01-01")
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
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedStudentId}>
                        <FormControl>
                          <SelectTrigger>
                             <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Select a payment method..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Credit Card">Credit Card</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Information / Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Transaction ID, reference number, or special notes..."
                          className="resize-none"
                          {...field}
                          disabled={!selectedStudentId}
                        />
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
                <Button type="submit" disabled={isSubmitting || !selectedStudentId}>
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
          </div>
        </div>
      </form>
    </Form>
  );
}
