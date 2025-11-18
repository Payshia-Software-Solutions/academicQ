
import { classes, lessons as allLessons, users as allStudents } from '@/lib/data';
import { notFound } from 'next/navigation';
import { LessonDetailsClient } from './_components/lesson-details-client';
import type { Lesson } from '@/lib/types';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';


export default function LessonDetailsPage({ params }: { params: { id: string, lessonId: string } }) {
  const classInfo = classes.find((c) => c.id === params.id);
  const lesson = allLessons.find((l) => l.id === params.lessonId && l.classId === params.id);

  if (!classInfo || !lesson) {
    notFound();
  }

  const enrolledStudents = classInfo.studentIds.map(id => 
    allStudents.find(s => s.id === id)
  ).filter(Boolean) as any[];
  
  const otherLessons = allLessons.filter(l => l.classId === classInfo.id && l.id !== lesson.id);

  return (
    <div className="space-y-6">
        <header>
            <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
                <Link href="/classes" className="hover:underline">Classes</Link>
                <ChevronRight className="h-4 w-4 mx-1" />
                <Link href={`/classes/${classInfo.id}`} className="hover:underline truncate">{classInfo.name}</Link>
                 <ChevronRight className="h-4 w-4 mx-1" />
                <span className="truncate">{lesson.title}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">{lesson.title}</h1>
            <p className="text-muted-foreground mt-1">{lesson.description}</p>
        </header>

        <LessonDetailsClient 
            lesson={lesson} 
            enrolledStudents={enrolledStudents}
            otherLessons={otherLessons}
            classInfo={classInfo}
        />
    </div>
  );
}

