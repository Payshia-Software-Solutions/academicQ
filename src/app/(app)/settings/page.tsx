
import Link from 'next/link';
import { ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import { InstituteSettingsForm } from './_components/institute-settings-form';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Institute Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your institute's details and branding.</p>
      </header>

      <InstituteSettingsForm />

    </div>
  );
}
