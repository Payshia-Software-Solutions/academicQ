
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface Order {
    id: string;
    student_number: string;
    orderable_item_id: string;
    order_status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    address_line_1: string;
    city: string;
    created_at: string;
}

interface CurrentUser {
    student_number?: string;
    [key: string]: any;
}


export function OrderHistoryList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const userString = localStorage.getItem('user');
        if (!userString) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'Could not retrieve user details.' });
            setIsLoading(false);
            return;
        }
        const user: CurrentUser = JSON.parse(userString);

        async function fetchOrders() {
            setIsLoading(true);
            try {
                const response = await api.get('/student-orders');
                if (Array.isArray(response.data)) {
                    // Filter orders for the current student
                    const studentOrders = response.data.filter((order: Order) => order.student_number === user.student_number);
                    setOrders(studentOrders);
                } else {
                    setOrders([]);
                }
            } catch (error: any) {
                setOrders([]);
                toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch order history.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchOrders();

    }, [toast]);
    
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'delivered': return 'secondary';
            case 'shipped': return 'default';
            case 'cancelled': return 'destructive';
            case 'pending':
            default: return 'outline';
        }
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Orders</CardTitle>
                <CardDescription>
                    A list of all your past study pack orders.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Item ID</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5}>
                                            <Skeleton className="h-8 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">#{order.id}</TableCell>
                                        <TableCell>Item #{order.orderable_item_id}</TableCell>
                                        <TableCell>
                                            {order.address_line_1}, {order.city}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(order.order_status)} className="capitalize">{order.order_status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">{format(new Date(order.created_at), 'PP p')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        You have not placed any orders yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                 </div>
            </CardContent>
        </Card>
    );
}
