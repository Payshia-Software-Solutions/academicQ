
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { AddStudentDialog } from "./_components/add-student-dialog";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Student {
  id: string;
  f_name: string;
  l_name: string;
  email: string;
  student_number: string | null;
  is_active: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchStudents() {
      setIsLoading(true);
      try {
        const response = await api.get('/users/?status=student');
        if (response.data.status === 'success') {
          setStudents(response.data.data || []);
        } else {
           setStudents([]);
        }
      } catch (error: any) {
        setStudents([]);
        toast({
          variant: 'destructive',
          title: 'API Error',
          description: error.message || 'Could not fetch students.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudents();
  }, [toast]);

  const handleStudentAdded = (newStudent: Student) => {
    setStudents(prev => [newStudent, ...prev]);
  };

  const renderStudentList = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
            <TableCell colSpan={4}>
                <Skeleton className="h-12 w-full" />
            </TableCell>
        </TableRow>
      ));
    }

    if (students.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center">
            No students found.
          </TableCell>
        </TableRow>
      );
    }

    return students.map((student) => {
      const studentName = `${student.f_name} ${student.l_name}`;
      return (
        <TableRow key={student.id} className="hover:bg-muted/50">
          <TableCell>
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={`https://placehold.co/100x100.png`} alt={studentName} />
                <AvatarFallback>{student.f_name.charAt(0)}{student.l_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{studentName}</div>
                <div className="text-sm text-muted-foreground">{student.email}</div>
              </div>
            </div>
          </TableCell>
          <TableCell className="text-muted-foreground font-mono">{student.student_number || 'N/A'}</TableCell>
          <TableCell className="text-center">
            <Badge variant={student.is_active === '1' ? 'secondary' : 'destructive'}>
              {student.is_active === '1' ? 'Active' : 'Inactive'}
            </Badge>
          </TableCell>
          <TableCell className="text-right">
            <Button asChild variant="ghost" size="icon">
              <Link href={`/students/${student.student_number}`} aria-label={`View ${studentName}`}>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </TableCell>
        </TableRow>
      )
    });
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground">Manage your student database.</p>
        </div>
        <AddStudentDialog onStudentAdded={handleStudentAdded} />
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            {students.length} student(s) in total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderStudentList()}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
