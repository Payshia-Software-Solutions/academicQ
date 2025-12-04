
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { ArrowLeft, Package, FileVideo, Image as ImageIcon, Link as LinkIcon, FileText, File, DollarSign } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

interface OrderableItem {
    id: string;
    name: string;
    price: string;
    description: string;
    img_url: string;
}

const getFullFileUrl = (filePath?: string) => {
    if (!filePath || filePath.startsWith('http')) return filePath || 'https://placehold.co/600x400';
    const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL || '';
    return `${baseUrl}${filePath}`;
};

export function OrderableItemsList() {
    const params = useParams();
    const { id: courseId, bucketId } = params;
    const [items, setItems] = useState<OrderableItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!bucketId) return;

        async function fetchContent() {
            setIsLoading(true);
            try {
                const response = await api.get(`/orderable-items/bucket/${bucketId}`);
                if (response.data.status === 'success') {
                    setItems(response.data.data || []);
                } else {
                    setItems([]);
                }
            } catch (error: any) {
                setItems([]);
                toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch orderable items.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchContent();
    }, [courseId, bucketId, toast]);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Orderable Items</CardTitle>
                <CardDescription>Select an item you wish to order from this study pack bucket.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({length: 3}).map((_, i) => (
                             <Card key={i}>
                                <CardContent className="p-4">
                                    <Skeleton className="h-40 w-full mb-4" />
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardContent>
                                <CardFooter>
                                    <Skeleton className="h-10 w-full" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item) => (
                            <Card key={item.id} className="flex flex-col">
                                <CardHeader className="p-0">
                                    <div className="relative h-48 w-full">
                                        <Image
                                            src={getFullFileUrl(item.img_url)}
                                            alt={item.name}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            className="rounded-t-lg"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                     <h3 className="font-semibold text-lg">{item.name}</h3>
                                     <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                                     <Badge className="mt-2 text-base" variant="secondary">
                                        <DollarSign className="mr-1 h-4 w-4"/>
                                        {parseFloat(item.price).toFixed(2)}
                                     </Badge>
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <Button size="sm" asChild className="w-full">
                                        <Link href={`/study-packs/${courseId}/bucket/${bucketId}/order/${item.id}`}>
                                            <Package className="mr-2 h-4 w-4" />
                                            Order Now
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
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
    );
}
