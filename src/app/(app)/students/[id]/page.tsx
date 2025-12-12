
'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { List, User, Mail, Smartphone, Hash } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface Submission {
    id: string;
    grade: string | null;
    sub_status: 'graded' | 'submitted' | 'rejected' | 'late_submit' | string;
    file_path: string;
    created_at: string;
}

interface Assignment {
    id: string;
    content_title: string;
    deadline_date: string | null;
    submition_count: string;
    submissions: Submission[];
}

interface Course {
    id: string;
    course_name: string;
    course_description: string;
    assignments: Assignment[];
}

interface StudentData {
    id: string;
    f_name: string;
    l_name: string;
    email: string;
    nic: string;
    phone_number: string;
    user_status: string;
    student_number: string;
    is_active: string;
    courses: Course[];
}

function getStatusVariant(status: string | null) {
    switch (status) {
        case 'graded':
        case 'delivered':
            return 'secondary';
        case 'submitted':
        case 'handed over':
            return 'default';
        case 'rejected':
        case 'cancelled':
        case 'returned':
            return 'destructive';
        case 'pending':
        case 'late_submit':
        default:
            return 'outline';
    }
}

function StatusBadge({ status }: { status: string | null }) {
    if (!status) return null;
    return (
        <Badge variant={getStatusVariant(status)} className="capitalize">
            {status.replace(/_/g, ' ')}
        </Badge>
    );
}

function StudentProfilePageContent() {
    const params = useParams();
    const studentId = params.id as string; // This is the student_number
    const { toast } = useToast();

    const [studentData, setStudentData] = useState<StudentData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;

        async function fetchStudentData() {
            setIsLoading(true);
            try {
                const response = await api.get(`/user-full-details/full/student/courses/?student_number=${studentId}`);
                if (response.data.status === 'success') {
                    setStudentData(response.data.data);
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch student details.' });
                }
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'API Error', description: error.message || 'Could not fetch student details.' });
            } finally {
                setIsLoading(false);
            }
        }

        fetchStudentData();
    }, [studentId, toast]);

    if (isLoading) {
        return (
            <div className="space-y-8">
                <header>
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-5 w-1/3 mt-2" />
                </header>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1 space-y-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!studentData) {
        return <p>Student not found.</p>;
    }
    
    const fullName = `${studentData.f_name} ${studentData.l_name}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`student_id:${studentData.student_number}`)}`;

    const getFullFileUrl = (filePath: string) => {
        if (!filePath) return '#';
        const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL;
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }
        return `${baseUrl}${filePath}`;
    };

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">{fullName}</h1>
                <p className="text-muted-foreground">Student Profile & Academic Records</p>
            </header>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={`https://placehold.co/100x100.png`} alt={fullName} />
                                    <AvatarFallback>{studentData.f_name.charAt(0)}{studentData.l_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-xl">{fullName}</CardTitle>
                                    <Badge variant={studentData.is_active === '1' ? 'secondary' : 'destructive'} className="mt-1">
                                        {studentData.is_active === '1' ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><span className="break-all">{studentData.email}</span></div>
                            <div className="flex items-center gap-3"><Smartphone className="h-4 w-4 text-muted-foreground" /><span>{studentData.phone_number}</span></div>
                            <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /><span>{studentData.nic}</span></div>
                            <div className="flex items-center gap-3"><Hash className="h-4 w-4 text-muted-foreground" /><span className="font-mono">{studentData.student_number}</span></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Student QR Code</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center items-center p-6">
                            <Image
                                src={qrCodeUrl}
                                alt={`QR code for ${fullName}`}
                                width={150}
                                height={150}
                                className="rounded-lg shadow-md"
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <List className="h-5 w-5" />
                                Academic History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {studentData.courses && studentData.courses.length > 0 ? (
                                <Accordion type="multiple" className="w-full">
                                    {studentData.courses.map(course => (
                                        <AccordionItem value={`course-${course.id}`} key={course.id}>
                                            <AccordionTrigger className="font-semibold text-lg hover:no-underline">
                                                {course.course_name}
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="pl-4 space-y-4">
                                                    <h4 className="font-semibold mt-2">Assignments</h4>
                                                    {course.assignments && course.assignments.length > 0 ? (
                                                        <ul className="space-y-3">
                                                            {course.assignments.map(assignment => (
                                                                <li key={assignment.id} className="border-l-2 pl-3">
                                                                    <p className="font-medium">{assignment.content_title}</p>
                                                                    {assignment.deadline_date && <p className="text-xs text-muted-foreground">Deadline: {format(new Date(assignment.deadline_date), 'PP p')}</p>}
                                                                    
                                                                    <div className="mt-2 space-y-2">
                                                                        {assignment.submissions.map(sub => (
                                                                             <div key={sub.id} className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/50">
                                                                                <div className="flex items-center gap-2">
                                                                                     <Button asChild variant="ghost" size="icon" className="h-6 w-6">
                                                                                        <a href={getFullFileUrl(sub.file_path)} target="_blank" rel="noopener noreferrer">
                                                                                            <Download className="h-3 w-3" />
                                                                                        </a>
                                                                                    </Button>
                                                                                    <span>Submission on {format(new Date(sub.created_at), 'PP')}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                     <StatusBadge status={sub.sub_status} />
                                                                                    {sub.grade && (
                                                                                        <Badge variant="secondary" className="font-mono">{sub.grade}</Badge>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                         {assignment.submissions.length === 0 && <p className="text-xs text-muted-foreground">No submissions yet.</p>}
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                         <p className="text-sm text-muted-foreground text-center py-4">No assignments for this course.</p>
                                                    )}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            ) : (
                                <p className="text-muted-foreground text-center py-10">Not enrolled in any courses.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function StudentProfilePage() {
    return <StudentProfilePageContent />;
}
