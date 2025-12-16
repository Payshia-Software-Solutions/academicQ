
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Eye, FileDown, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Preloader } from '@/components/ui/preloader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Submission {
    id: string;
    student_number: string;
    grade: string | null;
    sub_status: 'submitted' | 'graded' | 'rejected' | null;
    created_at: string;
}

interface Assignment {
    id: string;
    content_title: string;
    submissions: Submission[];
    course_bucket_id: string;
    content_id: string;
}

interface AllAssignmentsListProps {
    courseId: string;
}

interface CompanyDetails {
    company_name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
}

const ROWS_PER_PAGE = 10;

export function AllAssignmentsList({ courseId }: AllAssignmentsListProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);

     useEffect(() => {
        async function fetchCompanyDetails() {
            try {
                const response = await api.get('/company/1');
                if (response.data) {
                    setCompanyDetails(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch company details:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not fetch company details for exporting.",
                });
            }
        }
        fetchCompanyDetails();
    }, [toast]);

    useEffect(() => {
        if (!courseId) return;

        async function fetchAssignments() {
            setIsLoading(true);
            try {
                const response = await api.get(`/assignments/filter/?course_id=${courseId}`);
                if (response.data.status === 'success') {
                    setAssignments(response.data.data || []);
                } else {
                    setAssignments([]);
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Could not fetch assignments for this course.',
                    });
                }
            } catch (error: any) {
                setAssignments([]);
                toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch assignments.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchAssignments();
    }, [courseId, toast]);

    const allSubmissions = assignments.flatMap(assignment => 
        assignment.submissions.map(sub => ({
            ...sub,
            assignmentTitle: assignment.content_title,
            assignmentId: assignment.id,
            bucketId: assignment.course_bucket_id,
            contentId: assignment.content_id,
        }))
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const totalPages = Math.ceil(allSubmissions.length / ROWS_PER_PAGE);
    const paginatedSubmissions = allSubmissions.slice(
        (currentPage - 1) * ROWS_PER_PAGE,
        currentPage * ROWS_PER_PAGE
    );
    
    const getStatusVariant = (status: string | null) => {
        switch (status) {
            case 'graded': return 'secondary';
            case 'submitted': return 'default';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    }
    
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
        doc.text("All Assignment Submissions", 14, companyDetails ? 40 : 15);

        (doc as any).autoTable({
            startY: companyDetails ? 45 : 20,
            head: [['Student', 'Assignment', 'Submitted On', 'Status', 'Grade']],
            body: allSubmissions.map(sub => [
                sub.student_number,
                sub.assignmentTitle,
                format(new Date(sub.created_at), 'PP p'),
                sub.sub_status || 'N/A',
                sub.grade || 'Not Graded'
            ]),
        });
        doc.save('all-assignments.pdf');
    }

    const handleExportExcel = () => {
        const header: any[][] = [];
        if (companyDetails) {
            header.push([companyDetails.company_name]);
            header.push([companyDetails.address]);
            header.push([`Phone: ${companyDetails.phone}`, `Email: ${companyDetails.email}`]);
            header.push([]); // Spacer row
        }
        header.push(["All Assignment Submissions"]);
        header.push([]); // Spacer row
        
        const data = allSubmissions.map(sub => ({
            'Student': sub.student_number,
            'Assignment': sub.assignmentTitle,
            'Submitted On': format(new Date(sub.created_at), 'PP p'),
            'Status': sub.sub_status || 'N/A',
            'Grade': sub.grade || 'Not Graded'
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.sheet_add_aoa(worksheet, header, { origin: 'A1' });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'All Assignments');
        XLSX.writeFile(workbook, 'all-assignments.xlsx');
    }


    if (isLoading) {
        return <Preloader icon="book"/>;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>Submissions</CardTitle>
                        <CardDescription>
                            {allSubmissions.length} submission(s) found for this course.
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
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Assignment</TableHead>
                                <TableHead>Submitted On</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {paginatedSubmissions.length > 0 ? (
                                paginatedSubmissions.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-mono text-xs">{sub.student_number}</TableCell>
                                        <TableCell>{sub.assignmentTitle}</TableCell>
                                        <TableCell>{format(new Date(sub.created_at), 'PP p')}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(sub.sub_status)} className="capitalize">
                                                {sub.sub_status || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {sub.grade ? (
                                                <Badge variant="secondary">{sub.grade}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">Not Graded</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                             <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/classes/${courseId}/buckets/${sub.bucketId}/content/${sub.contentId}/assignments/${sub.assignmentId}`}>
                                                    <Eye className="mr-2 h-4 w-4" /> View
                                                </Link>
                                             </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                           ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No submissions found for this course.
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
    )
}

    