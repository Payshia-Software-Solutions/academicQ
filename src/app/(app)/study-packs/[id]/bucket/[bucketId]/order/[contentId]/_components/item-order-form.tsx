
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { ArrowLeft, Loader2, Home, Building, MapPin, Mailbox, Phone, DollarSign, Package } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { PaymentSlipUploadForm } from '@/app/(app)/classes/[id]/buckets/[bucketId]/_components/payment-slip-upload-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface OrderableItem {
    id: string;
    name: string;
    price: string;
    description: string;
    img_url: string;
}

interface DeliveryDetails {
    address_line_1: string;
    address_line_2: string;
    city: string;
    district: string;
    postal_code: string;
    phone_number_1: string;
    phone_number_2: string;
}

interface CurrentUser {
  student_number?: string;
  [key: string]: any;
}

const getFullFileUrl = (filePath?: string) => {
    if (!filePath) return 'https://placehold.co/600x400';
    if (filePath.startsWith('http')) {
        return filePath.replace(/^(https?:\/\/)+/, 'https://').replace(/https:\/\//, 'https://');
    }
    const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL || '';
    return `${baseUrl}${filePath}`;
};


export function ItemOrderForm() {
    const params = useParams();
    const router = useRouter();
    const { id: courseId, bucketId, contentId } = params;
    
    const [item, setItem] = useState<OrderableItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const initialDeliveryDetails: DeliveryDetails = {
        address_line_1: '',
        address_line_2: '',
        city: '',
        district: '',
        postal_code: '',
        phone_number_1: '',
        phone_number_2: ''
    };
    const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>(initialDeliveryDetails);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setDeliveryDetails(prev => ({ ...prev, [id]: value }));
    };

    useEffect(() => {
        if (!contentId) return;

        async function fetchContentItem() {
            setIsLoading(true);
            try {
                const response = await api.get(`/orderable-items/${contentId}`);
                if (response.data) {
                    setItem(response.data);
                } else {
                    setItem(null);
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch item details.' });
                }
            } catch (error: any) {
                setItem(null);
                toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch item details.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchContentItem();
    }, [contentId, toast]);

    const handleOrderSubmit = async () => {
        const userString = localStorage.getItem('user');
        if (!userString) {
            toast({ variant: 'destructive', title: "Not logged in", description: "You must be logged in to place an order."});
            return;
        }
        const user: CurrentUser = JSON.parse(userString);
        
        if (!item || !deliveryDetails.address_line_1 || !deliveryDetails.city || !deliveryDetails.postal_code || !deliveryDetails.phone_number_1) {
            toast({
                variant: 'destructive',
                title: "Validation Error",
                description: "Please fill in all required fields: Address Line 1, City, Postal Code, and Phone Number 1.",
            });
            return;
        }

        setIsSubmitting(true);
        
        const postData = {
            student_number: user.student_number,
            orderable_item_id: parseInt(contentId as string),
            order_status: "pending",
            ...deliveryDetails
        };

        try {
            const response = await api.post('/student-orders', postData);
            if (response.status === 201 || response.status === 200) {
                toast({
                    title: "Order Placed",
                    description: `Your order for "${item.name}" has been placed. Please upload your payment slip.`,
                });
                setIsPaymentDialogOpen(true);
            } else {
                throw new Error(response.data.message || 'An unknown error occurred.');
            }
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Order Failed',
                description: error.response?.data?.message || error.message || 'Could not place your order.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (isLoading) {
        return (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                    <CardContent><Skeleton className="h-64 w-full" /></CardContent>
                </Card>
                 <Card>
                    <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }
    
    if (!item) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Item Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The requested item could not be found.</p>
                </CardContent>
                 <CardFooter>
                    <Button variant="outline" asChild>
                        <Link href={`/study-packs/${courseId}/bucket/${bucketId}`}>
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Back to Items
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left Column: Item Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                        <CardDescription>You are ordering the following item.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="relative h-64 w-full bg-muted rounded-lg overflow-hidden">
                                <Image
                                    src={getFullFileUrl(item.img_url)}
                                    alt={item.name}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold flex items-center gap-2"><Package className="h-6 w-6"/>{item.name}</h3>
                                <p className="text-muted-foreground">{item.description}</p>
                                <Badge variant="secondary" className="text-lg">
                                    <DollarSign className="mr-1 h-5 w-5" />
                                    {parseFloat(item.price).toFixed(2)}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Delivery Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Delivery Details</CardTitle>
                        <CardDescription>
                            Please provide your delivery information below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="address_line_1">Address Line 1</Label>
                                <div className="relative">
                                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="address_line_1" placeholder="e.g., No. 42, Main Street" value={deliveryDetails.address_line_1} onChange={handleInputChange} className="pl-8" />
                                </div>
                            </div>
                                <div className="grid gap-2">
                                <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="address_line_2" placeholder="e.g., Apt. 3B" value={deliveryDetails.address_line_2} onChange={handleInputChange} className="pl-8" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="city">City</Label>
                                        <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="city" placeholder="e.g., Colombo" value={deliveryDetails.city} onChange={handleInputChange} className="pl-8" />
                                    </div>
                                </div>
                                    <div className="grid gap-2">
                                    <Label htmlFor="district">District</Label>
                                    <Input id="district" placeholder="e.g., Colombo" value={deliveryDetails.district} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="postal_code">Postal Code</Label>
                                        <div className="relative">
                                            <Mailbox className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="postal_code" placeholder="e.g., 10100" value={deliveryDetails.postal_code} onChange={handleInputChange} className="pl-8" />
                                        </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone_number_1">Phone Number 1</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="phone_number_1" type="tel" placeholder="e.g., 0771234567" value={deliveryDetails.phone_number_1} onChange={handleInputChange} className="pl-8" />
                                    </div>
                                </div>
                            </div>
                                <div className="grid gap-2">
                                <Label htmlFor="phone_number_2">Phone Number 2 (Optional)</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="phone_number_2" type="tel" placeholder="e.g., 0719876543" value={deliveryDetails.phone_number_2} onChange={handleInputChange} className="pl-8" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" asChild>
                            <Link href={`/study-packs/${courseId}/bucket/${bucketId}`}>
                                <ArrowLeft className="mr-2 h-4 w-4"/>
                                Cancel
                            </Link>
                        </Button>
                        <Button type="button" onClick={handleOrderSubmit} disabled={isSubmitting}>
                                {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Placing Order...
                                </>
                                ) : (
                                'Confirm Order'
                                )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
             <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Upload Payment Slip</DialogTitle>
                        <DialogDescription>
                            Your order has been placed. Please upload your proof of payment for the ordered item.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <PaymentSlipUploadForm 
                            bucketAmount={item.price || '0'}
                            courseId={courseId as string}
                            bucketId={bucketId as string}
                            onSuccess={() => {
                                setIsPaymentDialogOpen(false);
                                router.push('/study-packs/history');
                            }}
                            paymentType="study_pack"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
