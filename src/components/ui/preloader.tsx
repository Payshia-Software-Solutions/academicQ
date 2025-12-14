import { BookOpen, Loader2 } from 'lucide-react';

export function Preloader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
            <div className="relative">
                <BookOpen className="h-16 w-16 text-primary/30" />
                <Loader2 className="absolute inset-0 h-16 w-16 animate-spin text-primary" />
            </div>
            <p className="mt-4 text-lg font-semibold">Loading data...</p>
            <p className="text-sm">Please wait a moment.</p>
        </div>
    )
}
