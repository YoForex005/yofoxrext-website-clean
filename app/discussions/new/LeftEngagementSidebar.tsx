"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  Keyboard, 
  Shield, 
  Star, 
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export default function LeftEngagementSidebar() {
  return (
    <aside className="w-[240px] space-y-4" data-testid="sidebar-left">
      {/* Posting Tips Card */}
      <Card data-testid="card-posting-tips">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Posting Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2" data-testid="tip-title">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground dark:text-foreground">Use a clear title</p>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                Be specific about your question or topic
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2" data-testid="tip-details">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground dark:text-foreground">Add details</p>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                Include context, examples, and what you've tried
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2" data-testid="tip-category">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground dark:text-foreground">Pick the right category</p>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                Helps others find and answer your thread
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2" data-testid="tip-tags">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground dark:text-foreground">Use relevant hashtags</p>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                Makes your content discoverable
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formatting Shortcuts Card */}
      <Card data-testid="card-formatting-shortcuts">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-blue-500" />
            Formatting Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between items-center" data-testid="shortcut-bold">
            <span className="text-muted-foreground dark:text-muted-foreground">Bold</span>
            <Badge variant="secondary" className="font-mono text-xs">Ctrl+B</Badge>
          </div>
          
          <div className="flex justify-between items-center" data-testid="shortcut-italic">
            <span className="text-muted-foreground dark:text-muted-foreground">Italic</span>
            <Badge variant="secondary" className="font-mono text-xs">Ctrl+I</Badge>
          </div>
          
          <div className="flex justify-between items-center" data-testid="shortcut-underline">
            <span className="text-muted-foreground dark:text-muted-foreground">Underline</span>
            <Badge variant="secondary" className="font-mono text-xs">Ctrl+U</Badge>
          </div>
          
          <div className="flex justify-between items-center" data-testid="shortcut-link">
            <span className="text-muted-foreground dark:text-muted-foreground">Insert Link</span>
            <Badge variant="secondary" className="font-mono text-xs">Ctrl+K</Badge>
          </div>
          
          <div className="flex justify-between items-center" data-testid="shortcut-heading">
            <span className="text-muted-foreground dark:text-muted-foreground">Heading</span>
            <Badge variant="secondary" className="font-mono text-xs">Ctrl+H</Badge>
          </div>
          
          <div className="flex justify-between items-center" data-testid="shortcut-list">
            <span className="text-muted-foreground dark:text-muted-foreground">Bullet List</span>
            <Badge variant="secondary" className="font-mono text-xs">Ctrl+L</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Community Guidelines Alert */}
      <Alert className="border-orange-200 dark:border-orange-900" data-testid="alert-guidelines">
        <Shield className="h-4 w-4 text-orange-500" />
        <AlertDescription className="text-xs space-y-2">
          <p className="font-medium text-foreground dark:text-foreground">Community Guidelines</p>
          <ul className="space-y-1 text-muted-foreground dark:text-muted-foreground">
            <li className="flex items-start gap-1" data-testid="guideline-respectful">
              <Star className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Be respectful and constructive</span>
            </li>
            <li className="flex items-start gap-1" data-testid="guideline-spam">
              <Star className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>No spam or self-promotion</span>
            </li>
            <li className="flex items-start gap-1" data-testid="guideline-original">
              <Star className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Post original content only</span>
            </li>
          </ul>
        </AlertDescription>
      </Alert>
    </aside>
  );
}
