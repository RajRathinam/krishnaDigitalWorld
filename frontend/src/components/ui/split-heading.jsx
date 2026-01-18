import React from "react";
import { cn } from "@/lib/utils";
export function SplitHeading({ text, className, as: Component = "h2" }) {
    const words = text.trim().split(" ");
    if (words.length === 1) {
        return (<Component className={cn("font-heading", className)}>
        <span className="text-foreground">{words[0]}</span>
      </Component>);
    }
    const firstWords = words.slice(0, -1).join(" ");
    const lastWord = words[words.length - 1];
    return (<Component className={cn("font-heading", className)}>
      <span className="text-foreground">{firstWords} </span>
      <span className="text-accent">{lastWord}</span>
    </Component>);
}
