

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const registerSchema = z.object({
  f_name: z.string().min(1, { message: 'First name is required.' }),
  l_name: z.string().min(1, { message: 'Last name is required.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  phone_number: z.string().min(1, { message: 'Phone number is required.' }),
  nic: z.string().min(1, { message: 'NIC is required.' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      f_name: '',
      l_name: '',
      email: '',
      password: '',
      phone_number: '',
      nic: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      const postData = {
        ...data,
        company_id: 1, // Hardcoded as per requirement
        user_status: 'student', // Hardcoded as per requirement
      };
      
      const response = await api.post('/users', postData);

      if (response.status === 201 || response.status === 200) {
        toast({
          title: 'Registration Successful',
          description: 'Your account has been created. Please log in.',
        });
        router.push('/login');
      } else {
        toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: response.data.message || 'An unknown error occurred.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Error',
        description:
          error.response?.data?.message ||
          'Could not connect to the server. Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Register your Institute</CardTitle>
        <CardDescription>
          Create an account to manage your classes and students.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="f_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="l_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Perera" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@institute.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                        <Input placeholder="123-456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="nic"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>NIC</FormLabel>
                    <FormControl>
                        <Input placeholder="Your NIC" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Log in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
