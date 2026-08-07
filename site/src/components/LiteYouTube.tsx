'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface LiteYouTubeProps {
    videoUrl: string;
    title?: string;
}

export default function LiteYouTube({ videoUrl, title = "Vídeo" }: LiteYouTubeProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    
    // Extrai o ID do vídeo do YouTube de vários formatos de URL possíveis
    let videoId = '';
    if (videoUrl.includes('youtube.com/watch?v=')) {
        videoId = videoUrl.split('v=')[1].split('&')[0];
    } else if (videoUrl.includes('youtube.com/embed/')) {
        videoId = videoUrl.split('embed/')[1].split('?')[0];
    } else if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
    }

    // Se não for um link válido do YouTube, faz o fallback pro iframe nativo invisível
    if (!videoId) {
        return (
            <iframe
                width="100%"
                height="100%"
                src={videoUrl.replace('watch?v=', 'embed/').split('&')[0]}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
            ></iframe>
        );
    }

    const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    if (isLoaded) {
        return (
            <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        );
    }

    return (
        <div 
            className="w-full h-full relative cursor-pointer group flex items-center justify-center bg-gray-900"
            onClick={() => setIsLoaded(true)}
        >
            <Image 
                src={thumbnailUrl} 
                alt={title} 
                fill 
                className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" 
                sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
            <div className="relative z-10 w-16 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-brand-red transition-all duration-300">
                <Play fill="white" stroke="none" size={24} />
            </div>
        </div>
    );
}
