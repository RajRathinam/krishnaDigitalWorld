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
                    <div className="flex shrink-0 items-center justify-start gap-2">
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