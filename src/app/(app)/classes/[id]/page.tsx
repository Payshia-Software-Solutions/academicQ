
import { classes, users as allStudents, lessons as allLessons } from '@/lib/data';
import { notFound } from 'next/navigation';
import { ClassDetailsClient } from './_components/class-details-client';

export default async function ClassDetailsPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch this data from an API based on the params.id
  // const response = await fetch(`https://qa-lms-server.com/courses/${params.id}`);
  // const classInfo = await response.json();
  
  const classInfo = classes.find((c) => c.id === params.id);

  if (!classInfo) {
    notFound();
  }

  // Fetch enrolled students and lessons for the class
  const enrolledStudents = classInfo.studentIds.map(id => 
    allStudents.find(s => s.id === id)
  ).filter(Boolean);

  const lessons = allLessons.filter(l => l.classId === classInfo.id);

  return (
    <ClassDetailsClient
      classInfo={classInfo}
      enrolledStudents={enrolledStudents}
      lessons={lessons}
    />
  );
}
