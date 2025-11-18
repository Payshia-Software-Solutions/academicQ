
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";
import type { Class } from "@/lib/types";

async function getClasses() {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/courses`);
        if (!response.ok) {
            console.error("Failed to fetch classes");
            return [];
        }
        const data = await response.json();
        
        // Map API response to the Class type
        return data.records.map((record: any) => ({
            id: record.id,
            name: record.course_name,
            description: record.description,
            teacher: 'N/A', // Not in API response
            schedule: 'N/A', // Not in API response
            studentIds: [], // Not in API response
            imageUrl: 'https://placehold.co/600x400.png' // Placeholder image
        }));
    } catch (error) {
        console.error("Error fetching classes:", error);
        return [];
    }
}

export default async function ClassesPage() {
  const classes: Class[] = await getClasses();

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Classes</h1>
            <p className="text-muted-foreground">Browse and manage class schedules and lessons.</p>
        </div>
         <Button asChild>
          <Link href="/classes/add">
            <Plus className="mr-2 h-4 w-4" />
            Create Class
          </Link>
        </Button>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.length > 0 ? classes.map((cls) => (
          <Card key={cls.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="p-0">
              <div className="relative h-48 w-full">
                <Image
                  src={cls.imageUrl}
                  alt={cls.name}
                  fill
                  style={{objectFit: "cover"}}
                  data-ai-hint="online course"
                />
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-grow">
              <CardTitle className="font-headline text-xl mb-2">{cls.name}</CardTitle>
              <CardDescription>{cls.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-6 pt-0 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{cls.teacher}</p>
                <p className="text-xs text-muted-foreground">{cls.schedule}</p>
              </div>
              <Button asChild size="sm" className="w-full sm:w-auto">
                <Link href={`/classes/${cls.id}`}>
                  View Class
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )) : (
            <p className="col-span-full text-center text-muted-foreground">No classes found.</p>
        )}
      </div>
    </div>
  );
}
