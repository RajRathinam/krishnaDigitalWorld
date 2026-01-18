"use client";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, } from "@/components/ui/carousel";
import { SplitHeading } from "@/components/ui/split-heading";
const Gallery6 = ({ heading = "Gallery", demoUrl = "/products", items = [
    {
        id: "item-1",
        title: "Build Modern UIs",
        summary: "Create stunning user interfaces with our comprehensive design system.",
        url: "#",
        image: "/images/block/placeholder-dark-1.svg",
    },
    {
        id: "item-2",
        title: "Computer Vision Technology",
        summary: "Powerful image recognition and processing capabilities that allow AI systems to analyze, understand, and interpret visual information from the world.",
        url: "#",
        image: "/images/block/placeholder-dark-1.svg",
    },
    {
        id: "item-3",
        title: "Machine Learning Automation",
        summary: "Self-improving algorithms that learn from data patterns to automate complex tasks and make intelligent decisions with minimal human intervention.",
        url: "#",
        image: "/images/block/placeholder-dark-1.svg",
    },
    {
        id: "item-4",
        title: "Predictive Analytics",
        summary: "Advanced forecasting capabilities that analyze historical data to predict future trends and outcomes, helping businesses make data-driven decisions.",
        url: "#",
        image: "/images/block/placeholder-dark-1.svg",
    },
    {
        id: "item-5",
        title: "Neural Network Architecture",
        summary: "Sophisticated AI models inspired by human brain structure, capable of solving complex problems through deep learning and pattern recognition.",
        url: "#",
        image: "/images/block/placeholder-dark-1.svg",
    },
], }) => {
    const [carouselApi, setCarouselApi] = useState();
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    useEffect(() => {
        if (!carouselApi) {
            return;
        }
        const updateSelection = () => {
            setCanScrollPrev(carouselApi.canScrollPrev());
            setCanScrollNext(carouselApi.canScrollNext());
        };
        updateSelection();
        carouselApi.on("select", updateSelection);
        return () => {
            carouselApi.off("select", updateSelection);
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
    return (<section className="py-12 md:py-16">
      <div className="container">
        <div className="mb-8 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-end">
          <div className="flex flex-col gap-4">
            <SplitHeading text={heading} className="text-2xl md:text-3xl lg:text-4xl font-bold"/>
            <Link to={demoUrl} className="group flex items-center gap-1 text-accent font-medium hover:underline">
              View All
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
            </Link>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="icon" onClick={handlePrev} disabled={!canScrollPrev} className="disabled:pointer-events-auto disabled:opacity-50" aria-label="Previous slide">
              <ArrowLeft className="h-4 w-4"/>
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={handleNext} disabled={!canScrollNext} className="disabled:pointer-events-auto disabled:opacity-50" aria-label="Next slide">
              <ArrowRight className="h-4 w-4"/>
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full">
        <Carousel setApi={setCarouselApi} opts={{
            breakpoints: {
                "(max-width: 768px)": {
                    dragFree: true,
                },
            },
        }}>
          <CarouselContent className="ml-0 md:ml-[max(1rem,calc((100vw-80rem)/2+1rem))] 2xl:ml-[max(1rem,calc((100vw-80rem)/2+1rem))]">
            {items.map((item) => (<CarouselItem key={item.id} className="max-w-[320px] pl-4 lg:max-w-[400px]">
                <Link to={item.url} className="group block">
                  <div className="flex flex-col gap-4">
                    <div className="aspect-[3/2] overflow-hidden rounded-lg bg-secondary">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => {
                e.currentTarget.style.display = 'none';
            }}/>
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.summary}
                      </p>
                      <span className="flex items-center gap-1 text-sm font-medium text-accent">
                        Read more{" "}
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
                      </span>
                    </div>
                  </div>
                </Link>
              </CarouselItem>))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>);
};
export { Gallery6 };
