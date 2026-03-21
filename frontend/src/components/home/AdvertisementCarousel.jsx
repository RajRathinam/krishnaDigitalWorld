import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, Volume2, VolumeX, ExternalLink,
  ChevronLeft, ChevronRight, X, Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { getVideoUrl, getImageUrl } from '@/lib/utils';
import { useInView } from 'react-intersection-observer';

/**
 * AdvertisementCarousel
 * 
 * A position-aware advertisement component that renders differently based on
 * the `position` prop:
 *  - "homepage_top"    → Slim dismissable banner across full width
 *  - "homepage_middle" → Wide cinematic carousel (default)
 *  - "homepage_bottom" → Similar to middle, slightly compact
 *  - "sidebar"         → Fixed floating card on right edge
 *  - "popup"           → Dialog modal shown once per session
 * 
 * @prop {string} position - One of the five ad positions above
 */
export const AdvertisementCarousel = ({ position = 'homepage_middle' }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);  // for homepage_top
  const [popupOpen, setPopupOpen] = useState(false);   // for popup
  const [sidebarVisible, setSidebarVisible] = useState(true); // for sidebar
  const videoRefs = useRef({});

  const { ref: sectionRef, inView } = useInView({
    threshold: 0.4,
    triggerOnce: false,
  });

  // ─── Fetch ads for this position ───────────────────────────────────────────
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/advertisements/active?position=${position}&limit=5`
        );
        const data = response.data?.data || response.data || [];
        const adsData = Array.isArray(data) ? data : [];
        setAds(adsData);

        // Popup: show after 2 s, once per session
        if (position === 'popup' && adsData.length > 0) {
          const key = `ad_popup_shown_${position}`;
          if (!sessionStorage.getItem(key)) {
            setTimeout(() => {
              setPopupOpen(true);
              sessionStorage.setItem(key, 'true');
            }, 2000);
          }
        }
      } catch (err) {
        console.error(`[AdvertisementCarousel] Failed to fetch ${position}:`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, [position]);

  // ─── Video progress + auto-advance on end ──────────────────────────────────
  useEffect(() => {
    const video = videoRefs.current[currentIndex];
    if (!video) return;

    const onTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    const onEnded = () => {
      if (ads.length > 1) {
        setCurrentIndex((p) => (p + 1) % ads.length);
        setProgress(0);
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
    };
  }, [currentIndex, ads.length]);

  // ─── Mute when scrolled out of view ────────────────────────────────────────
  useEffect(() => {
    const video = videoRefs.current[currentIndex];
    if (!video) return;
    if (!inView) {
      video.muted = true;
      setIsMuted(true);
    }
  }, [inView, currentIndex]);

  // ─── Track view impression ─────────────────────────────────────────────────
  useEffect(() => {
    if (ads.length > 0 && ads[currentIndex] && inView) {
      api
        .patch(`/advertisements/${ads[currentIndex].id}/views`)
        .catch(() => {});
    }
  }, [currentIndex, ads, inView]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const goNext = () => {
    setCurrentIndex((p) => (p + 1) % ads.length);
    setProgress(0);
  };
  const goPrev = () => {
    setCurrentIndex((p) => (p - 1 + ads.length) % ads.length);
    setProgress(0);
  };
  const goTo = (i) => {
    setCurrentIndex(i);
    setProgress(0);
  };

  const handleAdClick = (ad) => {
    if (ad?.link) {
      window.open(ad.link, '_blank', 'noopener');
      api.patch(`/advertisements/${ad.id}/clicks`).catch(() => {});
    }
  };

  const togglePlay = () => {
    const v = videoRefs.current[currentIndex];
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRefs.current[currentIndex];
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  // ─── Render video/iframe/thumbnail for any ad ──────────────────────────────
  const MediaContent = ({ ad, refKey, className = 'w-full h-full object-cover', onClick }) => {
    if (!ad) return null;

    if (ad.type === 'video' && ad.videoUrl) {
      return (
        <video
          ref={(el) => (videoRefs.current[refKey] = el)}
          src={getVideoUrl(ad.videoUrl)}
          poster={ad.thumbnailUrl ? getImageUrl(ad.thumbnailUrl) : undefined}
          autoPlay
          muted={isMuted}
          playsInline
          loop={false}
          className={className}
          onClick={onClick}
          style={{ cursor: ad.link ? 'pointer' : 'default' }}
        />
      );
    }
    if (ad.type === 'youtube' && ad.externalVideoId) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${ad.externalVideoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&rel=0&modestbranding=1`}
          title={ad.title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    if (ad.type === 'vimeo' && ad.externalVideoId) {
      return (
        <iframe
          src={`https://player.vimeo.com/video/${ad.externalVideoId}?autoplay=1&muted=${isMuted ? 1 : 0}&loop=0&title=0&byline=0&portrait=0`}
          title={ad.title}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }
    // Thumbnail fallback
    if (ad.thumbnailUrl) {
      return (
        <img
          src={getImageUrl(ad.thumbnailUrl)}
          alt={ad.title}
          className={className}
          onClick={onClick}
          style={{ cursor: ad.link ? 'pointer' : 'default' }}
        />
      );
    }
    return (
      <div className={`${className} bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center`}>
        <Megaphone className="h-12 w-12 text-white/30" />
      </div>
    );
  };

  // ─── Reusable sub-pieces ───────────────────────────────────────────────────
  const ProgressBar = () => (
    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
      <div
        className="h-full bg-primary transition-all duration-300 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );

  const DotIndicators = ({ dark = false }) =>
    ads.length > 1 ? (
      <div className="flex items-center gap-1.5">
        {ads.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === currentIndex
                ? 'w-5 h-2 bg-primary'
                : dark
                ? 'w-2 h-2 bg-gray-400 hover:bg-gray-600'
                : 'w-2 h-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    ) : null;

  const VideoControls = ({ size = 'md', isVideo }) => {
    const sz = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9 md:h-10 md:w-10';
    const icon = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    return (
      <div className="flex items-center gap-1.5">
        {isVideo && (
          <button
            onClick={togglePlay}
            className={`${sz} rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center transition-colors`}
          >
            {isPlaying ? <Pause className={icon} /> : <Play className={icon} />}
          </button>
        )}
        {isVideo && (
          <button
            onClick={inView ? toggleMute : undefined}
            className={`${sz} rounded-full text-white flex items-center justify-center transition-colors ${
              inView
                ? 'bg-black/55 hover:bg-black/80'
                : 'bg-black/30 cursor-not-allowed opacity-60'
            }`}
            title={!inView ? 'Scroll down to unmute' : isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className={icon} /> : <Volume2 className={icon} />}
          </button>
        )}
        {ads[currentIndex]?.link && (
          <button
            onClick={() => handleAdClick(ads[currentIndex])}
            className={`${sz} rounded-full bg-primary/80 hover:bg-primary text-white flex items-center justify-center transition-colors`}
          >
            <ExternalLink className={icon} />
          </button>
        )}
      </div>
    );
  };

  // ─── Early returns ──────────────────────────────────────────────────────────
  if (ads.length === 0 && !loading) return null;

  const currentAd = ads[currentIndex];
  const isVideoType = currentAd?.type === 'video';

  // ══════════════════════════════════════════════════════════════════════════
  // POSITION: homepage_top — slim dismissable banner
  // ══════════════════════════════════════════════════════════════════════════
  if (position === 'homepage_top') {
    if (dismissed) return null;
    if (loading) return <Skeleton className="w-full h-[72px]" />;
    if (!currentAd) return null;

    return (
      <div className="relative w-full overflow-hidden bg-gray-950 border-b border-white/5">
        {/* Background blurred video */}
        <div className="absolute inset-0 overflow-hidden">
          <MediaContent
            ad={currentAd}
            refKey={`top-${currentIndex}`}
            className="w-full h-full object-cover scale-105 blur-sm opacity-40"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/70" />

        {/* Content row */}
        <div className="relative flex items-center gap-3 px-4 md:px-8 py-3 min-h-[68px]">
          {/* Thumbnail */}
          {currentAd.thumbnailUrl && (
            <div className="hidden sm:block shrink-0 w-10 h-10 rounded-md overflow-hidden border border-white/10">
              <img
                src={getImageUrl(currentAd.thumbnailUrl)}
                alt={currentAd.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Ad label + title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge className="bg-primary/90 text-[10px] py-0 px-1.5 h-4 shrink-0">AD</Badge>
              <p className="text-white font-semibold text-sm truncate">{currentAd.title}</p>
            </div>
            {currentAd.description && (
              <p className="text-white/55 text-xs truncate hidden md:block">
                {currentAd.description}
              </p>
            )}
          </div>

          {/* Controls + CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <DotIndicators />
            {ads.length > 1 && (
              <div className="flex gap-1">
                <button onClick={goPrev} className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button onClick={goNext} className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
            <VideoControls size="sm" isVideo={isVideoType} />
            {currentAd.link && (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white text-xs h-7 px-3 hidden md:flex gap-1"
                onClick={() => handleAdClick(currentAd)}
              >
                Visit <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 ml-1 h-6 w-6 rounded-full bg-white/10 hover:bg-white/25 text-white/70 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        <ProgressBar />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // POSITION: sidebar — fixed floating compact card
  // ══════════════════════════════════════════════════════════════════════════
  if (position === 'sidebar') {
    if (!sidebarVisible || loading || !currentAd) return null;

    return (
      <div
        className="fixed right-4 bottom-20 z-50 w-[188px] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{ background: 'linear-gradient(to bottom, #111, #1a1a1a)' }}
      >
        {/* Dismiss */}
        <button
          onClick={() => setSidebarVisible(false)}
          className="absolute top-2 right-2 z-20 h-6 w-6 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="h-3 w-3" />
        </button>

        {/* Video area */}
        <div className="relative" style={{ aspectRatio: '9/14' }}>
          <MediaContent
            ad={currentAd}
            refKey={`sidebar-${currentIndex}`}
            className="w-full h-full object-cover"
            onClick={() => handleAdClick(currentAd)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent pointer-events-none" />

          {/* Ad info */}
          <div className="absolute bottom-10 left-0 right-0 px-3">
            <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">
              {currentAd.title}
            </p>
          </div>

          {/* Controls */}
          <div className="absolute bottom-2.5 left-3">
            <VideoControls size="sm" isVideo={isVideoType} />
          </div>

          <ProgressBar />
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/40">
          <DotIndicators />
          {ads.length > 1 && (
            <div className="flex gap-1 ml-auto">
              <button onClick={goPrev} className="text-white/50 hover:text-white transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={goNext} className="text-white/50 hover:text-white transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // POSITION: popup — session modal
  // ══════════════════════════════════════════════════════════════════════════
  if (position === 'popup') {
    if (!currentAd) return null;

    return (
      <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
        <DialogContent className="sm:max-w-[580px] p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
          <div className="rounded-2xl overflow-hidden bg-gray-950">
            {/* Media */}
            <div className="relative aspect-video">
              <MediaContent
                ad={currentAd}
                refKey={`popup-${currentIndex}`}
                className="w-full h-full object-cover"
                onClick={() => handleAdClick(currentAd)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 pointer-events-none" />

              {/* Close */}
              <button
                onClick={() => setPopupOpen(false)}
                className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Ad info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <Badge className="bg-primary/90 mb-2">Advertisement</Badge>
                <h3 className="text-white font-bold text-xl leading-snug">{currentAd.title}</h3>
                {currentAd.description && (
                  <p className="text-white/70 text-sm mt-1.5 line-clamp-2">{currentAd.description}</p>
                )}
                <div className="flex items-center gap-2 mt-4">
                  <VideoControls isVideo={isVideoType} />
                  {currentAd.link && (
                    <Button
                      size="sm"
                      className="ml-auto bg-primary hover:bg-primary/90 gap-1.5"
                      onClick={() => handleAdClick(currentAd)}
                    >
                      Learn More <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <ProgressBar />
            </div>

            {/* Multi-ad footer */}
            {ads.length > 1 && (
              <div className="flex items-center justify-between px-5 py-3 bg-gray-900">
                <DotIndicators />
                <div className="flex gap-1.5">
                  <button
                    onClick={goPrev}
                    className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={goNext}
                    className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // POSITION: homepage_middle / homepage_bottom — full cinematic carousel
  // ══════════════════════════════════════════════════════════════════════════
  const isMiddle = position === 'homepage_middle';

  if (loading) {
    return (
      <section className="py-6 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        <Skeleton className={`w-full rounded-2xl ${isMiddle ? 'h-[240px] md:h-[360px]' : 'h-[200px] md:h-[280px]'}`} />
      </section>
    );
  }

  if (!currentAd) return null;

  return (
    <section
      ref={sectionRef}
      className={`${isMiddle ? 'py-6' : 'py-4'} px-4 md:px-6 lg:px-8 max-w-7xl mx-auto`}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        {ads.length > 1 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentIndex + 1} / {ads.length}
          </span>
        )}
      </div>

      {/* Card */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-950 group">
<div
  className={`relative w-full ${
    isMiddle
      ? 'aspect-[16/10] md:aspect-[21/10] lg:aspect-[21/9]'
      : 'aspect-[16/11] md:aspect-[21/11] lg:aspect-[21/10]'
  }`}
>
          {/* Media layer */}
          <MediaContent
            ad={currentAd}
            refKey={currentIndex}
            className="w-full h-full object-cover transition-opacity duration-500"
            onClick={() => handleAdClick(currentAd)}
          />

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent pointer-events-none" />

          {/* Left content */}
          <div className="absolute bottom-0 left-0 px-5 pb-5 md:px-8 md:pb-7 max-w-lg">
            <h3 className="text-white font-bold text-base md:text-2xl drop-shadow-lg leading-snug">
              {currentAd.title}
            </h3>
            {currentAd.description && (
              <p className="text-white/65 text-xs md:text-sm mt-1.5 line-clamp-2 hidden md:block">
                {currentAd.description}
              </p>
            )}
            {currentAd.link && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 border-white/50 text-white hover:bg-white hover:text-black text-xs h-8 gap-1.5 hidden md:inline-flex"
                onClick={() => handleAdClick(currentAd)}
              >
                Visit Now <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Right controls */}
          <div className="absolute bottom-4 right-4 md:bottom-5 md:right-5">
            <VideoControls isVideo={isVideoType} />
          </div>

          {/* Dot indicators top-center */}
          {ads.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <DotIndicators />
            </div>
          )}

          {/* Prev/Next arrows — visible on hover */}
          {ads.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <ProgressBar />
        </div>
      </div>
    </section>
  );
};

export default AdvertisementCarousel;