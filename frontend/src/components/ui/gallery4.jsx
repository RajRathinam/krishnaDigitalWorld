"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

const Gallery4 = ({ 
  title = "Case Studies", 
  description = "Discover how leading companies and developers are leveraging modern web technologies to build exceptional digital experiences.", 
  items = [], 
}) => {
    const [carouselApi, setCarouselApi] = useState();
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (!carouselApi) {
            return;
        }
        const updateSelection = () => {
            setCanScrollPrev(carouselApi.canScrollPrev());
            setCanScrollNext(carouselApi.canScrollNext());
            setCurrentSlide(carouselApi.selectedScrollSnap());
        };
        updateSelection();
        carouselApi.on("select", updateSelection);
        carouselApi.on("reInit", updateSelection);
        return () => {
            carouselApi.off("select", updateSelection);
            carouselApi.off("reInit", updateSelection);
        };
    }, [carouselApi]);

    const handlePrev = () => {
        if (carouselApi) {
            carouselApi.scrollPrev();
        }
    };

    const handleNext = () => {
        if (carouselApi) {
            carouselApi.scrollNext();
        }
    };

    return (
        <section className="lg:py-5 w-full">
            <div className="w-full">
                <div className="mb-4 flex flex-col justify-between md:mb-8 md:flex-row md:items-end">
                    <div className="hidden md:flex shrink-0 items-center justify-start gap-2">
                        <Button 
                            type="button" 
                            size="icon" 
                            variant="outline" 
                            onClick={handlePrev} 
                            disabled={!canScrollPrev} 
                            className="disabled:pointer-events-auto disabled:opacity-50" 
                            aria-label="Previous slide"
                        >
                            <ArrowLeft className="size-5"/>
                        </Button>
                        <Button 
                            type="button" 
                            size="icon" 
                            variant="outline" 
                            onClick={handleNext} 
                            disabled={!canScrollNext} 
                            className="disabled:pointer-events-auto disabled:opacity-50" 
                            aria-label="Next slide"
                        >
                            <ArrowRight className="size-5"/>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="w-full">
                <Carousel 
                    setApi={setCarouselApi} 
                    opts={{
                        loop: false,
                        align: "start",
                        breakpoints: {
                            "(max-width: 768px)": {
                                dragFree: true,
                            },
                        },
                    }}
                >
                    <CarouselContent className="mr-4 md:mr-8">
                        {items.map((item) => (
                     <CarouselItem key={item.id} className="pl-[20px] md:max-w-[320px]">
    <Link to={item.href} className="group block">
        <div className="relative overflow-hidden rounded-xl bg-card border border-border">
            {/* Image Container - Shows image fully */}
            <div className="relative aspect-square overflow-hidden flex items-center justify-center">
                <img 
                    src={item.image} 
                    alt="Best seller product" 
                    loading="lazy" 
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder.svg';
                    }}
                />
                
                {/* Ratings Tag - Shows if item.ratings exists */}
                {item.rating && (
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-yellow-400">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                        <span>{item.rating}</span>
                    </div>
                )}
            </div>
        </div>
    </Link>
</CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
                
                <div className="container mt-8 flex justify-center gap-2 md:hidden">
                    {items.map((_, index) => (
                        <button 
                            key={index} 
                            type="button" 
                            className={`h-2 w-2 rounded-full transition-colors ${currentSlide === index ? "bg-primary" : "bg-primary/20"}`} 
                            onClick={() => carouselApi?.scrollTo(index)} 
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export { Gallery4 };