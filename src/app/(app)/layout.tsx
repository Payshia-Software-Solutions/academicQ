
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
import { BookOpen, LayoutDashboard, Users, CreditCard, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useToast } from '@/hooks/use-toast';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { state } = useSidebar();
  const isActive = (path: string) => pathname.startsWith(path);

  const handleSignOut = () => {
    // In a real app, you would also clear session/authentication state here
    toast({
      title: 'Signed Out',
      description: 'You have been successfully signed out.',
    });
    router.push('/login');
  };
  
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
                        <Link href="/payments/add">Student Payment</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/payments/request">Payment Request</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                            <p className="text-sm font-semibold text-sidebar-footer-foreground">System Administrator</p>
                            <p className="text-xs text-muted-foreground group-hover:text-sidebar-footer-foreground">hmdilipkf@gmail.com</p>
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
                    <AvatarImage src="https://placehold.co/100x100.png" alt="System Administrator" data-ai-hint="person avatar" />
                    <AvatarFallback>SA</AvatarFallback>
                </Avatar>
                <div className="group-data-[state=collapsed]:hidden">
                    <p className="text-sm font-semibold text-sidebar-footer-foreground">System Administrator</p>
                    <p className="text-xs text-muted-foreground group-hover:text-sidebar-footer-foreground">hmdilipkf@gmail.com</p>
                </div>
            </div>
           </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
              <div className="md:hidden">
                <SidebarMenuButton asChild variant="ghost" size="icon" className="h-10 w-10">
                    <Link href="/dashboard">
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
