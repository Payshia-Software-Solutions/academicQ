
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { users, institutes } from "@/lib/data";
import { Users, BookOpen, AlertCircle, ArrowRight, Building } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface CurrentUser {
  user_status: 'admin' | 'student';
  f_name: string;
  l_name: string;
  student_number?: string;
  [key: string]: any;
}

interface DashboardCounts {
  student_count: number;
  course_count: number;
  pending_payment_request_count: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
        router.push('/login');
    }
  }, [router]);
  
  useEffect(() => {
    async function checkProfileAndFetchCounts() {
      if (user) {
        try {
          const countPromise = api.get('/dashboard/counts');

          let profilePromise;
          if (user.student_number) {
            profilePromise = api.get(`/user-full-details/get/student/?student_number=${user.student_number}`);
          } else {
            profilePromise = Promise.resolve(null);
          }
          
          const [countResponse, profileResponse] = await Promise.all([countPromise, profilePromise]);

          if (countResponse.data.status === 'success') {
            setCounts(countResponse.data.data);
          }

          if (profileResponse && profileResponse.data && profileResponse.data.message === "User not found.") {
            setProfileIncomplete(true);
          } else {
            setProfileIncomplete(false);
          }
        } catch (error) {
          console.error("Failed to fetch dashboard data:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    
    checkProfileAndFetchCounts();

  }, [user]);

  const pendingPayments = users.filter(s => s.paymentStatus === 'Pending');
  const institute = institutes[0]; // In a real app, this would come from the user's session

  const getDashboardTitle = () => {
    if (!user) return 'Dashboard';
    if (user.user_status === 'admin') {
      return `${institute.name} Admin Dashboard`;
    }
    if (user.user_status === 'student') {
      return `Welcome, ${user.f_name} ${user.l_name}!`;
    }
    return `${institute.name} Dashboard`;
  };

  const getDashboardDescription = () => {
    if (!user) return "Welcome! Here's an overview of your institute's activity.";
    if (user.user_status === 'admin') {
      return "Here's an overview of your institute's activity.";
    }
    if (user.user_status === 'student') {
      return "Here is an overview of your classes and payment status.";
    }
    return "Welcome! Here's an overview of your institute's activity.";
  }

  if (loading || !user) {
    return (
      <div className="space-y-4">
        <header>
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-96 md:col-span-2" />
          <Skeleton className="h-64 md:col-span-1" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">{getDashboardTitle()}</h1>
        <p className="text-muted-foreground">{getDashboardDescription()}</p>
      </header>

      {profileIncomplete && (
         <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Complete Your Profile</AlertTitle>
          <AlertDescription>
            Your profile details are incomplete. Please fill them out to ensure full access to all features.
            <Button asChild variant="link" className="p-0 h-auto ml-2 font-bold underline">
                <Link href="/complete-profile">Complete Profile</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/students" className="block">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts?.student_count || 0}</div>
              <p className="text-xs text-muted-foreground">Currently enrolled</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.course_count || 0}</div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.pending_payment_request_count || 0}</div>
            <p className="text-xs text-muted-foreground">Students with outstanding balances</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Institute</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">{institute.name}</div>
            <p className="text-xs text-muted-foreground">Manage institute settings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
            <CardHeader>
            <CardTitle>Students with Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
            {/* Mobile View - Cards */}
            <div className="md:hidden">
                {pendingPayments.length > 0 ? (
                    <div className="space-y-4">
                    {pendingPayments.map((student) => (
                        <div key={student.id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Avatar>
                            <AvatarImage src={student.avatarUrl} alt={student.name} />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                            <Badge variant="destructive" className="mt-2">{student.paymentStatus}</Badge>
                            </div>
                        </div>
                        <Button asChild variant="ghost" size="icon">
                            <Link href={`/students/${student.id}`} aria-label={`View ${student.name}`}>
                            <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground">All student payments are up to date.</p>
                )}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pendingPayments.length > 0 ? (
                    pendingPayments.map((student) => (
                        <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell className="text-center">
                            <Badge variant="destructive">{student.paymentStatus}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button asChild variant="ghost" size="sm">
                            <Link href={`/students/${student.id}`}>View Student</Link>
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                        All student payments are up to date.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
            </CardContent>
        </Card>
        <Card className="md:col-span-1">
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    Institute Details
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <h3 className="font-semibold">{institute.name}</h3>
                <p className="text-sm text-muted-foreground">
                   Admin: {institute.adminEmail}
                </p>
                <Button variant="outline" size="sm" className="w-full mt-2">
                    Manage Institute Settings
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
