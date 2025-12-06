
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

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


interface CurrentUser {
  student_number?: string;
  email?: string;
  nic?: string;
}

export function CompleteProfileForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if(userStr) {
        setCurrentUser(JSON.parse(userStr));
    }
  }, []);

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
    if (!currentUser?.student_number) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not find student information. Please log in again."
        });
        return;
    }

    setIsSubmitting(true);
    try {
        const postData = {
            ...data,
            student_number: currentUser.student_number,
            e_mail: currentUser.email,
            nic: currentUser.nic,
        };

        const response = await api.post('/user-full-details', postData);

        if (response.data.message === "Record created successfully.") {
            toast({
                title: 'Profile Updated',
                description: 'Your details have been saved successfully. Redirecting...',
            });
            // Redirect to a different page, e.g., the dashboard
            router.push('/dashboard');
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
    <Card>
        <CardHeader>
             <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
                Please provide your full details. This is required to continue.
            </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto pr-6 pl-1">
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
            </CardContent>
            <CardFooter>
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
            </CardFooter>
          </form>
        </Form>
    </Card>
  );
}
