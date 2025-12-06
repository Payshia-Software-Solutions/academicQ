
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
import { format } from 'date-fns';

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
  user_status?: 'admin' | 'student';
  student_number?: string;
  email?: string;
  nic?: string;
}

export function CompleteProfileForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [hasFullDetails, setHasFullDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setCurrentUser(parsedUser);

      if (parsedUser.student_number) {
        fetchUserDetails(parsedUser.student_number);
      } else {
        setIsLoading(false);
      }
    } else {
        setIsLoading(false);
    }
  }, []);

  const fetchUserDetails = async (studentNumber: string) => {
    try {
        const response = await api.get(`/user-full-details/get/student/?student_number=${studentNumber}`);
        if (response.data && response.data.message !== "User not found.") {
            const details = response.data.data;
            const formattedBirthday = details.birth_day ? format(new Date(details.birth_day), 'yyyy-MM-dd') : '';
            
            form.reset({
                ...details,
                birth_day: formattedBirthday
            });
            setHasFullDetails(true);
        }
    } catch (error) {
        console.error("Could not fetch user details", error);
    } finally {
        setIsLoading(false);
    }
  }


  const handleSkip = () => {
    sessionStorage.setItem('profileSkipped', 'true');
    sessionStorage.setItem('profileCheckComplete', 'true');
    const homePath = currentUser?.user_status === 'admin' ? '/dashboard' : '/student-dashboard';
    router.push(homePath);
  };

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
      let response;
      if (hasFullDetails) {
        // UPDATE (PUT)
        const dirtyFields = form.formState.dirtyFields;
        const changedData: Partial<ProfileFormValues> = {};
        for (const key in dirtyFields) {
          if (Object.prototype.hasOwnProperty.call(dirtyFields, key)) {
            changedData[key as keyof ProfileFormValues] = data[key as keyof ProfileFormValues];
          }
        }
        
        if (Object.keys(changedData).length === 0) {
            toast({ title: 'No Changes', description: 'You have not made any changes to your profile.' });
            setIsSubmitting(false);
            return;
        }

        response = await api.put(`/users/full-details/${currentUser.student_number}`, changedData);
        if (response.data.message !== "Record updated successfully.") {
             throw new Error(response.data.message || "An unknown error occurred during update.");
        }

      } else {
        // CREATE (POST)
        const postData = {
            ...data,
            student_number: currentUser.student_number,
            e_mail: currentUser.email,
            nic: currentUser.nic,
        };
        response = await api.post('/user-full-details', postData);
        if (response.data.message !== "Record created successfully.") {
             throw new Error(response.data.message || "An unknown error occurred during creation.");
        }
      }

      toast({
          title: 'Profile Updated',
          description: 'Your details have been saved successfully. Redirecting...',
      });
      sessionStorage.removeItem('profileSkipped');
      sessionStorage.setItem('profileCheckComplete', 'true'); // Ensure check is marked complete
      const homePath = currentUser?.user_status === 'admin' ? '/dashboard' : '/student-dashboard';
      router.push(homePath);
      router.refresh();

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

  if (isLoading) {
      return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </CardContent>
        </Card>
      )
  }

  return (
    <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 pt-6">
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
                            <Select onValueChange={field.onChange} value={field.value}>
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
                            <Select onValueChange={field.onChange} value={field.value}>
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
            <CardFooter className="flex justify-between">
              {!hasFullDetails ? (
                <Button type="button" variant="ghost" onClick={handleSkip}>Skip for now</Button>
              ) : <div />}
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
