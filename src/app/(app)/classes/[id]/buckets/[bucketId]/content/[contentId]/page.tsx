

'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { ArrowLeft, FileText, Image as ImageIcon, Video, Download, Plus, Calendar, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { format } from 'date-fns';
import { Preloader } from '@/components/ui/preloader';

interface ContentDetails {
    id: string;
    content_type: string;
    content_title: string;
    content: string;
    assignments: any[];
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

    const renderContent = () => {
        if (!content) return null;
        
        const fileUrl = getFullFileUrl(content.content);
        
        const youtubeId = getYouTubeId(content.content);

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
                const embedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=1&modestbranding=1&rel=0` : '';
                return (
                     <div className="w-full aspect-video bg-background rounded-lg flex items-center justify-center border overflow-hidden relative">
                        {isClient ? (
                            <>
                            {!showVideo ? (
                                <div className="text-center">
                                <Button variant="ghost" size="lg" onClick={handlePlay}>
                                    <PlayCircle className="h-16 w-16 text-primary" />
                                </Button>
                                <p className="text-muted-foreground mt-2">Click to play video</p>
                                </div>
                            ) : (
                                <div onContextMenu={(e) => e.preventDefault()} className="w-full h-full">
                                    {youtubeId && (
                                        <iframe
                                            src={embedUrl}
                                            title={content.content_title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full"
                                        ></iframe>
                                    )}
                                </div>
                            )}
                            </>
                        ) : (
                            <Preloader icon="book" />
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
        return <Preloader icon="book" />;
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

        </div>
    )

}
