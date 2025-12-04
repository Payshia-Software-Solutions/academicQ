
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Inbox, Package, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Order {
    id: string;
    student_number: string;
    orderable_item_id: string;
    order_status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    address_line_1: string;
    city: string;
    created_at: string;
    course_id?: string; 
    course_bucket_id?: string; 
}

interface Course {
  id: string;
  course_name: string;
}
interface Bucket {
  id: string;
  bucket_name: string;
}

const statusOptions: Order['order_status'][] = ['pending', 'shipped', 'delivered', 'cancelled'];


export function OrdersList() {
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const [courses, setCourses] = useState<Course[]>([]);
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedBucket, setSelectedBucket] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState<Order['order_status'] | 'all'>('pending');
    
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    useEffect(() => {
        async function fetchInitialData() {
            setIsLoading(true);
            try {
                const [ordersRes, coursesRes, bucketsRes] = await Promise.all([
                    api.get('/student-orders'),
                    api.get('/courses'),
                    api.get('/course_buckets') 
                ]);

                if (Array.isArray(ordersRes.data)) {
                    setAllOrders(ordersRes.data);
                }
                if (coursesRes.data.status === 'success') {
                    setCourses(coursesRes.data.data || []);
                }
                 if (bucketsRes.data.status === 'success') {
                    setBuckets(bucketsRes.data.data || []);
                }

            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch initial data.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchInitialData();
    }, [toast]);
    
    // Filtering logic
    useEffect(() => {
        let orders = allOrders;

        if (selectedStatus !== 'all') {
            orders = orders.filter(o => o.order_status === selectedStatus);
        }
        if (selectedCourse !== 'all') {
             orders = orders.filter(o => o.course_id === selectedCourse);
        }
         if (selectedBucket !== 'all') {
             orders = orders.filter(o => o.course_bucket_id === selectedBucket);
        }

        setFilteredOrders(orders);
    }, [allOrders, selectedCourse, selectedBucket, selectedStatus]);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'delivered': return 'secondary';
            case 'shipped': return 'default';
            case 'cancelled': return 'destructive';
            case 'pending':
            default: return 'outline';
        }
    }
    
    const StatusBadge = ({ status }: { status: Order['order_status']}) => (
        <Badge variant={getStatusVariant(status)} className="capitalize">{status}</Badge>
    );
    
    const handleStatusChange = async (orderId: string, newStatus: Order['order_status']) => {
        if (!newStatus) return;
        setUpdatingStatus(orderId);

        const originalOrders = [...allOrders];
        
        setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));

        try {
            const response = await api.put(`/student-orders/${orderId}/status`, { order_status: newStatus });
            if (response.status !== 200) {
                throw new Error(response.data.message || 'Failed to update status.');
            }
            toast({
                title: 'Status Updated',
                description: `Order #${orderId} status set to ${newStatus}.`,
            });
        } catch (error: any) {
            setAllOrders(originalOrders); // Revert on failure
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'Could not update order status.',
            });
        } finally {
            setUpdatingStatus(null);
        }
    };


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Filter Orders</CardTitle>
                    <CardDescription>
                        Use the filters below to view specific sets of orders.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                            <SelectTrigger>
                                <BookOpen className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter by course..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                {courses.map(course => (
                                    <SelectItem key={course.id} value={course.id}>{course.course_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedBucket} onValueChange={setSelectedBucket}>
                            <SelectTrigger>
                                <Inbox className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter by bucket..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Buckets</SelectItem>
                                {buckets.map(bucket => (
                                    <SelectItem key={bucket.id} value={bucket.id}>{bucket.bucket_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val as any)}>
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
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Orders List</CardTitle>
                    <CardDescription>
                        Displaying {filteredOrders.length} order(s).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Student No.</TableHead>
                                    <TableHead>Item ID</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={6}>
                                                <Skeleton className="h-8 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredOrders.length > 0 ? (
                                    filteredOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">#{order.id}</TableCell>
                                            <TableCell className="font-mono text-xs">{order.student_number}</TableCell>
                                            <TableCell>#{order.orderable_item_id}</TableCell>
                                            <TableCell className="text-xs">
                                                {order.address_line_1}, {order.city}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="flex items-center gap-1" disabled={updatingStatus === order.id}>
                                                            {updatingStatus === order.id 
                                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                                : <StatusBadge status={order.order_status} />
                                                            }
                                                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {statusOptions.map(status => (
                                                            <DropdownMenuItem 
                                                                key={status} 
                                                                onSelect={() => handleStatusChange(order.id, status)}
                                                                disabled={order.order_status === status}
                                                                className="capitalize"
                                                            >
                                                            {status}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                            <TableCell className="text-xs">{format(new Date(order.created_at), 'PP p')}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No orders found for the selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
