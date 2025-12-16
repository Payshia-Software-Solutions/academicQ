
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { User, Mail, Smartphone, Edit, Briefcase, Home, Cake, UserSquare, AlertCircle, List, BookOpen, Inbox, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
    submissions: Submission[];
}

interface Payment {
    id: string;
    payment_amount: string;
    discount_amount: string;
    created_at: string;
}

interface PaymentDetails {
    course_bucket_price: number;
    total_paid_amount: number;
    balance: number;
    payments: Payment[];
}

interface Bucket {
    id: string;
    name: string;
    payment_details: PaymentDetails;
}

interface Course {
    id: string;
    course_name: string;
    buckets: Bucket[];
    assignments: Assignment[];
}


interface CurrentUser {
  user_status: 'admin' | 'student';
  f_name: string;
  l_name: string;
  email: string;
  phone_number: string;
  student_number?: string;
  nic?: string;
  civil_status?: string;
  gender?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  telephone_1?: string;
  telephone_2?: string;
  e_mail?: string;
  birth_day?: string;
  full_name?: string;
  name_with_initials?: string;
  name_on_certificate?: string;
  courses?: Course[];
  [key: string]: any;
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

function ProfileDetail({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-4">
            <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium break-words">{value}</p>
            </div>
        </div>
    )
}

const getFullFileUrl = (filePath: string) => {
    if (!filePath) return '#';
    const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL;
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }
    return `${baseUrl}${filePath}`;
};

export default function MyProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    const storedUserStr = localStorage.getItem('user');
    if (!storedUserStr) {
        router.push('/login');
        return;
    }
    const loggedInUser: CurrentUser = JSON.parse(storedUserStr);

    async function fetchUserDetails() {
        if (loggedInUser.student_number) {
            try {
                const response = await api.get(`/user-full-details/full/student/courses/?student_number=${loggedInUser.student_number}`);
                if (response.data.status === 'success' && response.data.data) {
                    setUser(response.data.data);
                    setProfileIncomplete(false);
                } else {
                    setUser(loggedInUser);
                    setProfileIncomplete(true);
                }
            } catch (error) {
                 setUser(loggedInUser);
                 setProfileIncomplete(true);
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch your full profile details.',
                });
            } finally {
                setLoading(false);
            }
        } else {
            // This case handles admins who don't have a student_number
            try {
                 const response = await api.get(`/user-full-details/get/student/?student_number=${loggedInUser.student_number}`);
                 if (response.data && response.data.message !== "User not found.") {
                    setUser({ ...loggedInUser, ...response.data.data });
                    setProfileIncomplete(false);
                } else {
                    setUser(loggedInUser);
                    setProfileIncomplete(true);
                }
            } catch (error) {
                 setUser(loggedInUser);
                 setProfileIncomplete(true);
            } finally {
                setLoading(false);
            }
        }
    }

    fetchUserDetails();
  }, [router, toast]);

  if (loading) {
    return (
        <div className="space-y-6">
            <header>
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-4 w-72 mt-2" />
            </header>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-6">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2">
                             <Skeleton className="h-8 w-64" />
                             <Skeleton className="h-5 w-48" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-6">
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!user) {
    return null;
  }

  const fullName = user.full_name || `${user.f_name} ${user.l_name}`;
  const isAdmin = user.user_status === 'admin';
  const address = [user.address_line_1, user.address_line_2, user.city].filter(Boolean).join(', ');
  
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">View and manage your personal information.</p>
      </header>

       {profileIncomplete && !isAdmin && (
         <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Incomplete</AlertTitle>
          <AlertDescription>
            Your profile details are missing. Please complete your profile to access all features.
             <Button asChild variant="link" className="p-0 h-auto ml-2 font-bold underline">
                <Link href="/complete-profile">Complete Profile Now</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src="https://placehold.co/100x100.png" alt={fullName} data-ai-hint="person avatar" />
                            <AvatarFallback>{user.f_name?.charAt(0)}{user.l_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                            <CardTitle className="text-2xl">{fullName}</CardTitle>
                            <CardDescription className="flex items-center justify-center gap-2 mt-1">
                                <Badge variant={isAdmin ? "destructive" : "secondary"} className="capitalize">{user.user_status}</Badge>
                                {user.student_number && <Badge variant="outline">{user.student_number}</Badge>}
                            </CardDescription>
                        </div>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/complete-profile">
                                <Edit className="mr-2 h-4 w-4"/>
                                Edit Profile
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-3 text-sm">
                        <ProfileDetail icon={Mail} label="Email Address" value={user.e_mail || user.email} />
                        <ProfileDetail icon={Smartphone} label="Primary Phone" value={user.telephone_1 || user.phone_number} />
                        <ProfileDetail icon={Briefcase} label="NIC" value={user.nic} />
                        {user.birth_day && <ProfileDetail icon={Cake} label="Birthday" value={format(new Date(user.birth_day), 'MMMM dd, yyyy')} />}
                        <ProfileDetail icon={Home} label="Address" value={address} />
                    </div>
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
                    {user.courses && user.courses.length > 0 ? (
                        <Accordion type="multiple" className="w-full">
                            {user.courses.map(course => (
                                <AccordionItem value={`course-${course.id}`} key={course.id}>
                                    <AccordionTrigger className="font-semibold text-lg hover:no-underline">
                                        {course.course_name}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="pl-4 space-y-6">
                                            {course.buckets && course.buckets.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold mt-2 flex items-center gap-2"><Inbox className="h-4 w-4 text-muted-foreground"/> Payment Buckets</h4>
                                                    <div className="space-y-3 mt-2">
                                                        {course.buckets.map(bucket => (
                                                            <div key={bucket.id} className="border-l-2 pl-3">
                                                                <p className="font-medium">{bucket.name}</p>
                                                                <div className="text-xs text-muted-foreground grid grid-cols-2 gap-x-4">
                                                                    <p>Total Paid: <span className="font-semibold">LKR {bucket.payment_details.total_paid_amount.toLocaleString()}</span></p>
                                                                    <p>Balance: <span className={`font-semibold ${bucket.payment_details.balance <= 0 ? 'text-green-600' : 'text-destructive'}`}>LKR {Math.abs(bucket.payment_details.balance).toLocaleString()}</span></p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div>
                                                <h4 className="font-semibold mt-2 flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" /> Assignments</h4>
                                                {course.assignments && course.assignments.length > 0 ? (
                                                    <div className="space-y-3 mt-2">
                                                        {course.assignments.map(assignment => (
                                                            <div key={assignment.id} className="border-l-2 pl-3">
                                                                <p className="font-medium">{assignment.content_title}</p>
                                                                {assignment.deadline_date && <p className="text-xs text-muted-foreground">Deadline: {format(new Date(assignment.deadline_date), 'PP p')}</p>}
                                                                
                                                                <div className="mt-2 space-y-2">
                                                                    {assignment.submissions && assignment.submissions.length > 0 ? assignment.submissions.map(sub => (
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
                                                                    )) : (
                                                                        <p className="text-xs text-muted-foreground">No submissions yet.</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground text-center py-4">No assignments for this course.</p>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <p className="text-muted-foreground text-center py-10">You are not enrolled in any courses.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

    