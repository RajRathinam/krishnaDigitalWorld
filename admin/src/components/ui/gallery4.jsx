"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, } from "@/components/ui/carousel";
import { SplitHeading } from "@/components/ui/split-heading";
const Gallery4 = ({ title = "Case Studies", description = "Discover how leading companies and developers are leveraging modern web technologies to build exceptional digital experiences.", items = [], }) => {
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
    return (<section className="py-16 lg:py-24 w-full">
      <div className="w-full px-4 md:px-8">
        <div className="mb-8 flex flex-col justify-between md:mb-14 md:flex-row md:items-end">
          <div>
            <SplitHeading text={title} className="mb-3 text-3xl font-bold md:mb-4 md:text-4xl lg:mb-6"/>
            <p className="text-muted-foreground md:text-lg lg:text-xl max-w-2xl">
              {description}
            </p>
          </div>
          <div className="mt-8 flex shrink-0 items-center justify-center gap-2">
            <Button type="button" size="icon" variant="outline" onClick={handlePrev} disabled={!canScrollPrev} className="disabled:pointer-events-auto disabled:opacity-50" aria-label="Previous slide">
              <ArrowLeft className="size-5"/>
            </Button>
            <Button type="button" size="icon" variant="outline" onClick={handleNext} disabled={!canScrollNext} className="disabled:pointer-events-auto disabled:opacity-50" aria-label="Next slide">
              <ArrowRight className="size-5"/>
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full">
        <Carousel setApi={setCarouselApi} opts={{
            loop: false,
            align: "start",
            breakpoints: {
                "(max-width: 768px)": {
                    dragFree: true,
                },
            },
        }}>
          <CarouselContent className="ml-4 mr-4 md:ml-8 md:mr-8">
            {items.map((item) => (<CarouselItem key={item.id} className="pl-[20px] md:max-w-[452px]">
                <Link to={item.href} className="group flex flex-col justify-between">
                  <div>
                    <div className="flex aspect-[3/2] text-clip rounded-xl">
                      <div className="flex-1">
                        <div className="relative size-full origin-bottom transition duration-300 group-hover:scale-105">
                          <img src={item.image} alt={item.title} loading="lazy" className="size-full object-cover object-center"/>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-2 line-clamp-3 break-words pt-4 text-lg font-medium md:mb-3 md:pt-4 md:text-xl lg:pt-4 lg:text-2xl">
                    {item.title}
                  </div>
                  <div className="mb-8 line-clamp-2 text-sm text-muted-foreground md:mb-12 md:text-base lg:mb-9">
                    {item.description}
                  </div>
                  <div className="flex items-center text-sm text-accent">
                    Read more{" "}
                    <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1"/>
                  </div>
                </Link>
              </CarouselItem>))}
          </CarouselContent>
        </Carousel>
        <div className="container mt-8 flex justify-center gap-2 md:hidden">
          {items.map((_, index) => (<button key={index} type="button" className={`h-2 w-2 rounded-full transition-colors ${currentSlide === index ? "bg-primary" : "bg-primary/20"}`} onClick={() => carouselApi?.scrollTo(index)} aria-label={`Go to slide ${index + 1}`}/>))}
        </div>
      </div>
    </section>);
};
export { Gallery4 };
