
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShippingLabel } from './_components/shipping-label';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type OrderStatus = 'pending' | 'packed' | 'handed over' | 'delivered' | 'returned' | 'cancelled';

interface Order {
    id: string;
    student_number: string;
    item_name?: string;
    order_status: OrderStatus;
    address_line_1: string;
    address_line_2: string;
    city: string;
    district: string;
    postal_code: string;
    phone_number_1: string;
    phone_number_2: string;
    created_at: string;
    tracking_number?: string;
    cod_amount?: string;
    package_weight?: string;
    course_id?: string;
    course_bucket_id?: string;
    course_name?: string;
    bucket_name?: string;
}

export default function PrintOrderPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!orderId) return;

        async function fetchOrder() {
            setIsLoading(true);
            try {
                // This assumes an endpoint to fetch a single order by its ID
                const response = await api.get(`/student-orders/${orderId}`);
                if (response.data) {
                    setOrder(response.data);
                } else {
                    setOrder(null);
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Could not fetch order details.',
                    });
                }
            } catch (error: any) {
                setOrder(null);
                toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch order details.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchOrder();
    }, [orderId, toast]);

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div className="p-10">
                <Skeleton className="w-full h-[600px]" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="p-10 text-center">
                <p>Order not found.</p>
                <Button asChild variant="outline" className="mt-4">
                    <Link href="/study-packs/all-orders">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Orders
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="bg-gray-100 min-h-screen p-8 print:bg-white print:p-0">
            <div className="max-w-4xl mx-auto mb-8 print:hidden">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Print Shipping Label</h1>
                        <p className="text-muted-foreground">Order ID: #{order.id}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.back()}>
                           <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>
            </div>
            <div className="flex justify-center">
                <div className="printable-area">
                    <ShippingLabel order={order} />
                </div>
            </div>
        </div>
    );
}
