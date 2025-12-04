
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { ArrowLeft, Package, FileVideo, Image, Link as LinkIcon, FileText, File, Loader2, Home, Building, MapPin, Mailbox, Phone } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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

const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
        case 'video': return <FileVideo className="h-5 w-5 text-accent" />;
        case 'image': return <Image className="h-5 w-5 text-accent" />;
        case 'link': return <LinkIcon className="h-5 w-5 text-accent" />;
        case 'pdf': return <FileText className="h-5 w-5 text-accent" />;
        default: return <File className="h-5 w-5 text-accent" />;
    }
};

export function OrderStudyPackForm() {
    const params = useParams();
    const { id: courseId, bucketId } = params;
    const [content, setContent] = useState<BucketContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedItem, setSelectedItem] = useState<BucketContent | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
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
        if (!bucketId || !courseId) return;

        async function fetchContent() {
            setIsLoading(true);
            try {
                const response = await api.get(`/course-bucket-contents?course_id=${courseId}&course_bucket_id=${bucketId}`);
                if (response.data.status === 'success') {
                    setContent(response.data.data || []);
                } else {
                    setContent([]);
                }
            } catch (error: any) {
                setContent([]);
                toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch bucket content.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchContent();
    }, [courseId, bucketId, toast]);

    const handleOrderSubmit = async () => {
        if (!selectedItem || !deliveryDetails.address1 || !deliveryDetails.city || !deliveryDetails.postalCode || !deliveryDetails.phone1) {
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
            description: `Your order for "${selectedItem.content_title}" will be sent to your address.`,
        });

        setIsSubmitting(false);
        setIsDialogOpen(false);
        setSelectedItem(null);
        setDeliveryDetails(initialDeliveryDetails);
    }
    
    const openOrderDialog = (item: BucketContent) => {
        setSelectedItem(item);
        setIsDialogOpen(true);
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Orderable Items</CardTitle>
                    <CardDescription>Select the item you wish to order from this study pack bucket.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : content.length > 0 ? (
                        <div className="space-y-4">
                            {content.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        {getIconForType(item.content_type)}
                                        <span className="font-medium">{item.content_title}</span>
                                    </div>
                                    <Button size="sm" onClick={() => openOrderDialog(item)}>
                                        <Package className="mr-2 h-4 w-4" />
                                        Order Now
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No orderable items found in this bucket.</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button variant="outline" asChild>
                        <Link href={`/study-packs/${courseId}`}>
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Back to Buckets
                        </Link>
                    </Button>
                </CardFooter>
            </Card>

             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Your Order</DialogTitle>
                        <DialogDescription>
                            Please provide your delivery details to complete the order for {'"'}
                            <span className="font-semibold">{selectedItem?.content_title}</span>{'"'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
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
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                            Cancel
                            </Button>
                        </DialogClose>
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
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
