
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { User, Mail, Smartphone, Edit, Briefcase, Home, Cake, UserSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';


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
  [key: string]: any;
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

export default function MyProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

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
                const response = await api.get(`/user-full-details/get/student/?student_number=${loggedInUser.student_number}`);
                if (response.data.found) {
                    setUser({ ...loggedInUser, ...response.data.data });
                } else {
                    setUser(loggedInUser);
                     if (loggedInUser.user_status === 'student') {
                        toast({
                            variant: 'destructive',
                            title: 'Profile Incomplete',
                            description: 'Please complete your profile details.',
                        });
                    }
                }
            } catch (error) {
                 setUser(loggedInUser);
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch your full profile details.',
                });
            } finally {
                setLoading(false);
            }
        } else {
            setUser(loggedInUser);
            setLoading(false);
        }
    }

    fetchUserDetails();
  }, [router, toast]);

  if (loading) {
    return (
        <div className="space-y-6">
            <header>
                <Skeleton className="h-10 w-1/3 mb-2" />
                <Skeleton className="h-5 w-1/2" />
            </header>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-6">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2">
                             <Skeleton className="h-8 w-48" />
                             <Skeleton className="h-5 w-32" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                     </div>
                     <div className="space-y-6">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                     </div>
                </CardContent>
            </Card>
        </div>
    )
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
                             {user.student_number && <Badge variant="outline">{user.student_number}</Badge>}
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
            <div className="space-y-6">
                 <h3 className="font-semibold border-b pb-2">Personal Information</h3>
                  <>
                      <ProfileDetail icon={UserSquare} label="Name with Initials" value={user.name_with_initials} />
                      <ProfileDetail icon={UserSquare} label="Name on Certificate" value={user.name_on_certificate} />
                      <ProfileDetail icon={Briefcase} label="NIC" value={user.nic} />
                      <ProfileDetail icon={User} label="Gender" value={user.gender} />
                      <ProfileDetail icon={User} label="Civil Status" value={user.civil_status} />
                      {user.birth_day && <ProfileDetail icon={Cake} label="Birthday" value={format(new Date(user.birth_day), 'MMMM dd, yyyy')} />}
                  </>
            </div>
             <div className="space-y-6">
                <h3 className="font-semibold border-b pb-2">Contact & Address</h3>
                <ProfileDetail icon={Mail} label="Email Address" value={user.e_mail || user.email} />
                <ProfileDetail icon={Smartphone} label="Primary Phone" value={user.telephone_1 || user.phone_number} />
                <ProfileDetail icon={Smartphone} label="Secondary Phone" value={user.telephone_2} />
                <ProfileDetail icon={Home} label="Address" value={address} />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
