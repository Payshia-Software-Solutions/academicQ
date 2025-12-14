
import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import { NProgressNext } from '@/components/ui/nprogress';
import { ThemeProvider } from "@/components/theme-provider"
import "plyr/dist/plyr.css";
import './globals.css';

export const metadata: Metadata = {
  title: 'AcademIQ',
  description: 'Student Management System integrated with LMS',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <NProgressNext />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
