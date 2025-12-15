
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Eye, Info, Building, Home, Phone, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';


type OrderStatus = 'pending' | 'packed' | 'handed over' | 'delivered' | 'returned' | 'cancelled';

interface Order {
    id: string;
    student_number: string;
    orderable_item_id: string;
    order_status: OrderStatus;
    address_line_1: string;
    address_line_2: string;
    city: string;
    district: string;
    postal_code: string;
    created_at: string;
    orderable_item_name?: string;
    phone_number_1?: string;
    tracking_number?: string;
    cod_amount?: string;
}

interface CurrentUser {
    student_number?: string;
    [key: string]: any;
}

const statusOptions: OrderStatus[] = ['pending', 'packed', 'handed over', 'delivered'];

function DetailRow({ label, value, icon: Icon }: { label: string, value?: string | null, icon: React.ElementType }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium text-sm">{value}</p>
            </div>
        </div>
    )
}

export function OrderHistoryList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
    const { toast } = useToast();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        const userString = localStorage.getItem('user');
        if (!userString) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'Could not retrieve user details.' });
            setIsLoading(false);
            return;
        }
        const user: CurrentUser = JSON.parse(userString);

        if (!user.student_number) {
            setIsLoading(false);
            return;
        }

        async function fetchOrders() {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('student_number', user.student_number!);
                if (statusFilter !== 'all') {
                    params.append('order_status', statusFilter);
                }

                const response = await api.get(`/student-orders/records/filter/?${params.toString()}`);
                if (response.data.status === 'success' && Array.isArray(response.data.data)) {
                    setOrders(response.data.data);
                } else if (Array.isArray(response.data)) { // Fallback for previous incorrect assumption
                    setOrders(response.data);
                }
                 else {
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

    }, [toast, statusFilter]);
    
    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'secondary';
            case 'shipped': case 'handed over': return 'default';
            case 'cancelled': case 'returned': return 'destructive';
            case 'pending': case 'packed':
            default: return 'outline';
        }
    }
    
    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDialogOpen(true);
    }


    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Your Orders</CardTitle>
                    <CardDescription>
                        A list of all your past study pack orders.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 max-w-xs">
                        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                            <SelectTrigger>
                                <Package className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter by status..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {statusOptions.map(status => (
                                    <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i} className="p-4"><Skeleton className="h-24 w-full" /></Card>
                            ))
                        ) : orders.length > 0 ? (
                            orders.map((order) => (
                                <Card key={order.id}>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{order.orderable_item_name || `Item #${order.orderable_item_id}`}</p>
                                                <p className="text-xs text-muted-foreground font-mono">#{order.id}</p>
                                            </div>
                                            <Badge variant={getStatusVariant(order.order_status)} className="capitalize">{order.order_status}</Badge>
                                        </div>
                                        <div className="flex justify-between items-end mt-4">
                                            <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'PP p')}</p>
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>
                                                <Eye className="mr-2 h-4 w-4"/>View
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-10">
                                No orders found with the selected status.
                            </p>
                        )}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Item</TableHead>
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
                                            <TableCell>{order.orderable_item_name || `Item #${order.orderable_item_id}`}</TableCell>
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
                                            No orders found with the selected status.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogDescription>
                            Full details for order #{selectedOrder?.id}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="grid gap-4 py-4">
                            <DetailRow label="Item" value={selectedOrder.orderable_item_name} icon={Package} />
                            <DetailRow label="Order Status" value={selectedOrder.order_status} icon={Info} />
                            <DetailRow label="Address Line 1" value={selectedOrder.address_line_1} icon={Home} />
                            <DetailRow label="Address Line 2" value={selectedOrder.address_line_2} icon={Building} />
                            <DetailRow label="City / District" value={`${selectedOrder.city}, ${selectedOrder.district}`} icon={Info} />
                            <DetailRow label="Phone" value={selectedOrder.phone_number_1} icon={Phone} />
                            <DetailRow label="Tracking Number" value={selectedOrder.tracking_number} icon={Truck} />
                            <DetailRow label="COD Amount" value={selectedOrder.cod_amount ? `LKR ${selectedOrder.cod_amount}`: 'N/A'} icon={Info} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
