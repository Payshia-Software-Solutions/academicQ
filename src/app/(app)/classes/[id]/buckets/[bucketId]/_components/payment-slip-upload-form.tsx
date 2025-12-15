

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
import { Loader2, DollarSign, Info, Paperclip, Building, GitBranch } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { DeliveryDetails } from '@/app/(app)/study-packs/[id]/bucket/[bucketId]/order/[contentId]/_components/item-order-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const requestPaymentSchema = z.object({
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

interface LoggedInUser {
    student_number?: string;
    [key: string]: any;
}

interface PaymentSlipUploadFormProps {
    bucketAmount: string;
    courseId: string;
    bucketId: string;
    onSuccess?: () => void;
    paymentType?: 'course_fee' | 'study_pack';
    deliveryDetails?: DeliveryDetails;
    orderableItemId?: string;
}

interface Bank {
    id: string;
    name: string;
}

interface Branch {
    id: string;
    branch_name: string;
}

export function PaymentSlipUploadForm({ bucketAmount, courseId, bucketId, onSuccess, paymentType = 'course_fee', deliveryDetails, orderableItemId }: PaymentSlipUploadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isBranchesLoading, setIsBranchesLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<RequestPaymentFormValues>({
    resolver: zodResolver(requestPaymentSchema),
    defaultValues: {
        payment_amount: bucketAmount || '',
        bank: '',
        branch: '',
        ref: ''
    }
  });

  const selectedBankId = form.watch('bank');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }
     async function fetchBanks() {
        try {
            const response = await api.get('/banks');
            if (response.data.status === 'success' && Array.isArray(response.data.data)) {
                setBanks(response.data.data);
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to load banks',
                description: 'Could not fetch the list of banks.'
            });
        }
    }
    fetchBanks();
  }, [toast]);

  useEffect(() => {
    form.setValue('payment_amount', bucketAmount);
  }, [bucketAmount, form]);
  
  useEffect(() => {
    if (!selectedBankId) {
      setBranches([]);
      form.setValue('branch', '');
      return;
    }

    async function fetchBranches() {
      setIsBranchesLoading(true);
      try {
        const response = await api.get(`/bank_branches?bank_id=${selectedBankId}`);
        if (response.data.status === 'success' && Array.isArray(response.data.data)) {
          setBranches(response.data.data);
        } else {
          setBranches([]);
        }
      } catch (e) {
        setBranches([]);
        toast({ variant: 'destructive', title: 'Error fetching branches' });
      } finally {
        setIsBranchesLoading(false);
      }
    }

    fetchBranches();
  }, [selectedBankId, form, toast]);


  const fileRef = form.register("payment_slip");

  const onSubmit = async (data: RequestPaymentFormValues) => {
    setIsSubmitting(true);
    
    if (!user || !user.student_number) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not find student number. Please log in again.',
        });
        setIsSubmitting(false);
        return;
    }

    const formData = new FormData();
    
    // This object will contain all data to be stringified
    let combinedData: any = {};

    const selectedBankName = banks.find(b => b.id === data.bank)?.name || data.bank;

    // Common payment request data
    const payment_request_data = {
        student_number: user.student_number,
        course_id: courseId,
        course_bucket_id: bucketId,
        payment_amount: data.payment_amount,
        bank: selectedBankName,
        branch: data.branch,
        ref: data.ref,
        request_status: 'pending',
        payment_status: paymentType,
        ref_id: ''
    };

    if (paymentType === 'study_pack' && deliveryDetails && orderableItemId) {
        // If it's a study pack, we are creating an order and a payment request together
        const student_order_data = {
            student_number: user.student_number,
            orderable_item_id: parseInt(orderableItemId),
            order_status: "pending",
            ...deliveryDetails
        };
        combinedData.student_order_data = student_order_data;
        combinedData.payment_request_data = payment_request_data;

    } else {
        // If it's just a course fee, only include payment request data
        combinedData.payment_request_data = payment_request_data;
    }
    
    formData.append('data', JSON.stringify(combinedData));

    if (data.payment_slip && data.payment_slip.length > 0) {
        formData.append('payment_slip', data.payment_slip[0]);
    }
    
    // Determine the correct endpoint
    const endpoint = paymentType === 'study_pack' ? '/student-orders' : '/payment_requests';

    try {
        const response = await api.post(endpoint, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });

        if (response.status === 201 || response.status === 200) {
            toast({
                title: 'Request Sent Successfully',
                description: `Your request has been sent for review. You will be notified once it is approved.`,
            });
            form.reset();
            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh();
            }
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
                control={form.control}
                name="payment_amount"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                        <Input type="number" step="0.01" {...field} className="pl-8" />
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
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger className="pl-8">
                                    <SelectValue placeholder="Select a bank" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {banks.map(bank => (
                                        <SelectItem key={bank.id} value={bank.id}>{bank.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedBankId || isBranchesLoading}>
                                <FormControl>
                                <SelectTrigger className="pl-8">
                                    <SelectValue placeholder={isBranchesLoading ? "Loading..." : "Select a branch"} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {branches.map(branch => (
                                        <SelectItem key={branch.id} value={branch.branch_name}>{branch.branch_name}</SelectItem>
                                    ))}
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
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                    </>
                    ) : (
                    'Submit for Review'
                    )}
                </Button>
            </div>
      </form>
    </Form>
  );
}

    