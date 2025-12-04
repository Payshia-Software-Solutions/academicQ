
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { User, Mail, Smartphone, Edit, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CurrentUser {
  user_status: 'admin' | 'student';
  f_name: string;
  l_name: string;
  email: string;
  phone_number: string;
  student_number?: string;
  nic?: string;
  [key: string]: any;
}

function ProfileDetail({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-4">
            <Icon className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    )
}

export default function MyProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
        // If no user, redirect to login
        router.push('/login');
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2">
                             <Skeleton className="h-8 w-48" />
                             <Skeleton className="h-5 w-32" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!user) {
    return null; // or a message saying user not found
  }

  const fullName = `${user.f_name} ${user.l_name}`;
  const isAdmin = user.user_status === 'admin';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">View and manage your personal information.</p>
      </header>

      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src="https://placehold.co/100x100.png" alt={fullName} data-ai-hint="person avatar" />
                        <AvatarFallback>{user.f_name?.charAt(0)}{user.l_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl">{fullName}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge variant={isAdmin ? "destructive" : "secondary"} className="capitalize">{user.user_status}</Badge>
                        </CardDescription>
                    </div>
                </div>
                <Button variant="outline" disabled>
                    <Edit className="mr-2 h-4 w-4"/>
                    Edit Profile
                </Button>
            </div>
        </CardHeader>
        <CardContent className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <ProfileDetail icon={Mail} label="Email Address" value={user.email} />
            <ProfileDetail icon={Smartphone} label="Phone Number" value={user.phone_number} />
            
            {!isAdmin && (
                <>
                 <ProfileDetail icon={User} label="Student Number" value={user.student_number} />
                 <ProfileDetail icon={Briefcase} label="NIC" value={user.nic} />
                </>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
