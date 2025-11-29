
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";
import type { Class } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useIsMobile } from '@/hooks/use-mobile';


interface CurrentUser {
  user_status: 'admin' | 'student';
  [key: string]: any;
}

interface ApiCourse {
    id: string;
    course_name: string;
    description: string;
    img_url?: string;
    [key: string]: any;
}

async function getClasses(): Promise<Class[]> {
    try {
        const response = await api.get('/courses');
        if (response.status !== 200 || response.data.status !== 'success') {
            console.error("Failed to fetch classes:", response.data?.message);
            return [];
        }
        const data = response.data.data;
        
        return data.map((record: ApiCourse) => ({
            id: record.id,
            name: record.course_name,
            description: record.description,
            teacher: 'N/A', 
            schedule: 'N/A', 
            studentIds: [], 
            imageUrl: record.img_url || 'https://placehold.co/600x400.png'
        }));
    } catch (error) {
        console.error("Error fetching classes:", error);
        return [];
    }
}

function ClassCard({ cls }: { cls: Class }) {
    return (
        <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
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
    )
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    async function loadClasses() {
        setLoading(true);
        const fetchedClasses = await getClasses();
        setClasses(fetchedClasses);
        setLoading(false);
    }

    loadClasses();
  }, []);

  const isAdmin = user?.user_status === 'admin';

  const renderContent = () => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="flex flex-col overflow-hidden">
                   <CardHeader className="p-0">
                      <Skeleton className="h-48 w-full" />
                    </CardHeader>
                    <CardContent className="p-6 flex-grow">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2 mt-1" />
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                        <Skeleton className="h-10 w-28" />
                    </CardFooter>
                </Card>
              ))}
            </div>
          )
    }

    if (classes.length === 0) {
        return <p className="col-span-full text-center text-muted-foreground">No classes found.</p>
    }

    if (isMobile) {
        return (
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent>
                    {classes.map((cls) => (
                        <CarouselItem key={cls.id} className="basis-full sm:basis-1/2">
                           <div className="p-1 h-full">
                             <ClassCard cls={cls} />
                           </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>
        )
    }

    return (
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {classes.map((cls) => (
                <ClassCard key={cls.id} cls={cls} />
            ))}
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">Classes</h1>
            <p className="text-muted-foreground">Browse and manage class schedules and lessons.</p>
        </div>
        {isAdmin && (
            <Button asChild>
                <Link href="/classes/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Class
                </Link>
            </Button>
        )}
      </header>
      
      {renderContent()}
    </div>
  );
}
