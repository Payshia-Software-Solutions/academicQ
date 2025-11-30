
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

const loginSchema = z.object({
  identifier: z.string().min(1, { message: 'Please enter your email or student number.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await api.post(
        '/users/login',
        data
      );

      if (response.data.status === 'success') {
        const user = response.data.user;
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('user', JSON.stringify(user));
        }

        toast({
          title: 'Login Successful',
          description: "You are being redirected.",
        });

        if (user.user_status === 'student') {
            router.push('/classes');
        } else {
            router.push('/dashboard');
        }

      } else {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: response.data.message || 'An unknown error occurred.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Error',
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
        <CardTitle>Institute Login</CardTitle>
        <CardDescription>
          Enter your credentials below to login to your institute's account.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email or Student Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="admin@institute.com or ST-12345"
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
                  <div className="flex items-center">
                    <FormLabel>Password</FormLabel>
                    <Link
                      href="#"
                      className="ml-auto inline-block text-sm underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log in'
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an institute account?{' '}
              <Link
                href="/register"
                className="font-semibold text-primary hover:underline"
              >
                Register
              </Link>
            </div>
            <div className="text-center text-sm text-muted-foreground mt-2">
              Are you a student?{' '}
              <Link
                href="#"
                className="font-semibold text-primary hover:underline"
              >
                Login here
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
