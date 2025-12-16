
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Inbox, Users, DollarSign, Percent, BadgeCheck, FileDown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';


interface StudentPayment {
    id: string;
    course_id: string;
    course_bucket_id: string;
    student_number: string;
    payment_request_id: string | null;
    payment_amount: string;
    discount_amount: string | null;
    created_at: string;
    course_name: string | null;
    course_bucket_name: string | null;
    hash?: string;
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

const ROWS_PER_PAGE = 10;

export function StudentPaymentsList() {
    const [payments, setPayments] = useState<StudentPayment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const [courses, setCourses] = useState<Course[]>([]);
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedBucket, setSelectedBucket] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);

    const studentMap = useMemo(() => {
        const map = new Map<string, string>();
        students.forEach(s => {
            map.set(s.student_number, `${s.f_name} ${s.l_name}`);
        });
        return map;
    }, [students]);


    useEffect(() => {
        async function fetchFilters() {
            try {
                const [coursesRes, studentsRes, companyRes] = await Promise.all([
                    api.get('/courses'),
                    api.get('/users?status=student'),
                    api.get('/company/1')
                ]);
                setCourses(coursesRes.data.data || []);
                setStudents(studentsRes.data.data || []);
                if (companyRes.data) {
                    setCompanyDetails(companyRes.data);
                }
            } catch(e) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load filter options.' });
            }
        };
        fetchFilters();
    }, [toast]);
    
    useEffect(() => {
        if (!selectedCourse) {
            setBuckets([]);
            setSelectedBucket('');
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
                setSelectedBucket('');
            }
        }
        fetchBucketsForCourse();
    }, [selectedCourse, toast]);
    
    useEffect(() => {
        async function fetchPayments() {
            if (!selectedCourse || !selectedBucket) {
                setPayments([]);
                return;
            }
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedStudent !== 'all') params.append('student_number', selectedStudent);
                if (selectedCourse) params.append('course_id', selectedCourse);
                if (selectedBucket) params.append('course_bucket_id', selectedBucket);
                
                const response = await api.get(`/student-payment-courses/filter/?${params.toString()}`);
                
                if (response.data.status === 'success') {
                    setPayments(response.data.data || []);
                } else {
                    setPayments([]);
                }
            } catch (error: any) {
                setPayments([]);
                toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch payments.',
                });
            } finally {
                setIsLoading(false);
                setCurrentPage(1);
            }
        };
        fetchPayments();
    }, [toast, selectedCourse, selectedBucket, selectedStudent]);

    const { totalAmount, totalDiscount, finalAmount } = useMemo(() => {
        const totals = payments.reduce((acc, payment) => {
            acc.totalAmount += parseFloat(payment.payment_amount) || 0;
            acc.totalDiscount += parseFloat(payment.discount_amount || '0') || 0;
            return acc;
        }, { totalAmount: 0, totalDiscount: 0 });

        return {
            ...totals,
            finalAmount: totals.totalAmount - totals.totalDiscount
        };
    }, [payments]);

    const totalPages = Math.ceil(payments.length / ROWS_PER_PAGE);
    const paginatedPayments = payments.slice(
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
        doc.text("Student Payments Report", 14, companyDetails ? 40 : 15);

        (doc as any).autoTable({
            startY: companyDetails ? 45 : 20,
            head: [['ID', 'Student', 'Course', 'Bucket', 'Amount', 'Discount', 'Date']],
            body: payments.map(p => [
                `#${p.id}`,
                studentMap.get(p.student_number) || p.student_number,
                p.course_name || 'N/A',
                p.course_bucket_name || 'N/A',
                `LKR ${parseFloat(p.payment_amount).toFixed(2)}`,
                `LKR ${parseFloat(p.discount_amount || '0').toFixed(2)}`,
                format(new Date(p.created_at), 'yyyy-MM-dd')
            ]),
        });
        doc.save('student-payments.pdf');
    }

    const handleExportExcel = () => {
        const header: any[][] = [];
        if (companyDetails) {
            header.push([companyDetails.company_name]);
            header.push([companyDetails.address]);
            header.push([`Phone: ${companyDetails.phone}`, `Email: ${companyDetails.email}`]);
            header.push([]); // Spacer row
        }
        header.push(["Student Payments Report"]);
        header.push([]); // Spacer row
        
        const data = payments.map(p => ({
            'Payment ID': `#${p.id}`,
            'Student': studentMap.get(p.student_number) || p.student_number,
            'Course': p.course_name || 'N/A',
            'Bucket': p.course_bucket_name || 'N/A',
            'Amount (LKR)': parseFloat(p.payment_amount).toFixed(2),
            'Discount (LKR)': parseFloat(p.discount_amount || '0').toFixed(2),
            'Date': format(new Date(p.created_at), 'yyyy-MM-dd'),
        }));
        
        const worksheet = XLSX.utils.json_to_sheet([]);
        XLSX.utils.sheet_add_aoa(worksheet, header, { origin: 'A1' });
        XLSX.utils.sheet_add_json(worksheet, data, { origin: -1, skipHeader: false });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Payments');
        XLSX.writeFile(workbook, 'student-payments.xlsx');
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">LKR {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Discount</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">LKR {totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Final Amount</CardTitle>
                        <BadgeCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">LKR {finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                             <CardTitle>Filter Payments</CardTitle>
                            <CardDescription>
                                Use the dropdowns to filter student payment records.
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                                {courses.map(course => (
                                    <SelectItem key={course.id} value={course.id}>{course.course_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedBucket} onValueChange={setSelectedBucket} disabled={buckets.length === 0 || !selectedCourse}>
                            <SelectTrigger>
                                <Inbox className="mr-2 h-4 w-4" />
                                <SelectValue placeholder={!selectedCourse ? 'Select course first' : 'Select a bucket...'} />
                            </SelectTrigger>
                            <SelectContent>
                                {buckets.map(bucket => (
                                    <SelectItem key={bucket.id} value={bucket.id}>{bucket.bucket_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Payment ID</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Bucket</TableHead>
                                    <TableHead>Hash</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Discount</TableHead>
                                    <TableHead>Date</TableHead>
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
                                ) : paginatedPayments.length > 0 ? (
                                    paginatedPayments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-mono text-xs">#{payment.id}</TableCell>
                                            <TableCell>{studentMap.get(payment.student_number) || payment.student_number}</TableCell>
                                            <TableCell>{payment.course_name || 'N/A'}</TableCell>
                                            <TableCell>{payment.course_bucket_name || 'N/A'}</TableCell>
                                            <TableCell className="font-mono text-xs truncate" style={{ maxWidth: '100px' }}>{payment.hash || 'N/A'}</TableCell>
                                            <TableCell className="text-right font-semibold">LKR {parseFloat(payment.payment_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="text-right text-green-600">LKR {parseFloat(payment.discount_amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="text-xs">{format(new Date(payment.created_at), 'PP p')}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        {selectedCourse && selectedBucket ? 'No payments found for the selected filters.' : 'Please select a course and bucket to view payments.'}
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
        </div>
    );
}

    