"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FileText, ChevronRight } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Extract headings from the content
    const extractHeadings = () => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;
      
      const headingElements = tempDiv.querySelectorAll("h2, h3");
      const extractedHeadings: Heading[] = [];
      
      headingElements.forEach((heading, index) => {
        const id = `heading-${index}`;
        const text = heading.textContent || "";
        const level = parseInt(heading.tagName.substring(1));
        
        extractedHeadings.push({ id, text, level });
      });
      
      setHeadings(extractedHeadings);
    };

    if (content) {
      extractHeadings();
    }
  }, [content]);

  useEffect(() => {
    // Add IDs to actual headings in the DOM
    const contentElement = document.querySelector("[data-thread-content]");
    if (!contentElement) return;

    const headingElements = contentElement.querySelectorAll("h2, h3");
    headingElements.forEach((heading, index) => {
      heading.id = `heading-${index}`;
    });

    // Set up intersection observer for active heading
    const observerOptions = {
      rootMargin: "-20% 0% -70% 0%",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, observerOptions);

    headingElements.forEach((heading) => {
      observer.observe(heading);
    });

    return () => {
      headingElements.forEach((heading) => {
        observer.unobserve(heading);
      });
    };
  }, [content]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <Card className="sticky top-20 shadow-sm" data-testid="table-of-contents">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Table of Contents
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-[400px] px-4">
          <nav className="space-y-1">
            {headings.map((heading) => (
              <button
                key={heading.id}
                onClick={() => handleClick(heading.id)}
                className={cn(
                  "w-full text-left py-2 px-3 text-sm rounded-md transition-all duration-200 flex items-center gap-2 group",
                  "hover:bg-muted/50 dark:hover:bg-muted/20",
                  heading.level === 3 && "ml-4 text-xs",
                  activeId === heading.id
                    ? "bg-muted dark:bg-muted/30 text-primary font-medium border-l-2 border-primary"
                    : "text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
                )}
                data-testid={`toc-item-${heading.id}`}
              >
                <ChevronRight 
                  className={cn(
                    "h-3 w-3 transition-transform flex-shrink-0",
                    activeId === heading.id && "rotate-90"
                  )} 
                />
                <span className="line-clamp-2">{heading.text}</span>
              </button>
            ))}
          </nav>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}