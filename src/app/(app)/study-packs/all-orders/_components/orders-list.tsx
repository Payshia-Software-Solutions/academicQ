
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
import { BookOpen, Inbox, Package, ChevronDown, Loader2, Eye, Users, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderDetailsDialog } from './order-details-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

interface Course {
  id: string;
  course_name: string;
}

interface Bucket {
  id: string;
  bucket_name: string;
  name?: string;
  course_id: string;
}


interface Student {
  id: string;
  student_number: string;
  f_name: string;
  l_name: string;
}

interface CompanyDetails {
    company_name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
}


const statusOptions: OrderStatus[] = ['pending', 'packed', 'handed over', 'delivered', 'returned', 'cancelled'];
const ROWS_PER_PAGE = 10;

export function OrdersList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    
    const [selectedStudent, setSelectedStudent] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedBucket, setSelectedBucket] = useState('all');
    
    const [filterTrigger, setFilterTrigger] = useState(0);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);


    useEffect(() => {
        async function fetchFilterData() {
            try {
                const [studentsRes, companyRes, coursesRes] = await Promise.all([
                    api.get('/users?status=student'),
                    api.get('/company/1'),
                    api.get('/courses'),
                ]);
                if (studentsRes.data.status === 'success') {
                    setStudents(studentsRes.data.data || []);
                }
                 if (coursesRes.data.status === 'success') {
                    setCourses(coursesRes.data.data || []);
                }
                if (companyRes.data) {
                    setCompanyDetails(companyRes.data);
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
        if (!selectedCourse || selectedCourse === 'all') {
            setBuckets([]);
            setSelectedBucket('all');
            return;
        }

        async function fetchBucketsForCourse() {
            try {
                const response = await api.get(`/courses/full/details/?id=${selectedCourse}`);
                if (response.data.status === 'success' && response.data.data.buckets) {
                    setBuckets(response.data.data.buckets.map((b: any) => ({ ...b, bucket_name: b.name })));
                } else {
                    setBuckets([]);
                }
            } catch(err) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load buckets for the selected course.'});
                setBuckets([]);
            } finally {
                setSelectedBucket('all');
            }
        }
        fetchBucketsForCourse();
    }, [selectedCourse, toast]);


    useEffect(() => {
        async function fetchOrders() {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedStudent !== 'all') params.append('student_number', selectedStudent);
                if (selectedStatus !== 'all') params.append('order_status', selectedStatus);
                if (selectedCourse !== 'all') params.append('course_id', selectedCourse);
                if (selectedBucket !== 'all') params.append('course_bucket_id', selectedBucket);

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
    }, [toast, filterTrigger, selectedStudent, selectedStatus, selectedCourse, selectedBucket]);


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
    
    const handleExportPDF = () => {
        const doc = new jsPDF();
        
        if (companyDetails) {
            doc.setFontSize(16);
            doc.text(companyDetails.company_name, 14, 15);
            doc.setFontSize(10);
            doc.text(companyDetails.address, 14, 22);
            doc.text(`Phone: ${companyDetails.phone} | Email: ${companyDetails.email}`, 14, 29);
        }

        doc.setFontSize(12);
        doc.text("All Student Orders", 14, companyDetails ? 40 : 15);

        (doc as any).autoTable({
            startY: companyDetails ? 45 : 20,
            head: [['Order ID', 'Student No.', 'Item', 'Course', 'Bucket', 'Address', 'Status', 'Date']],
            body: orders.map(order => [
                `#${order.id}`,
                order.student_number,
                order.item_name || order.orderable_item_name || `Item #${order.orderable_item_id}`,
                order.course_name || 'N/A',
                order.course_bucket_name || 'N/A',
                `${order.address_line_1}, ${order.city}`,
                order.order_status,
                format(new Date(order.created_at), 'yyyy-MM-dd')
            ]),
        });
        doc.save('all-orders.pdf');
    }

    const handleExportExcel = () => {
        const header: any[][] = [];
        if (companyDetails) {
            header.push([companyDetails.company_name]);
            header.push([companyDetails.address]);
            header.push([`Phone: ${companyDetails.phone}`, `Email: ${companyDetails.email}`]);
            header.push([]); // Spacer row
        }
        header.push(["All Student Orders"]);
        header.push([]); // Spacer row

        const data = orders.map(order => ({
            'Order ID': `#${order.id}`,
            'Student No.': order.student_number,
            'Item': order.item_name || order.orderable_item_name || `Item #${order.orderable_item_id}`,
            'Course': order.course_name || 'N/A',
            'Bucket': order.course_bucket_name || 'N/A',
            'Address': `${order.address_line_1}, ${order.city}`,
            'Status': order.order_status,
            'Date': format(new Date(order.created_at), 'yyyy-MM-dd'),
            'Tracking Number': order.tracking_number || 'N/A'
        }));
        
        const worksheet = XLSX.utils.json_to_sheet([]);
        XLSX.utils.sheet_add_aoa(worksheet, header, { origin: 'A1' });
        XLSX.utils.sheet_add_json(worksheet, data, { origin: -1, skipHeader: false });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'All Orders');
        XLSX.writeFile(workbook, 'all-orders.xlsx');
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>Filter Orders</CardTitle>
                            <CardDescription>
                                Use the filters below to view specific sets of orders.
                            </CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={handleExportPDF}>Export to PDF</DropdownMenuItem>
                                <DropdownMenuItem onSelect={handleExportExcel}>Export to Excel</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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

                         <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                            <SelectTrigger>
                                <BookOpen className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Select a course..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                {courses.map(course => (
                                    <SelectItem key={course.id} value={course.id}>{course.course_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedBucket} onValueChange={setSelectedBucket} disabled={buckets.length === 0 || !selectedCourse || selectedCourse === 'all'}>
                            <SelectTrigger>
                                <Inbox className="mr-2 h-4 w-4" />
                                <SelectValue placeholder={!selectedCourse || selectedCourse === 'all' ? 'Select course first' : 'Select a bucket...'} />
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
                         <Button onClick={handleApplyFilters} disabled={isLoading} className="lg:col-span-3">
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
                                    <TableHead>Student</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Bucket</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={8}>
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
                                                {order.item_name || order.orderable_item_name || `Item #${order.orderable_item_id}`}
                                            </TableCell>
                                            <TableCell className="text-xs">{order.course_name || 'N/A'}</TableCell>
                                            <TableCell className="text-xs">{order.course_bucket_name || 'N/A'}</TableCell>
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
                                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
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
