
'use client';

import type { Class, Lesson, User } from '@/lib/types';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LessonView } from '../../../_components/lesson-view';
import { Eye, ListVideo, Unlock, Lock } from 'lucide-react';
import Link from 'next/link';

interface LessonDetailsClientProps {
  lesson: Lesson;
  enrolledStudents: User[];
  otherLessons: Lesson[];
  classInfo: Class;
}

export function LessonDetailsClient({ lesson, enrolledStudents, otherLessons, classInfo }: LessonDetailsClientProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(enrolledStudents[0]?.id || null);

  const selectedStudent = useMemo(() => {
      return enrolledStudents.find(s => s.id === selectedStudentId);
  }, [selectedStudentId, enrolledStudents]);
  
  const isPaid = !!selectedStudent && selectedStudent.paymentStatus === 'Paid';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
         <LessonView lesson={lesson} isLocked={!isPaid} />
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye /> Student View</CardTitle>
            <CardDescription>Select a student to see their access status.</CardDescription>
          </CardHeader>
          <CardContent>
            {enrolledStudents.length > 0 ? (
                <>
                <Select onValueChange={setSelectedStudentId} defaultValue={selectedStudentId || undefined}>
                  <SelectTrigger id="student-view" aria-label="View as student">
                    <SelectValue placeholder="View as..." />
                  </SelectTrigger>
                  <SelectContent>
                    {enrolledStudents.map(student => (
                      <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStudent && (
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    {isPaid ? <Unlock className="h-4 w-4 text-green-500" /> : <Lock className="h-4 w-4 text-destructive" />}
                    <span className={isPaid ? 'text-green-600' : 'text-destructive'}>
                      {selectedStudent.name} has {isPaid ? 'paid' : 'a pending payment'}.
                    </span>
                  </div>
                )}
              </>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No students enrolled in this class.</p>
            )}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ListVideo />
                    Other Lessons
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {otherLessons.map(otherLesson => (
                        <li key={otherLesson.id}>
                            <Link href={`/classes/${classInfo.id}/lessons/${otherLesson.id}`} className="block p-3 rounded-md border hover:bg-muted/50 transition-colors">
                                <p className="font-medium">{otherLesson.title}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">{otherLesson.description}</p>
                            </Link>
                        </li>
                    ))}
                    {otherLessons.length === 0 && (
                        <p className="text-muted-foreground text-center">No other lessons in this class.</p>
                    )}
                </ul>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
