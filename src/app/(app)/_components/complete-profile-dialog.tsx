
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required.'),
  name_with_initials: z.string().min(1, 'Name with initials is required.'),
  name_on_certificate: z.string().min(1, 'Name for certificate is required.'),
  address_line_1: z.string().min(1, 'Address is required.'),
  address_line_2: z.string().optional(),
  city: z.string().min(1, 'City is required.'),
  telephone_1: z.string().min(1, 'Primary phone number is required.'),
  telephone_2: z.string().optional(),
  gender: z.string().min(1, 'Gender is required.'),
  civil_status: z.string().min(1, 'Civil status is required.'),
  birth_day: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid birth date is required.',
  }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface CompleteProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  studentNumber: string;
}

export function CompleteProfileDialog({ isOpen, onOpenChange, studentNumber }: CompleteProfileDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
        full_name: '',
        name_with_initials: '',
        name_on_certificate: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        telephone_1: '',
        telephone_2: '',
        gender: '',
        civil_status: '',
        birth_day: '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
        const postData = {
            ...data,
            student_number: studentNumber,
            e_mail: JSON.parse(localStorage.getItem('user') || '{}').email,
            nic: JSON.parse(localStorage.getItem('user') || '{}').nic,
        };

        const response = await api.post('/user-full-details', postData);

        if (response.data.message === "Record created successfully.") {
            toast({
                title: 'Profile Updated',
                description: 'Your details have been saved successfully.',
            });
            onOpenChange(false);
        } else {
             throw new Error(response.data.message || "An unknown error occurred.");
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'Could not save your profile details.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please provide your full details. This is required to continue.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6 pl-1">
            <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name_with_initials" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Name with Initials</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="name_on_certificate" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Name for Certificate</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
             </div>
             <FormField control={form.control} name="address_line_1" render={({ field }) => (
                <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="address_line_2" render={({ field }) => (
                <FormItem>
                    <FormLabel>Address Line 2 (Optional)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="birth_day" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="telephone_1" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Primary Phone</FormLabel>
                        <FormControl><Input type="tel" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="telephone_2" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Secondary Phone (Optional)</FormLabel>
                        <FormControl><Input type="tel" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Gender</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a gender" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="civil_status" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Civil Status</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Single">Single</SelectItem>
                                <SelectItem value="Married">Married</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Details'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
