import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
export const HoverEffect = ({ items, className, }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    return (<div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6", className)}>
      {items.map((item, idx) => (<Link key={item.link} to={item.link} className="relative group block p-2 h-full w-full" onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
          <AnimatePresence>
            {hoveredIndex === idx && (<motion.span className="absolute inset-0 h-full w-full bg-primary/10 dark:bg-primary/20 block rounded-2xl sm:rounded-3xl" layoutId="hoverBackground" initial={{ opacity: 0 }} animate={{
                    opacity: 1,
                    transition: { duration: 0.15 },
                }} exit={{
                    opacity: 0,
                    transition: { duration: 0.15, delay: 0.2 },
                }}/>)}
          </AnimatePresence>
          <Card>
            <div className="flex flex-col items-center text-center">
              {item.icon && (<div className={cn("w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300", item.bgColor || "bg-primary")}>
                  {item.icon}
                </div>)}
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </div>
          </Card>
        </Link>))}
    </div>);
};
export const Card = ({ className, children, }) => {
    return (<div className={cn("rounded-xl sm:rounded-2xl h-full w-full p-4 sm:p-5 lg:p-6 overflow-hidden bg-card border border-border/50 group-hover:border-primary/30 relative z-20 transition-all duration-300", className)}>
      <div className="relative z-50">
        <div className="p-0">{children}</div>
      </div>
    </div>);
};
export const CardTitle = ({ className, children, }) => {
    return (<h4 className={cn("text-xs sm:text-sm lg:text-base font-semibold text-foreground tracking-wide", className)}>
      {children}
    </h4>);
};
export const CardDescription = ({ className, children, }) => {
    return (<p className={cn("mt-1 text-[10px] sm:text-xs lg:text-sm text-primary font-medium tracking-wide leading-relaxed", className)}>
      {children}
    </p>);
};
