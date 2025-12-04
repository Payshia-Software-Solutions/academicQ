
'use client';

import { useState } from 'react';
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
import { Loader2, ArrowLeft, BookOpen, UploadCloud, FileText, DollarSign, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const addItemSchema = z.object({
  name: z.string().min(1, { message: 'Item name is required.' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number.' }),
  description: z.string().min(1, { message: 'Description is required.' }),
  img_url: z
    .any()
    .refine((files) => files?.length == 1, "Item image is required.")
    .refine((files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), ".jpg, .jpeg, .png and .webp files are accepted."),
});


type AddItemFormValues = z.infer<typeof addItemSchema>;

export function AddItemForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const bucketId = params.bucketId as string;

  const form = useForm<AddItemFormValues>({
    resolver: zodResolver(addItemSchema),
  });
  
  const imgUrlRef = form.register("img_url");

  const onSubmit = async (data: AddItemFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('price', data.price.toString());
      formData.append('description', data.description);
      formData.append('course_bucket_id', bucketId);


      if (data.img_url && data.img_url.length > 0) {
        formData.append('img_url', data.img_url[0]);
      } else {
         toast({
            variant: 'destructive',
            title: 'Image Required',
            description: `Please upload an image for the item.`,
         });
         setIsSubmitting(false);
         return;
      }

      const response = await api.post('/orderable-items', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201 || response.status === 200) {
        toast({
          title: 'Item Added',
          description: `The item "${data.name}" has been successfully added.`,
        });
        router.push(`/study-packs/${courseId}/bucket/${bucketId}`);
      } else {
        toast({
          variant: 'destructive',
          title: 'Creation Failed',
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

  const cancelUrl = `/study-packs/${courseId}/bucket/${bucketId}`;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
            <CardTitle>Add New Orderable Item</CardTitle>
                <CardDescription>Fill in the details to add a new item to this study pack bucket.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                            <Input placeholder="e.g. Full Course Notes PDF" {...field} className="pl-8" />
                        </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Price</FormLabel>
                        <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g. 50.00" {...field} className="pl-8" />
                        </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                       <div className="relative">
                         <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Textarea
                              placeholder="e.g., A sturdy stand for your laptop."
                              className="resize-none pl-8"
                              {...field}
                            />
                          </FormControl>
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="img_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Image</FormLabel>
                      <FormControl>
                        <div className="relative">
                           <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                type="file" 
                                className="pl-10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                {...imgUrlRef}
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
                <Link href={cancelUrl}>
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Cancel
                </Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                </>
                ) : (
                'Add Item'
                )}
            </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
