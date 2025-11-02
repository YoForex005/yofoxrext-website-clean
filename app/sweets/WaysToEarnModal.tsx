"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Reply, 
  ShoppingBag, 
  Upload, 
  UserCheck,
  Zap,
  X
} from "lucide-react";

interface WaysToEarnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const XP_ACTIVITIES = [
  {
    id: "forum_post",
    name: "Create Forum Post",
    description: "Share your trading insights and start a discussion",
    xp: 10,
    icon: MessageSquare,
    color: "text-blue-500",
  },
  {
    id: "forum_reply",
    name: "Reply to Thread",
    description: "Help others by sharing your knowledge",
    xp: 5,
    icon: Reply,
    color: "text-green-500",
  },
  {
    id: "marketplace_sale",
    name: "Marketplace Sale",
    description: "Sell your trading tools and strategies",
    xp: 50,
    icon: ShoppingBag,
    color: "text-purple-500",
  },
  {
    id: "content_upload",
    name: "Upload Content",
    description: "Share EAs, indicators, or educational content",
    xp: 25,
    icon: Upload,
    color: "text-orange-500",
  },
  {
    id: "profile_complete",
    name: "Complete Profile",
    description: "Fill out your trading profile completely",
    xp: 20,
    icon: UserCheck,
    color: "text-indigo-500",
  },
];

export function WaysToEarnModal({ open, onOpenChange }: WaysToEarnModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground" data-testid="button-close-earn">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="text-earn-title">
            <Zap className="h-5 w-5 text-yellow-500" />
            Ways to Earn XP
          </DialogTitle>
          <DialogDescription>
            Engage with the community and earn XP to unlock new ranks and features
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {XP_ACTIVITIES.map((activity) => {
            const Icon = activity.icon;
            return (
              <Card key={activity.id} className="border-muted">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg bg-muted p-3 ${activity.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{activity.name}</h4>
                        <Badge variant="secondary" className="ml-2">
                          +{activity.xp} XP
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 mt-4">
          <p className="text-sm text-muted-foreground">
            <strong>Weekly Cap:</strong> You can earn up to 1,000 XP per week. 
            The cap resets every Sunday at midnight UTC.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
