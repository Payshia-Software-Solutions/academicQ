
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Plyr as PlyrInstance } from 'plyr';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { ArrowLeft, FileText, Image as ImageIcon, Video, Download, Plus, Calendar, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { format } from 'date-fns';

const Plyr = dynamic(() => import('plyr-react'), { ssr: false });

interface ContentDetails {
    id: string;
    content_type: string;
    content_title: string;
    content: string;
}

interface CurrentUser {
  user_status: 'admin' | 'student';
  [key: string]: any;
}


export default function ContentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { id: courseId, bucketId, contentId } = params;

    const [content, setContent] = useState<ContentDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<CurrentUser | null>(null);

    const [isClient, setIsClient] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const playerRef = useRef<PlyrInstance | null>(null);

    useEffect(() => {
        setIsClient(true);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);


    useEffect(() => {
        if (!contentId) return;

        const fetchContentDetails = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(`/course-bucket-contents/${contentId}`);
                if (response.data.status === 'success') {
                    setContent(response.data.data);
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Failed to fetch content details.',
                    });
                    setContent(null);
                }
            } catch (error: any) {
                 toast({
                    variant: 'destructive',
                    title: 'API Error',
                    description: error.message || 'Could not fetch content details.',
                });
                setContent(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchContentDetails();

    }, [contentId, toast]);

    const getFullFileUrl = (filePath: string) => {
        if (!filePath) return '#';
        const baseUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL;
        // Check if filePath is already a full URL
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }
        return `${baseUrl}${filePath}`;
    };
    
    function getYouTubeId(url: string): string | null {
        if (!url) return null;
        let videoId = null;
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        if (match) {
            videoId = match[1];
        }
        return videoId;
    }

    const handlePlay = () => {
        setShowVideo(true);
    };

    useEffect(() => {
        if (showVideo && playerRef.current) {
            playerRef.current.play();
        }
    }, [showVideo]);
    
    const plyrOptions = {
        youtube: {
          noCookie: true,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          controls: 0,
        },
    };

    const renderContent = () => {
        if (!content) return null;
        
        const fileUrl = getFullFileUrl(content.content);
        const youtubeVideoId = getYouTubeId(content.content);

        switch (content.content_type.toLowerCase()) {
            case 'video':
                return (
                    <div className="aspect-video w-full">
                        <iframe
                            src={fileUrl}
                            title={content.content_title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full rounded-lg"
                        ></iframe>
                    </div>
                );
             case 'youtube_video':
                if (!youtubeVideoId) {
                    return <p className="text-red-500">Invalid YouTube URL</p>;
                }
                return (
                     <div className="w-full aspect-video bg-background rounded-lg flex items-center justify-center border overflow-hidden relative">
                        {isClient ? (
                            <>
                            {!showVideo && youtubeVideoId ? (
                                <div className="text-center">
                                <Button variant="ghost" size="lg" onClick={handlePlay}>
                                    <PlayCircle className="h-16 w-16 text-primary" />
                                </Button>
                                <p className="text-muted-foreground mt-2">Click to play video</p>
                                </div>
                            ) : (
                                <div onContextMenu={(e) => e.preventDefault()} className="w-full h-full">
                                    <Plyr 
                                        ref={(player) => {
                                            if (player?.plyr) {
                                                playerRef.current = player.plyr;
                                            }
                                        }}
                                        source={{
                                            type: 'video',
                                            sources: [
                                            {
                                                src: youtubeVideoId,
                                                provider: 'youtube',
                                            },
                                            ],
                                        }}
                                        options={plyrOptions}
                                    />
                                </div>
                            )}
                            </>
                        ) : (
                            <Skeleton className="w-full h-full" />
                        )}
                        </div>
                );
            case 'image':
                return (
                    <div className="relative w-full h-96">
                        <Image
                            src={fileUrl}
                            alt={content.content_title}
                            fill
                            style={{ objectFit: 'contain' }}
                            className="rounded-lg"
                        />
                    </div>
                );
            case 'pdf':
                return (
                     <div className="h-[70vh]">
                         <iframe src={fileUrl} className="w-full h-full border rounded-lg" title={content.content_title}>
                             <p>Your browser does not support PDFs. <a href={fileUrl}>Download the PDF</a>.</p>
                         </iframe>
                    </div>
                );
            case 'link':
                 return (
                    <div className="p-6 bg-muted rounded-lg text-center">
                        <p className="mb-4">This is an external link. Click below to open it in a new tab.</p>
                        <Button asChild>
                            <a href={content.content} target="_blank" rel="noopener noreferrer">
                                Open Link
                            </a>
                        </Button>
                    </div>
                )
            case 'text':
            default:
                return (
                    <div className="prose dark:prose-invert max-w-none p-6 bg-muted rounded-lg">
                        <p>{content.content}</p>
                    </div>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                 <Skeleton className="h-10 w-48" />
                 <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    if (!content) {
        return (
            <div className="text-center">
                <p className="text-muted-foreground mb-4">Content not found.</p>
                 <Button onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }
    
    const isAdmin = user?.user_status === 'admin';

    return (
        <div className="space-y-6">
            <header>
                 <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Bucket
                </Button>
                <h1 className="text-2xl sm:text-3xl font-headline font-bold text-foreground">{content.content_title}</h1>
                <Badge variant="outline" className="capitalize mt-2">{content.content_type.replace(/_/g, ' ')}</Badge>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Content</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>

             {isAdmin && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Manage Assignments</CardTitle>
                             <Button asChild>
                                <Link href={`/classes/${courseId}/buckets/${bucketId}/content/${contentId}/add-assignment`}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Assignment
                                </Link>
                            </Button>
                        </div>
                        <CardDescription>
                            Create and manage assignments for this content.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-center">No assignments yet.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )

}
