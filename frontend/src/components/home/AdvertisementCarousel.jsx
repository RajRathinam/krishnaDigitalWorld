import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { getVideoUrl, getImageUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const AdvertisementCarousel = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRefs = useRef({});
  const { toast } = useToast();

  // Fetch active advertisements
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        // Get active ads for homepage_middle position
        const response = await api.get('/advertisements/active?position=homepage_middle&limit=5');
        const data = response.data?.data || response.data || [];
        setAds(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch advertisements:', error);
        toast({
          title: 'Error',
          description: 'Failed to load advertisements',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  // Auto-rotate ads
  useEffect(() => {
    if (ads.length <= 1 || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 8000); // Change ad every 8 seconds

    return () => clearInterval(interval);
  }, [ads.length, isPlaying]);

  // Handle video progress tracking
  useEffect(() => {
    const video = videoRefs.current[currentIndex];
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, [currentIndex]);

  // Track view when ad becomes visible
  useEffect(() => {
    if (ads.length > 0 && ads[currentIndex]) {
      const trackView = async () => {
        try {
          await api.patch(`/advertisements/${ads[currentIndex].id}/views`);
        } catch (error) {
          console.error('Failed to track view:', error);
        }
      };
      trackView();
    }
  }, [currentIndex, ads]);

  const handleVideoClick = (ad) => {
    if (ad.link) {
      window.open(ad.link, '_blank');
      // Track click
      api.patch(`/advertisements/${ad.id}/clicks`).catch(console.error);
    }
  };

  const togglePlay = () => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  if (loading) {
    return (
      <section className="py-8 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        <Skeleton className="w-full h-[300px] md:h-[400px] rounded-xl" />
      </section>
    );
  }

  if (ads.length === 0) {
    return null; // Don't show anything if no ads
  }

  const currentAd = ads[currentIndex];

  return (
    <section className="md:px-6 py-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative md:rounded-xl overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 shadow-2xl">
        {/* Main Ad Container */}
        <div className="relative aspect-[21/12] md:aspect-[21/7] w-full">
          {/* Video Element */}
          {currentAd.type === 'video' && currentAd.videoUrl && (
            <video
              ref={(el) => (videoRefs.current[currentIndex] = el)}
              src={getVideoUrl(currentAd.videoUrl)}
              poster={currentAd.thumbnailUrl ? getImageUrl(currentAd.thumbnailUrl) : ''}
              autoPlay
              muted={isMuted}
              loop={currentAd.loop}
              playsInline
              className="w-full h-full object-cover"
              onClick={() => handleVideoClick(currentAd)}
            />
          )}

          {/* YouTube Embed */}
          {currentAd.type === 'youtube' && currentAd.externalVideoId && (
            <iframe
              src={`https://www.youtube.com/embed/${currentAd.externalVideoId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=${currentAd.loop ? 1 : 0}&controls=0&showinfo=0&rel=0&modestbranding=1`}
              title={currentAd.title}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}

          {/* Vimeo Embed */}
          {currentAd.type === 'vimeo' && currentAd.externalVideoId && (
            <iframe
              src={`https://player.vimeo.com/video/${currentAd.externalVideoId}?autoplay=1&muted=${isMuted ? 1 : 0}&loop=${currentAd.loop ? 1 : 0}&title=0&byline=0&portrait=0&badge=0`}
              title={currentAd.title}
              className="w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          )}

          {/* Overlay Gradient for Text Visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

          {/* Ad Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
            <Badge className="mb-2 bg-primary/80 hover:bg-primary">
              Advertisement
            </Badge>
           
          </div>

          {/* Video Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            

            {/* Mute/Unmute Button */}
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>

            {/* External Link Button (if ad has link) */}
            {currentAd.link && (
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/80 hover:bg-primary text-white"
                onClick={() => handleVideoClick(currentAd)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Navigation Arrows (if multiple ads) */}
          {ads.length > 1 && (
            <>
              <Button
                size="icon"
                variant="secondary"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 md:h-10 md:w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                onClick={goToPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 md:h-10 md:w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                onClick={goToNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Ad Indicators */}
          {ads.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {ads.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-6 bg-primary'
                      : 'w-2 bg-white/50 hover:bg-white/80'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdvertisementCarousel;