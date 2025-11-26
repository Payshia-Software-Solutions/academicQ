
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
} from '@/components/ui/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, LayoutDashboard, Users, CreditCard, LogOut, ChevronDown, FilePenLine, Upload, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useToast } from '@/hooks/use-toast';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';

interface CurrentUser {
  user_status: 'admin' | 'student';
  f_name?: string;
  l_name?: string;
  email?: string;
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
      setUser(JSON.parse(storedUser));
    } else {
        // Redirect to login if no user data found
        router.push('/login');
    }
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    toast({
      title: 'Signed Out',
      description: 'You have been successfully signed out.',
    });
    router.push('/login');
  };
  
  const isAdmin = user?.user_status === 'admin';

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="block">
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
            {isAdmin && (
              <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        isActive={isActive('/assignments')}
                        tooltip="Assignments"
                        className="justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <FilePenLine />
                          <span className="group-data-[state=collapsed]:hidden">Assignments</span>
                        </div>
                        <ChevronDown className="h-4 w-4 group-data-[state=collapsed]:hidden" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 ml-4">
                      <DropdownMenuItem asChild>
                          <Link href="/assignments/add">Create Assignment</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </SidebarMenuItem>
            )}
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
            {!isAdmin && (
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={isActive('/assignments/submit')}
                        tooltip="Submit Assignment"
                    >
                        <Link href="/assignments/submit">
                            <Upload />
                            <span className="group-data-[state=collapsed]:hidden">Submit Assignment</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )}
             <SidebarMenuItem>
                {isAdmin ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        isActive={isActive('/payments')}
                        tooltip="Payments"
                        className="justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard />
                          <span className="group-data-[state=collapsed]:hidden">Payments</span>
                        </div>
                        <ChevronDown className="h-4 w-4 group-data-[state=collapsed]:hidden" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 ml-4">
                      <DropdownMenuItem asChild>
                          <Link href="/payments/course-payment">Student Payment</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                          <Link href="/payments/request">Payment Request</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                   <SidebarMenuButton
                      asChild
                      isActive={isActive('/payments/request')}
                      tooltip="Payment Request"
                    >
                      <Link href="/payments/request">
                        <CreditCard />
                        <span className="group-data-[state=collapsed]:hidden">Payment Request</span>
                      </Link>
                    </SidebarMenuButton>
                )}
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
                tooltip={{
                    children: (
                        <div>
                            <p className="text-sm font-semibold text-sidebar-footer-foreground">{user?.f_name} {user?.l_name}</p>
                            <p className="text-xs text-muted-foreground group-hover:text-sidebar-footer-foreground">{user?.email}</p>
                        </div>
                    ),
                    className: "bg-sidebar-footer border-none p-2"
                }}
                className={cn(
                    "w-full h-auto p-0 bg-transparent hover:bg-transparent",
                    state === 'collapsed' && 'justify-center'
                )}
           >
            <div className={cn("flex items-center gap-3")}>
                <Avatar className="h-9 w-9">
                    <AvatarImage src="https://placehold.co/100x100.png" alt={user?.f_name} data-ai-hint="person avatar" />
                    <AvatarFallback>{user?.f_name?.charAt(0)}{user?.l_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="group-data-[state=collapsed]:hidden">
                    <p className="text-sm font-semibold text-sidebar-footer-foreground">{user?.f_name} {user?.l_name}</p>
                    <p className="text-xs text-muted-foreground group-hover:text-sidebar-footer-foreground">{user?.email}</p>
                </div>
            </div>
           </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
              <div className="md:hidden">
                <SidebarMenuButton asChild variant="ghost" size="icon" className="h-10 w-10">
                    <Link href={isAdmin ? "/dashboard" : "/classes"}>
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
