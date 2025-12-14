
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { users, payments as allPayments } from "@/lib/data";
import { DollarSign, Receipt, AlertCircle, Search, ArrowRight, ChevronDown, Filter } from "lucide-react";
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentRequestsList } from './_components/payment-requests-list';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type PaymentStatus = "All" | "Paid" | "Pending";

function PaymentsPageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus>('All');

  const paymentsWithStudentData = useMemo(() => {
    return allPayments.map(payment => {
      const student = users.find(u => u.id === payment.studentId);
      return {
        ...payment,
        studentName: student?.name || 'Unknown Student',
        studentEmail: student?.email || 'N/A',
        studentAvatar: student?.avatarUrl || '',
      };
    });
  }, []);

  const filteredPayments = useMemo(() => {
    return paymentsWithStudentData
      .filter(payment => {
        if (statusFilter !== 'All' && payment.status !== statusFilter) {
          return false;
        }
        if (searchQuery && !payment.studentName.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [searchQuery, statusFilter, paymentsWithStudentData]);

  const totalRevenue = useMemo(() => {
    return allPayments
      .filter(p => p.status === 'Paid')
      .reduce((acc, p) => acc + p.amount, 0);
  }, []);

  const paidInvoices = allPayments.filter(p => p.status === 'Paid').length;
  const pendingInvoices = allPayments.filter(p => p.status === 'Pending').length;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground">Track and manage all student payments and requests.</p>
        </div>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button>
                    Add Payment <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuItem asChild>
                    <Link href="/payments/student-payments">Student Payments</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/payments/request">Payment Request</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all paid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidInvoices}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>
      
       <Tabs defaultValue="history">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history">Payment History</TabsTrigger>
                <TabsTrigger value="requests">Payment Requests</TabsTrigger>
            </TabsList>
            <TabsContent value="history">
                <Card>
                    <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>
                        A detailed log of all transactions.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by student name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                        </div>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PaymentStatus)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Statuses</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Invoice ID</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayments.length > 0 ? (
                            filteredPayments.map((payment) => (
                                <TableRow key={payment.id} className="hover:bg-muted/50">
                                <TableCell className="font-mono text-xs">#{payment.id}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={payment.studentAvatar} alt={payment.studentName} data-ai-hint="person avatar"/>
                                        <AvatarFallback>{payment.studentName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{payment.studentName}</p>
                                        <p className="text-sm text-muted-foreground">{payment.studentEmail}</p>
                                    </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">${payment.amount.toFixed(2)}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={payment.status === 'Paid' ? 'secondary' : 'destructive'}>
                                    {payment.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {format(new Date(payment.date), 'PP')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="ghost" size="icon">
                                        <Link href={`/students/${payment.studentId}`} aria-label={`View ${payment.studentName}`}>
                                        <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                No payments found.
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </div>
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="requests">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                             <div>
                                <CardTitle>All Payment Requests</CardTitle>
                                <CardDescription>A list of all submitted payment requests from students.</CardDescription>
                            </div>
                            <Button asChild variant="outline">
                                <Link href="/payments/requests">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filter Requests
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <PaymentRequestsList />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}

export default function PaymentsPage() {
    return (
        <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <PaymentsPageContent />
        </Suspense>
    )
}
