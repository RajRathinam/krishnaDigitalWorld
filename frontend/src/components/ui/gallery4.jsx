"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, } from "@/components/ui/carousel";
import { SplitHeading } from "@/components/ui/split-heading";
import { Eye, ShoppingBag, Heart } from "lucide-react";

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
                    <div>
                        <SplitHeading 
                            text={title} 
                            className="text-3xl font-bold md:text-4xl "
                        />
                    </div>
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
                            <CarouselItem key={item.id} className="pl-[20px] md:max-w-[380px]">
                                <Link to={item.href} className="group block">
                                    {/* Product Card Container */}
                                    <div className="relative overflow-hidden rounded-xl bg-card border border-border">
                                        {/* Image Container */}
                                        <div className="relative h-64 overflow-hidden">
                                            <img 
                                                src={item.image} 
                                                alt={item.title} 
                                                loading="lazy" 
                                                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/placeholder.svg';
                                                }}
                                            />
                                            
                                            {/* Hover Overlay - Initially hidden, shows on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                                                {/* Overlay Content */}
                                                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                                                    {/* Product Name */}
                                                    <h3 className="text-xl font-bold mb-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                                                        {item.title}
                                                    </h3>
                                                    
                                                    {/* Product Description */}
                                                    <p className="text-sm text-white/80 mb-4 line-clamp-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-150">
                                                        {item.description}
                                                    </p>
                                                    
                                                 
                                                    
                                                
                                                </div>
                                            </div>
                                          
                                            
                                            {/* Discount Badge (if exists) */}
                                            {item.discount && (
                                                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                                    {typeof item.discount === 'number' ? `${item.discount}% OFF` : item.discount}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Visible Only on Mobile or Without Hover (Optional) */}
                                        <div className="p-4 block md:hidden">
                                            <h3 className="font-medium text-foreground text-sm line-clamp-1 mb-1">
                                                {item.title}
                                            </h3>
                                            {item.price && (
                                                <div className="text-lg font-bold text-foreground">
                                                    {item.price}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Read More Link (Optional - can remove if not needed) */}
                                    <div className="flex items-center text-sm text-accent mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        View Product
                                        <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1"/>
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