
import { users, classes as allClasses } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { List, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const student = users.find((s) => s.id === params.id);

  if (!student) {
    notFound();
  }

  const enrolledClasses = student.classIds.map(classId => 
    allClasses.find(c => c.id === classId)
  ).filter(Boolean);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`student_id:${student.id}`)}`;

  return (
    <div className="space-y-8">
       <header>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">{student.name}</h1>
        <p className="text-muted-foreground">Student Profile & Records</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student QR Code</CardTitle>
              <CardDescription>For quick identification and check-in.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center p-6">
              <Image 
                src={qrCodeUrl} 
                alt={`QR code for ${student.name}`} 
                width={150} 
                height={150}
                className="rounded-lg shadow-md"
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={student.avatarUrl} alt={student.name} />
                                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-2xl">{student.name}</CardTitle>
                                <CardDescription>{student.email}</CardDescription>
                            </div>
                        </div>
                         <Badge variant={student.paymentStatus === 'Paid' ? 'secondary' : 'destructive'} className="text-sm self-start sm:self-center">
                            {student.paymentStatus}
                        </Badge>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5"/>
                    Enrolled Classes
                </CardTitle>
                </CardHeader>
                <CardContent>
                {enrolledClasses.length > 0 ? (
                    <div className="space-y-4">
                    {enrolledClasses.map((c) => c && (
                        <Link href={`/classes/${c.id}`} key={c.id} className="block group">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-2">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-accent/10 rounded-lg">
                                        <BookOpen className="h-6 w-6 text-accent"/>
                                    </div>
                                    <div>
                                        <p className="font-semibold">{c.name}</p>
                                        <p className="text-sm text-muted-foreground">Taught by {c.teacher}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground group-hover:text-accent transition-colors self-end sm:self-center">{c.schedule}</p>
                            </div>
                        </Link>
                    ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center">Not enrolled in any classes.</p>
                )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
