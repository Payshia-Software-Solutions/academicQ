import { Logo } from '@/components/icons';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-muted/40">
       <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
            <Logo />
        </div>
        {children}
      </div>
      <footer className="absolute bottom-4 text-center text-xs text-muted-foreground">
        Powered By Payshia software Solutions
      </footer>
    </main>
  );
}
