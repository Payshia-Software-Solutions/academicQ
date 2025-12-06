
'use client';
import { Logo } from '@/components/icons';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarTrigger,
  SidebarSubMenu,
  SidebarSubMenuContent,
  SidebarSubMenuButton,
} from '@/components/ui/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, LayoutDashboard, Users, CreditCard, LogOut, ChevronDown, ListChecks, UserCheck, Package, History, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useToast } from '@/hooks/use-toast';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState, useMemo } from 'react';
import { ProfileCheckHandler } from './_components/profile-check-handler';

interface CurrentUser {
  id?: string;
  user_status: 'admin' | 'student';
  f_name?: string;
  l_name?: string;
  email?: string;
  student_number?: string;
  [key: string]: any;
}


function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { state } = useSidebar();
  const isActive = (path: string) => pathname.startsWith(path);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser: CurrentUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.user_status === 'student' && pathname === '/dashboard') {
          router.replace('/student-dashboard');
      }
    } else if (pathname !== '/login' && pathname !== '/register') {
        router.push('/login');
    }
  }, [router, pathname]);

  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('profileCheckComplete');
    toast({
      title: 'Signed Out',
      description: 'You have been successfully signed out.',
    });
    router.push('/login');
  };
  
  const isAdmin = user?.user_status === 'admin';
  const homePath = isAdmin ? '/dashboard' : '/student-dashboard';

  const profilePath = useMemo(() => {
    if (!user) return '#';
    return '/my-profile';
  }, [user]);

  if (!user) {
    return (
        <div className="flex items-center justify-center h-screen">
             {children}
        </div>
    );
  }

  return (
    <div className="flex">
      {user?.student_number && <ProfileCheckHandler studentNumber={user.student_number} />}
      <Sidebar>
        <SidebarHeader>
          <Link href={homePath} className="block">
            <Logo className="text-foreground" />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {isAdmin && (
               <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/dashboard'}
                  tooltip="Dashboard"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span className="group-data-[state=collapsed]:hidden">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
             {!isAdmin && (
               <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/student-dashboard'}
                  tooltip="Dashboard"
                >
                  <Link href="/student-dashboard">
                    <LayoutDashboard />
                    <span className="group-data-[state=collapsed]:hidden">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/my-profile')}
                  tooltip="My Profile"
                >
                  <Link href="/my-profile">
                    <UserIcon />
                    <span className="group-data-[state=collapsed]:hidden">My Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            {isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/students')}
                  tooltip="Students"
                >
                  <Link href="/students">
                    <Users />
                    <span className="group-data-[state=collapsed]:hidden">Students</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive('/classes')}
                tooltip="Classes"
              >
                <Link href="/classes">
                  <BookOpen />
                  <span className="group-data-[state=collapsed]:hidden">Classes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarSubMenu>
                <SidebarMenuItem value="study-packs">
                   <SidebarSubMenuButton
                      isActive={isActive('/study-packs')}
                      tooltip="Study Packs"
                      className="justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Package />
                        <span className="group-data-[state=collapsed]:hidden">Study Packs</span>
                      </div>
                      <ChevronDown className="h-4 w-4 group-data-[state=collapsed]:hidden" />
                    </SidebarSubMenuButton>
                  <SidebarSubMenuContent>
                     <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/study-packs'}>
                        <Link href="/study-packs">> Order Packs</Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive('/study-packs/history')}>
                          <Link href="/study-packs/history">> Order History</Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                     {isAdmin && (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive('/study-packs/all-orders')}>
                                <Link href="/study-packs/all-orders">> All Orders</Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                     )}
                  </SidebarSubMenuContent>
                </SidebarMenuItem>
              </SidebarSubMenu>
            </SidebarMenuItem>
            
             {isAdmin && (
                 <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={isActive('/submissions')}
                        tooltip="Submissions"
                    >
                        <Link href="/submissions">
                            <ListChecks />
                            <span className="group-data-[state=collapsed]:hidden">Submissions</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )}
            {isAdmin && (
                 <SidebarMenuItem>
                  <SidebarSubMenu>
                    <SidebarMenuItem value="enrollments">
                      <SidebarSubMenuButton
                          isActive={isActive('/enrollments')}
                          tooltip="Enrollments"
                          className="justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <UserCheck />
                            <span className="group-data-[state=collapsed]:hidden">Enrollments</span>
                          </div>
                          <ChevronDown className="h-4 w-4 group-data-[state=collapsed]:hidden" />
                        </SidebarSubMenuButton>
                      <SidebarSubMenuContent>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={pathname === '/enrollments'}>
                            <Link href="/enrollments">> Pending</Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={isActive('/enrollments/by-course')}>
                              <Link href="/enrollments/by-course">> By Course</Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarSubMenuContent>
                    </SidebarMenuItem>
                  </SidebarSubMenu>
                </SidebarMenuItem>
            )}
             <SidebarMenuItem>
                {isAdmin ? (
                  <SidebarSubMenu>
                    <SidebarMenuItem value="payments">
                      <SidebarSubMenuButton
                          isActive={isActive('/payments')}
                          tooltip="Payments"
                          className="justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard />
                            <span className="group-data-[state=collapsed]:hidden">Payments</span>
                          </div>
                          <ChevronDown className="h-4 w-4 group-data-[state=collapsed]:hidden" />
                        </SidebarSubMenuButton>
                      <SidebarSubMenuContent>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={isActive('/payments/course-payment')}>
                            <Link href="/payments/course-payment">> Student Payment</Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={isActive('/payments/request')}>
                              <Link href="/payments/request">> Payment Request</Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={isActive('/payments/requests')}>
                              <Link href="/payments/requests">> Filtered Requests</Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarSubMenuContent>
                    </SidebarMenuItem>
                  </SidebarSubMenu>
                ) : null}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className={cn('p-4 space-y-4 bg-sidebar-footer', state === 'collapsed' && 'p-2')}>
           <div className={cn("flex items-center justify-between", state === 'collapsed' && 'justify-center')}>
             <ThemeSwitcher />
             <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out" variant="ghost" size="icon">
                <LogOut />
                <span className="sr-only">Sign Out</span>
             </SidebarMenuButton>
           </div>
           <SidebarMenuButton 
                asChild
                tooltip={{
                    children: (
                        <div>
                            <p className="text-sm font-semibold text-sidebar-footer-foreground">{user?.f_name} {user?.l_name}</p>
                            <p className="text-xs text-muted-foreground group-hover:text-sidebar-footer-foreground">{user?.email}</p>
                            {!isAdmin && user?.student_number && (
                                <p className="text-xs text-muted-foreground group-hover:text-sidebar-footer-foreground font-mono">{user.student_number}</p>
                            )}
                        </div>
                    ),
                    className: "bg-sidebar-footer border-none p-2"
                }}
                className={cn(
                    "w-full h-auto p-0 bg-transparent hover:bg-transparent",
                    state === 'collapsed' && 'justify-center'
                )}
           >
            <Link href={profilePath}>
                <div className={cn("flex items-center gap-3")}>
                    <Avatar className="h-9 w-9">
                        <AvatarImage src="https://placehold.co/100x100.png" alt={user?.f_name} data-ai-hint="person avatar" />
                        <AvatarFallback>{user?.f_name?.charAt(0)}{user?.l_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="group-data-[state=collapsed]:hidden">
                        <p className="text-sm font-semibold text-sidebar-footer-foreground">{user?.f_name} {user?.l_name}</p>
                        <p className="text-xs text-muted-foreground group-hover:text-sidebar-footer-foreground">{user?.email}</p>
                        {!isAdmin && user?.student_number && (
                            <p className="text-xs text-muted-foreground group-hover:text-sidebar-footer-foreground font-mono">{user.student_number}</p>
                        )}
                    </div>
                </div>
            </Link>
           </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
              <div className="md:hidden">
                <SidebarMenuButton asChild variant="ghost" size="icon" className="h-10 w-10">
                    <Link href={homePath}>
                        <Logo className="text-foreground h-6 w-auto" />
                    </Link>
                </SidebarMenuButton>
              </div>
              <div className="flex-1">
                  {/* Header content can go here if needed */}
              </div>
              <SidebarTrigger className="md:hidden" />
          </header>
          <main className="p-4 sm:p-6">
              {children}
          </main>
          <footer className="text-center p-4 text-xs text-muted-foreground">
            Powered By Payshia software Solutions
          </footer>
      </SidebarInset>
    </div>
  )
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}
