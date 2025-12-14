

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
import { BookOpen, Inbox, Package, ChevronDown, Loader2, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderDetailsDialog } from './order-details-dialog';

type OrderStatus = 'pending' | 'packed' | 'handed over' | 'delivered' | 'returned' | 'cancelled';

interface Order {
    id: string;
    student_number: string;
    orderable_item_id: string;
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
    order_date?: string;
    delivery_date?: string;
    price?: string;
    course_id?: string;
    course_bucket_id?: string;
    orderable_item_name?: string;
    course_name?: string;
    course_bucket_name?: string;
    bucket_name?: string;
}

interface Student {
  id: string;
  student_number: string;
  f_name: string;
  l_name: string;
}


const statusOptions: OrderStatus[] = ['pending', 'packed', 'handed over', 'delivered', 'returned', 'cancelled'];
const ROWS_PER_PAGE = 10;

export function OrdersList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const [students, setStudents] = useState<Student[]>([]);
    
    const [selectedStudent, setSelectedStudent] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
    
    const [filterTrigger, setFilterTrigger] = useState(0);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);


    useEffect(() => {
        async function fetchFilterData() {
            try {
                const studentsRes = await api.get('/users?status=student');
                if (studentsRes.data.status === 'success') {
                    setStudents(studentsRes.data.data || []);
                }

            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch filter data.',
                });
            }
        }
        fetchFilterData();
    }, [toast]);
    
    useEffect(() => {
        async function fetchOrders() {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedStudent !== 'all') params.append('student_number', selectedStudent);
                if (selectedStatus !== 'all') params.append('order_status', selectedStatus);

                const response = await api.get(`/student-orders/records/filter/?${params.toString()}`);
                if (response.data.status === 'success' && Array.isArray(response.data.data)) {
                    setOrders(response.data.data);
                } else {
                    setOrders([]);
                }
            } catch (error: any) {
                 toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: 'Could not fetch orders.',
                });
                setOrders([]);
            } finally {
                setIsLoading(false);
            }
        }
        if (filterTrigger > 0) {
            fetchOrders();
        }
    }, [toast, filterTrigger, selectedStudent, selectedStatus]);


    const handleApplyFilters = () => {
        setCurrentPage(1);
        setFilterTrigger(prev => prev + 1);
    };

    const handleOpenDialog = (order: Order) => {
        setSelectedOrder(order);
        setIsDialogOpen(true);
    };

    const handleOrderUpdate = (updatedOrder: Order) => {
        handleApplyFilters();
    };

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'secondary';
            case 'shipped': case 'handed over': return 'default';
            case 'cancelled': case 'returned': return 'destructive';
            case 'pending': case 'packed':
            default: return 'outline';
        }
    }
    
    const StatusBadge = ({ status }: { status: OrderStatus}) => (
        <Badge variant={getStatusVariant(status)} className="capitalize">{status}</Badge>
    );

    const totalPages = Math.ceil(orders.length / ROWS_PER_PAGE);
    const paginatedOrders = orders.slice(
        (currentPage - 1) * ROWS_PER_PAGE,
        currentPage * ROWS_PER_PAGE
    );

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                            <SelectTrigger>
                                <Users className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter by student..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Students</SelectItem>
                                {students.map(student => (
                                    <SelectItem key={student.id} value={student.student_number}>{student.f_name} {student.l_name}</SelectItem>
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
                         <Button onClick={handleApplyFilters} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Apply Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Orders List</CardTitle>
                    <CardDescription>
                        Displaying {orders.length} order(s).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Student No.</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={7}>
                                                <Skeleton className="h-8 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : paginatedOrders.length > 0 ? (
                                    paginatedOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">#{order.id}</TableCell>
                                            <TableCell className="font-mono text-xs">{order.student_number}</TableCell>
                                            <TableCell>
                                                {order.orderable_item_name || `Item #${order.orderable_item_id}`}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {order.address_line_1}, {order.city}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={order.order_status} />
                                            </TableCell>
                                            <TableCell className="text-xs">{format(new Date(order.created_at), 'PP p')}</TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(order)}>
                                                    <Eye className="mr-2 h-4 w-4"/>
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            {filterTrigger > 0 ? 'No orders found for the selected filters.' : 'Please apply filters to see orders.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        >
                        Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages > 0 ? totalPages : 1}
                        </span>
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        >
                        Next
                        </Button>
                    </div>
                </CardContent>
            </Card>
            {selectedOrder && (
                <OrderDetailsDialog 
                    order={selectedOrder}
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onOrderUpdate={handleOrderUpdate}
                />
            )}
        </div>
    );
}
