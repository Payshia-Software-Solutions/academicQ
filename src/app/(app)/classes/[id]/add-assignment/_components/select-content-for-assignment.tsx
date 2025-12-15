
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { FileVideo, File, BookOpen, PlusCircle } from 'lucide-react';
import { Preloader } from '@/components/ui/preloader';
import Link from 'next/link';

interface Bucket {
    id: string;
    name: string;
    contents: Content[];
}

interface Content {
    id: string;
    content_title: string;
    content_type: string;
}

interface SelectContentForAssignmentProps {
    courseId: string;
}

const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
        case 'video':
        case 'youtube_video':
            return <FileVideo className="h-5 w-5 text-accent" />;
        default:
            return <File className="h-5 w-5 text-accent" />;
    }
};

export function SelectContentForAssignment({ courseId }: SelectContentForAssignmentProps) {
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!courseId) return;

        async function fetchBucketsWithContent() {
            setIsLoading(true);
            try {
                const response = await api.get(`/course_buckets/course/${courseId}`);
                if (response.data.status === 'success') {
                    setBuckets(response.data.data || []);
                } else {
                    setBuckets([]);
                }
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch course content.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchBucketsWithContent();
    }, [courseId, toast]);

    if (isLoading) {
        return <Preloader />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Select Content</CardTitle>
                <CardDescription>Choose a content item to create an assignment for it.</CardDescription>
            </CardHeader>
            <CardContent>
                {buckets.length > 0 ? (
                    <Accordion type="multiple" className="w-full">
                        {buckets.map(bucket => (
                            <AccordionItem value={bucket.id} key={bucket.id}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5"/>
                                        <span className="font-semibold text-lg">{bucket.name}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {bucket.contents && bucket.contents.length > 0 ? (
                                        <ul className="space-y-2 pl-4">
                                            {bucket.contents.map(content => (
                                                <li key={content.id}>
                                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                                                        <div className="flex items-center gap-3">
                                                            {getIconForType(content.content_type)}
                                                            <p>{content.content_title}</p>
                                                        </div>
                                                        <Button asChild size="sm">
                                                            <Link href={`/classes/${courseId}/buckets/${bucket.id}/content/${content.id}/add-assignment`}>
                                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                                Add Assignment
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">No content in this bucket.</p>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <p className="text-center text-muted-foreground py-10">
                        No content buckets found for this course. You must create content before adding an assignment.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
