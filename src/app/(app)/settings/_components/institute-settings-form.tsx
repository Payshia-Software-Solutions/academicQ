
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, Building, Mail, Phone, Link as LinkIcon, Hash, Globe, Eye, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import Image from 'next/image';
import { Preloader } from '@/components/ui/preloader';
import { Label } from '@/components/ui/label';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const settingsSchema = z.object({
  company_name: z.string().min(1, 'Company name is required.'),
  address: z.string().min(1, 'Address is required.'),
  phone: z.string().min(1, 'Phone number is required.'),
  email: z.string().email('Invalid email address.'),
  website: z.string().url('Invalid URL.').or(z.literal('')),
  vision: z.string().optional(),
  mission: z.string().optional(),
  founder_message: z.string().optional(),
  logo: z.any().optional(),
  registration_number: z.string().optional(),
  company_trifix: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function InstituteSettingsForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  const getFullFileUrl = (filePath: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL || '';
    return `${baseUrl}${filePath}`;
  };

  useEffect(() => {
    async function fetchInstituteData() {
      try {
        const response = await api.get('/company/1');
        if (response.data) {
          form.reset(response.data);
          if (response.data.logo) {
            setCurrentLogo(getFullFileUrl(response.data.logo));
          }
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch institute data.' });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'API Error', description: 'Could not fetch institute data.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchInstituteData();
  }, [form, toast]);

  const logoRef = form.register("logo");

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSubmitting(true);

    const formData = new FormData();
    const dirtyFields = form.formState.dirtyFields;

     Object.keys(dirtyFields).forEach(key => {
        const fieldKey = key as keyof SettingsFormValues;
        if (fieldKey !== 'logo') {
             formData.append(fieldKey, (data[fieldKey] as string) || '');
        }
    });
    
    if (data.logo && data.logo[0]) {
      formData.append('logo', data.logo[0]);
    }
    
    if (formData.entries().next().done) {
        toast({ title: "No Changes", description: "You haven't made any changes." });
        setIsSubmitting(false);
        return;
    }
    
    formData.append('_method', 'PUT');

    try {
      const response = await api.post('/company/1', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        toast({
          title: 'Settings Updated',
          description: 'Your institute settings have been successfully updated.',
        });
        router.refresh();
      } else {
        throw new Error(response.data.message || 'An unknown error occurred.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Error',
        description: error.response?.data?.message || 'Could not save settings.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <Card><CardContent><Preloader/></CardContent></Card>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Institute Details</CardTitle>
            <CardDescription>Update your institute's public information and branding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="company_name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Institute Name</FormLabel>
                        <FormControl><Input placeholder="e.g. TechNova Solutions" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                 )} />
                 <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="e.g. info@technova.com" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input placeholder="e.g. +94-77-1234567" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                 )} />
                 <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl><Input placeholder="e.g. https://www.technova.com" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
            
            <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl><Textarea placeholder="e.g. 123 Innovation Street, Colombo" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="registration_number" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl><Input placeholder="e.g. REG-2025-001" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                 )} />
                 <FormField control={form.control} name="company_trifix" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Company Trifix</FormLabel>
                        <FormControl><Input placeholder="e.g. TNS" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
            
             <FormField control={form.control} name="vision" render={({ field }) => (
                <FormItem>
                    <FormLabel>Vision</FormLabel>
                    <FormControl><Textarea placeholder="e.g. To innovate and lead the digital future." {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />

             <FormField control={form.control} name="mission" render={({ field }) => (
                <FormItem>
                    <FormLabel>Mission</FormLabel>
                    <FormControl><Textarea placeholder="e.g. Deliver high-quality tech products..." {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            
             <FormField control={form.control} name="founder_message" render={({ field }) => (
                <FormItem>
                    <FormLabel>Founder's Message</FormLabel>
                    <FormControl><Textarea placeholder="e.g. Thank you for supporting our journey..." {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                 <div>
                    <Label>Current Logo</Label>
                    <div className="mt-2 w-full h-32 relative rounded-md border bg-muted overflow-hidden">
                        {currentLogo ? (
                            <Image src={currentLogo} alt="Current company logo" fill style={{ objectFit: 'contain' }} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">No logo</div>
                        )}
                    </div>
                </div>
                 <FormField control={form.control} name="logo" render={({ field }) => (
                    <FormItem>
                        <FormLabel>New Logo</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/*" {...logoRef} />
                        </FormControl>
                        <FormDescription>Upload a new logo to replace the current one.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
