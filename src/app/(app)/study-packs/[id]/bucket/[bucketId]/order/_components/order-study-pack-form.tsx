
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { ArrowLeft, Loader2, Home, Building, MapPin, Mailbox, Phone } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BucketContent {
    id: string;
    content_title: string;
    content_type: string;
}

interface DeliveryDetails {
    address1: string;
    address2: string;
    city: string;
    district: string;
    postalCode: string;
    phone1: string;
    phone2: string;
}


export function OrderStudyPackForm() {
    const params = useParams();
    const router = useRouter();
    const { id: courseId, bucketId, contentId } = params;
    
    const [item, setItem] = useState<BucketContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const initialDeliveryDetails: DeliveryDetails = {
        address1: '',
        address2: '',
        city: '',
        district: '',
        postalCode: '',
        phone1: '',
        phone2: ''
    };
    const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>(initialDeliveryDetails);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setDeliveryDetails(prev => ({ ...prev, [id]: value }));
    };

    useEffect(() => {
        if (!contentId) return;

        async function fetchContentItem() {
            setIsLoading(true);
            try {
                // Assuming an endpoint to get a single content item
                const response = await api.get(`/course-bucket-contents/${contentId}`);
                if (response.data.status === 'success') {
                    setItem(response.data.data);
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
        if (!item || !deliveryDetails.address1 || !deliveryDetails.city || !deliveryDetails.postalCode || !deliveryDetails.phone1) {
            toast({
                variant: 'destructive',
                title: "Validation Error",
                description: "Please fill in all required fields: Address Line 1, City, Postal Code, and Phone Number 1.",
            });
            return;
        }

        setIsSubmitting(true);
        // Placeholder for order submission logic
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast({
            title: "Order Placed (Simulation)",
            description: `Your order for "${item.content_title}" will be sent to your address.`,
        });

        setIsSubmitting(false);
        router.push(`/study-packs/${courseId}/bucket/${bucketId}`);
    }
    
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
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
        <Card>
            <CardHeader>
                <CardTitle>Confirm Your Order</CardTitle>
                <CardDescription>
                    You are ordering: <span className="font-semibold">{item.content_title}</span>. Please provide your delivery details below.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="address1">Address Line 1</Label>
                        <div className="relative">
                            <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="address1" placeholder="e.g., 123 Main Street" value={deliveryDetails.address1} onChange={handleInputChange} className="pl-8" />
                        </div>
                    </div>
                        <div className="grid gap-2">
                        <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="address2" placeholder="e.g., Apartment, studio, or floor" value={deliveryDetails.address2} onChange={handleInputChange} className="pl-8" />
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
                            <Label htmlFor="postalCode">Postal Code</Label>
                                <div className="relative">
                                    <Mailbox className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="postalCode" placeholder="e.g., 10100" value={deliveryDetails.postalCode} onChange={handleInputChange} className="pl-8" />
                                </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone1">Phone Number 1</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="phone1" type="tel" placeholder="e.g., 0771234567" value={deliveryDetails.phone1} onChange={handleInputChange} className="pl-8" />
                            </div>
                        </div>
                    </div>
                        <div className="grid gap-2">
                        <Label htmlFor="phone2">Phone Number 2 (Optional)</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="phone2" type="tel" placeholder="e.g., 0719876543" value={deliveryDetails.phone2} onChange={handleInputChange} className="pl-8" />
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
    );
}

