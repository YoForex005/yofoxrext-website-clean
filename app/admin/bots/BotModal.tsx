"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateBot, useUpdateBot, useGenerateBotProfile } from "@/hooks/useBots";
import { Loader2, Sparkles } from "lucide-react";
import type { Bot } from "../../../shared/schema";

const botFormSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().max(255),
  bio: z.string().optional(),
  profilePictureUrl: z.string().url().optional().or(z.literal('')),
  purpose: z.string().max(100).optional(),
  squad: z.string().max(50).optional(),
  aggressionLevel: z.number().int().min(1).max(10),
  trustLevel: z.number().int().min(2).max(5),
  timezone: z.string().default('UTC'),
  favoritePairs: z.string().optional(),
});

type BotFormValues = z.infer<typeof botFormSchema>;

interface BotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bot?: Bot | null;
}

export function BotModal({ open, onOpenChange, bot }: BotModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const createBot = useCreateBot();
  const updateBot = useUpdateBot();
  const generateProfile = useGenerateBotProfile();

  const form = useForm<BotFormValues>({
    resolver: zodResolver(botFormSchema),
    defaultValues: {
      username: bot?.username || "",
      email: bot?.email || "",
      bio: bot?.bio || "",
      profilePictureUrl: bot?.profilePictureUrl || "",
      purpose: bot?.purpose || "",
      squad: bot?.squad || "",
      aggressionLevel: bot?.aggressionLevel || 5,
      trustLevel: bot?.trustLevel || 3,
      timezone: bot?.timezone || "UTC",
      favoritePairs: bot?.favoritePairs?.join(", ") || "",
    },
  });

  useEffect(() => {
    if (bot) {
      form.reset({
        username: bot.username,
        email: bot.email,
        bio: bot.bio || "",
        profilePictureUrl: bot.profilePictureUrl || "",
        purpose: bot.purpose || "",
        squad: bot.squad || "",
        aggressionLevel: bot.aggressionLevel,
        trustLevel: bot.trustLevel,
        timezone: bot.timezone || "UTC",
        favoritePairs: bot.favoritePairs?.join(", ") || "",
      });
    } else {
      form.reset({
        username: "",
        email: "",
        bio: "",
        profilePictureUrl: "",
        purpose: "",
        squad: "",
        aggressionLevel: 5,
        trustLevel: 3,
        timezone: "UTC",
        favoritePairs: "",
      });
    }
  }, [bot, form]);

  const handleGenerateProfile = async () => {
    const purpose = form.getValues("purpose");
    if (!purpose) {
      form.setError("purpose", { message: "Please select a purpose first" });
      return;
    }

    setIsGenerating(true);
    try {
      const profile = await generateProfile.mutateAsync(purpose);
      form.setValue("username", profile.username);
      form.setValue("email", profile.email);
      form.setValue("bio", profile.bio);
      form.setValue("profilePictureUrl", profile.profilePictureUrl || "");
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: BotFormValues) => {
    const botData = {
      ...data,
      favoritePairs: data.favoritePairs ? data.favoritePairs.split(",").map(s => s.trim()) : [],
      profilePictureUrl: data.profilePictureUrl || undefined,
    };

    if (bot) {
      await updateBot.mutateAsync({ botId: bot.id, updates: botData });
    } else {
      await createBot.mutateAsync(botData);
    }

    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-bot">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">
            {bot ? "Edit Bot" : "Create New Bot"}
          </DialogTitle>
          <DialogDescription>
            {bot ? "Update bot configuration" : "Configure a new bot for the platform"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Purpose</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-purpose">
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="engagement" data-testid="option-engagement">Engagement (likes/follows)</SelectItem>
                        <SelectItem value="marketplace" data-testid="option-marketplace">Marketplace Booster</SelectItem>
                        <SelectItem value="referral" data-testid="option-referral">Referral Program</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="squad"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Squad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-squad">
                          <SelectValue placeholder="Select squad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="forum" data-testid="option-forum">Forum</SelectItem>
                        <SelectItem value="marketplace" data-testid="option-marketplace-squad">Marketplace</SelectItem>
                        <SelectItem value="social" data-testid="option-social">Social</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateProfile}
                disabled={isGenerating || !form.getValues("purpose")}
                className="w-full"
                data-testid="button-generate-profile"
              >
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Auto-Generate Profile</>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="bot_username" data-testid="input-username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="bot@example.com" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Bot bio..." rows={3} data-testid="input-bio" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profilePictureUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." data-testid="input-profile-picture" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="aggressionLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aggression Level: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                        data-testid="slider-aggression"
                      />
                    </FormControl>
                    <FormDescription>1 = Passive, 10 = Very Active</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trustLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trust Level: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={2}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                        data-testid="slider-trust"
                      />
                    </FormControl>
                    <FormDescription>Matches real user trust levels</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="UTC" data-testid="input-timezone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="favoritePairs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favorite Pairs (comma-separated)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="EUR/USD, GBP/USD" data-testid="input-pairs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={createBot.isPending || updateBot.isPending} data-testid="button-save">
                {(createBot.isPending || updateBot.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {bot ? "Update Bot" : "Create Bot"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
