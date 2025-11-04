"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  extractPrimaryKeyword,
  generateSeoExcerpt,
  extractHashtags,
  generateUrlSlug,
  calculateKeywordDensity,
  generateImageAltText,
  suggestInternalLinks,
  analyzeTitle,
  extractKeywordSuggestions,
  generateMetaDescriptionPreview
} from "@/lib/seo-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
  Hash,
  Link as LinkIcon,
  AlertCircle,
  Check,
  X,
  Info,
  TrendingUp,
  Image as ImageIcon,
  Target,
  Lightbulb,
  Eye,
  Edit
} from "lucide-react";

export interface SEOData {
  primaryKeyword: string;
  seoExcerpt: string;
  hashtags: string[];
  urlSlug: string;
  keywordDensity: number;
  imageAltTexts: string[];
  internalLinks: Array<{ category: string; relevance: number }>;
}

interface AutoSEOPanelProps {
  title: string;
  body: string;
  imageUrls?: string[];
  onSEOUpdate: (data: SEOData) => void;
  categories?: string[];
}

interface OptimizationTip {
  type: "success" | "warning" | "error" | "info";
  message: string;
  icon?: React.ReactNode;
}

export default function AutoSEOPanel({
  title,
  body,
  imageUrls = [],
  onSEOUpdate,
  categories = []
}: AutoSEOPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [manualFields, setManualFields] = useState<SEOData>({
    primaryKeyword: "",
    seoExcerpt: "",
    hashtags: [],
    urlSlug: "",
    keywordDensity: 0,
    imageAltTexts: [],
    internalLinks: []
  });
  const [hashtagInput, setHashtagInput] = useState("");
  const [isEditingHashtags, setIsEditingHashtags] = useState(false);
  const [showAutoFixSuggestion, setShowAutoFixSuggestion] = useState(false);
  const [persistedHashtags, setPersistedHashtags] = useState<string[] | null>(null);

  // Debounce title and body for performance
  const debouncedTitle = useDebounce(title, 500);
  const debouncedBody = useDebounce(body, 500);
  
  // Auto-generate SEO data
  const autoSEOData = useMemo(() => {
    if (!debouncedTitle && !debouncedBody) {
      return {
        primaryKeyword: "",
        seoExcerpt: "",
        hashtags: [],
        urlSlug: "",
        keywordDensity: 0,
        imageAltTexts: [],
        internalLinks: []
      };
    }

    const primaryKeyword = extractPrimaryKeyword(debouncedTitle, debouncedBody);
    const seoExcerpt = debouncedBody ? generateSeoExcerpt(debouncedBody, primaryKeyword) : "";
    const hashtags = debouncedBody ? extractHashtags(debouncedBody, 5) : [];
    const urlSlug = generateUrlSlug(primaryKeyword, debouncedTitle);
    const keywordDensity = calculateKeywordDensity(`${debouncedTitle} ${debouncedBody}`, primaryKeyword);
    
    // Generate alt texts for images
    const imageAltTexts = imageUrls.map((_, index) => 
      generateImageAltText(primaryKeyword, `Image ${index + 1} from thread`)
    );
    
    // Get internal link suggestions
    const internalLinks = categories.length > 0 && debouncedBody
      ? suggestInternalLinks(debouncedBody, categories)
      : [];

    return {
      primaryKeyword,
      seoExcerpt,
      hashtags,
      urlSlug,
      keywordDensity,
      imageAltTexts,
      internalLinks
    };
  }, [debouncedTitle, debouncedBody, imageUrls, categories]);
  
  // Calculate SEO completion percentage
  const calculateSEOCompletionPercentage = useMemo(() => {
    const data = autoOptimize ? autoSEOData : manualFields;
    let completedFields = 0;
    const totalFields = 6;
    
    if (data.primaryKeyword) completedFields++;
    if (data.seoExcerpt && data.seoExcerpt.length >= 50) completedFields++;
    if (data.hashtags.length > 0) completedFields++;
    if (data.urlSlug) completedFields++;
    if (data.keywordDensity >= 0.5 && data.keywordDensity <= 3) completedFields++;
    if (data.imageAltTexts.length > 0 || imageUrls.length === 0) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  }, [autoOptimize, autoSEOData, manualFields, imageUrls]);

  // Generate keyword suggestions
  const keywordSuggestions = useMemo(() => {
    if (!debouncedTitle && !debouncedBody) return [];
    return extractKeywordSuggestions(debouncedTitle, debouncedBody);
  }, [debouncedTitle, debouncedBody]);

  // Generate meta description preview
  const metaDescriptionPreview = useMemo(() => {
    return generateMetaDescriptionPreview(debouncedBody, 155);
  }, [debouncedBody]);

  // Title analysis
  const titleAnalysis = useMemo(() => {
    if (!debouncedTitle) return null;
    return analyzeTitle(debouncedTitle);
  }, [debouncedTitle]);

  // Initialize manual fields with auto-generated values when switching modes
  useEffect(() => {
    if (!autoOptimize && autoSEOData.primaryKeyword) {
      // Preserve persisted hashtags when switching to manual mode
      const hashtags = persistedHashtags !== null ? persistedHashtags : autoSEOData.hashtags;
      setManualFields({ ...autoSEOData, hashtags });
    }
  }, [autoOptimize, autoSEOData, persistedHashtags]);

  // Update parent component with SEO data
  useEffect(() => {
    let data = autoOptimize ? autoSEOData : manualFields;
    
    // If in auto mode, use persisted or editing hashtags
    if (autoOptimize) {
      const hashtags = isEditingHashtags 
        ? manualFields.hashtags 
        : (persistedHashtags !== null ? persistedHashtags : autoSEOData.hashtags);
      
      data = { ...autoSEOData, hashtags };
    }
    
    onSEOUpdate(data);
  }, [autoOptimize, autoSEOData, manualFields, onSEOUpdate, isEditingHashtags, persistedHashtags]);

  // Calculate current SEO data
  const currentSEOData = useMemo(() => {
    if (autoOptimize) {
      // Use persisted hashtags if available, otherwise use auto-generated
      const hashtags = isEditingHashtags 
        ? manualFields.hashtags 
        : (persistedHashtags !== null ? persistedHashtags : autoSEOData.hashtags);
      
      return { ...autoSEOData, hashtags };
    }
    return manualFields;
  }, [autoOptimize, autoSEOData, manualFields, isEditingHashtags, persistedHashtags]);

  // Generate optimization tips
  const optimizationTips = useMemo((): OptimizationTip[] => {
    const tips: OptimizationTip[] = [];

    // Title length check
    if (titleAnalysis) {
      if (titleAnalysis.isOptimalLength) {
        tips.push({
          type: "success",
          message: `Title length is optimal (${titleAnalysis.length} characters)`,
          icon: <Check className="h-4 w-4" />
        });
      } else if (titleAnalysis.length < 15) {
        tips.push({
          type: "error",
          message: "Title is too short (minimum 15 characters)",
          icon: <X className="h-4 w-4" />
        });
      } else if (titleAnalysis.length > 90) {
        tips.push({
          type: "warning",
          message: "Title is too long (maximum 90 characters)",
          icon: <AlertCircle className="h-4 w-4" />
        });
      }

      // Keyword position check
      if (titleAnalysis.keywordInFirst100) {
        tips.push({
          type: "success",
          message: "Primary keyword appears in first 100 characters",
          icon: <Target className="h-4 w-4" />
        });
      } else if (currentSEOData.primaryKeyword) {
        tips.push({
          type: "warning",
          message: "Primary keyword should appear in first 100 characters",
          icon: <AlertCircle className="h-4 w-4" />
        });
      }
    }

    // Keyword density check
    if (currentSEOData.keywordDensity > 0) {
      if (currentSEOData.keywordDensity >= 0.5 && currentSEOData.keywordDensity <= 3) {
        tips.push({
          type: "success",
          message: `Keyword density is optimal (${currentSEOData.keywordDensity.toFixed(1)}%)`,
          icon: <TrendingUp className="h-4 w-4" />
        });
      } else if (currentSEOData.keywordDensity < 0.5) {
        tips.push({
          type: "warning",
          message: `Keyword density is low (${currentSEOData.keywordDensity.toFixed(1)}%). Consider using the keyword more frequently.`,
          icon: <AlertCircle className="h-4 w-4" />
        });
      } else {
        tips.push({
          type: "warning",
          message: `Keyword density is high (${currentSEOData.keywordDensity.toFixed(1)}%). Reduce keyword usage to avoid over-optimization.`,
          icon: <AlertCircle className="h-4 w-4" />
        });
      }
    }

    // SEO excerpt check
    if (currentSEOData.seoExcerpt) {
      const excerptLength = currentSEOData.seoExcerpt.length;
      if (excerptLength >= 120 && excerptLength <= 160) {
        tips.push({
          type: "success",
          message: `SEO excerpt length is perfect (${excerptLength} characters)`,
          icon: <Check className="h-4 w-4" />
        });
      } else {
        tips.push({
          type: "warning",
          message: `SEO excerpt should be 120-160 characters (currently ${excerptLength})`,
          icon: <AlertCircle className="h-4 w-4" />
        });
      }
    }

    // Image alt text check
    if (imageUrls.length > 0 && currentSEOData.imageAltTexts.length === 0) {
      tips.push({
        type: "error",
        message: "Missing alt text for images. Add descriptions for better SEO.",
        icon: <ImageIcon className="h-4 w-4" />
      });
    } else if (currentSEOData.imageAltTexts.length > 0) {
      tips.push({
        type: "success",
        message: `Alt text generated for ${currentSEOData.imageAltTexts.length} images`,
        icon: <ImageIcon className="h-4 w-4" />
      });
    }

    // Internal links suggestion
    if (currentSEOData.internalLinks.length > 0) {
      tips.push({
        type: "info",
        message: `Found ${currentSEOData.internalLinks.length} relevant categories for internal linking`,
        icon: <LinkIcon className="h-4 w-4" />
      });
    }

    // Hashtags check
    if (currentSEOData.hashtags.length === 0 && body.length > 100) {
      tips.push({
        type: "info",
        message: "Consider adding hashtags to increase discoverability",
        icon: <Hash className="h-4 w-4" />
      });
    }

    return tips;
  }, [titleAnalysis, currentSEOData, imageUrls, body]);

  // Handle manual field updates
  const handleManualFieldChange = (field: keyof SEOData, value: any) => {
    setManualFields(prev => ({ ...prev, [field]: value }));
  };

  // Add hashtag manually
  const addHashtag = () => {
    if (hashtagInput && manualFields.hashtags.length < 10) {
      const tag = hashtagInput.startsWith("#") ? hashtagInput : `#${hashtagInput}`;
      handleManualFieldChange("hashtags", [...manualFields.hashtags, tag]);
      setHashtagInput("");
    }
  };

  // Remove hashtag
  const removeHashtag = (index: number) => {
    handleManualFieldChange("hashtags", manualFields.hashtags.filter((_, i) => i !== index));
  };

  // Apply keyword suggestion - switches to manual mode
  const applyKeywordSuggestion = (keyword: string) => {
    setAutoOptimize(false);
    setTimeout(() => {
      handleManualFieldChange("primaryKeyword", keyword);
      // Recalculate keyword density with new keyword
      const newDensity = calculateKeywordDensity(`${debouncedTitle} ${debouncedBody}`, keyword);
      handleManualFieldChange("keywordDensity", newDensity);
    }, 100);
  };

  // Auto-fix keyword density by suggesting alternatives
  const autoFixKeywordDensity = () => {
    if (!currentSEOData.primaryKeyword) return;
    
    // Switch to manual mode
    setAutoOptimize(false);
    setTimeout(() => {
      // If density is too high, suggest synonyms or variations
      if (currentSEOData.keywordDensity > 3) {
        // Get alternative keywords from suggestions
        const alternatives = keywordSuggestions.filter(kw => kw !== currentSEOData.primaryKeyword);
        if (alternatives.length > 0) {
          handleManualFieldChange("primaryKeyword", alternatives[0]);
        }
      }
      // If density is too low, just switch to manual and let user add it manually
      setShowAutoFixSuggestion(true);
      setTimeout(() => setShowAutoFixSuggestion(false), 5000);
    }, 100);
  };

  // Toggle hashtag editing mode
  const toggleHashtagEditing = () => {
    if (!isEditingHashtags) {
      // Entering edit mode - copy current hashtags to manual fields
      const currentHashtags = persistedHashtags !== null ? persistedHashtags : autoSEOData.hashtags;
      setManualFields(prev => ({ ...prev, hashtags: [...currentHashtags] }));
    } else {
      // Exiting edit mode - persist the edited hashtags
      setPersistedHashtags([...manualFields.hashtags]);
    }
    setIsEditingHashtags(!isEditingHashtags);
  };

  // Get keyword density badge color
  const getKeywordDensityColor = (density: number) => {
    if (density >= 0.5 && density <= 3) return "bg-green-500";
    if (density < 0.5) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <TooltipProvider>
      <Card className="w-full">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  <CardTitle className="text-lg">
                    SEO Optimization - <span className="text-primary">Boost Your Visibility 3x</span>
                  </CardTitle>
                  {autoOptimize && (
                    <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Auto-optimizing
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-toggle-seo-panel"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <CardDescription className="mt-2">
                <span className="font-semibold text-foreground">
                  🚀 Threads with SEO get 70% more views and 3x more responses
                </span>
                <span className="block text-xs text-muted-foreground mt-1">
                  Just 2 minutes of optimization can put your thread at the top of search results
                </span>
              </CardDescription>
              {/* Benefit badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 text-xs">
                  🎯 Get found faster
                </Badge>
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 text-xs">
                  📈 3x more engagement
                </Badge>
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 text-xs">
                  ⭐ Rank higher in search
                </Badge>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs">
                  🏆 Appear in trending
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* SEO Completion Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">SEO Optimization Progress</h4>
                  <span className={`text-sm font-bold ${
                    calculateSEOCompletionPercentage === 100 ? 'text-green-600' : 
                    calculateSEOCompletionPercentage >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {calculateSEOCompletionPercentage}% Complete
                  </span>
                </div>
                <Progress 
                  value={calculateSEOCompletionPercentage} 
                  className="h-3"
                />
                {calculateSEOCompletionPercentage < 100 && (
                  <Alert className={`border-2 ${
                    calculateSEOCompletionPercentage < 50 ? 'border-red-500/30 bg-red-50 dark:bg-red-950/20' : 
                    'border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20'
                  }`}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {calculateSEOCompletionPercentage < 50 ? (
                        <>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            ⚠️ Missing opportunity for +{600 - calculateSEOCompletionPercentage * 5} views
                          </span>
                          <span className="block text-xs mt-1">
                            Complete the SEO fields below to maximize your thread's reach. 
                            Top performing threads have 100% SEO completion!
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                            💡 Almost there! Just {100 - calculateSEOCompletionPercentage}% more for maximum visibility
                          </span>
                          <span className="block text-xs mt-1">
                            You're on track! Complete the remaining fields to join the top 10% of threads.
                          </span>
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                {calculateSEOCompletionPercentage === 100 && (
                  <Alert className="border-2 border-green-500/30 bg-green-50 dark:bg-green-950/20">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        🎉 Perfect! Your thread is fully optimized for maximum visibility
                      </span>
                      <span className="block text-xs mt-1">
                        You're in the top 10% of optimized threads. Expect 3x more views and engagement!
                      </span>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              {/* Auto-optimize toggle */}
              <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                autoOptimize ? 'bg-green-50 dark:bg-green-950/20 border-green-500/30' : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500/30'
              }`}>
                <div className="space-y-0.5 flex-1 mr-4">
                  <Label htmlFor="auto-optimize" className="text-base cursor-pointer font-semibold">
                    {autoOptimize ? (
                      <>✨ Let AI boost your visibility (Recommended)</>
                    ) : (
                      <>⚠️ Manual mode - Don't miss out on potential reach!</>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {autoOptimize ? (
                      <>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          ✅ AI is optimizing your SEO for maximum visibility
                        </span>
                        <span className="block text-xs mt-1">
                          Join 89% of top threads that use auto-optimization
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                          ⚠️ Without SEO optimization, your thread may get 70% less visibility
                        </span>
                        <span className="block text-xs mt-1">
                          💡 Threads with proper SEO get 3x more responses on average
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <Switch
                  id="auto-optimize"
                  checked={autoOptimize}
                  onCheckedChange={setAutoOptimize}
                  data-testid="switch-auto-optimize"
                  className={autoOptimize ? 'data-[state=checked]:bg-green-600' : ''}
                />
              </div>

              {/* Google SERP Preview */}
              <div className="mb-6">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4" />
                  Search Engine Preview
                </h3>
                <div className="border rounded-lg p-4 bg-white dark:bg-muted/20">
                  {/* Google SERP style */}
                  <div className="space-y-1">
                    {/* Title */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <h3 
                          className="text-[20px] text-[#1a0dab] dark:text-blue-400 font-normal leading-[1.3] cursor-pointer hover:underline"
                          data-testid="serp-preview-title"
                        >
                          {debouncedTitle || "Your EA Title Will Appear Here"}
                        </h3>
                      </div>
                    </div>
                    
                    {/* URL */}
                    <div className="flex items-center gap-1 text-sm" data-testid="serp-preview-url">
                      <span className="text-[#202124] dark:text-gray-400">yoforex.com</span>
                      <span className="text-[#5f6368] dark:text-gray-500"> › ea › </span>
                      <span className="text-[#5f6368] dark:text-gray-500">
                        {currentSEOData.urlSlug || "your-ea-slug"}
                      </span>
                    </div>
                    
                    {/* Meta Description */}
                    <p 
                      className="text-sm text-[#4d5156] dark:text-gray-300 leading-[1.58]"
                      data-testid="serp-preview-description"
                    >
                      {metaDescriptionPreview || currentSEOData.seoExcerpt || "Your EA description will appear here. Write a compelling description to attract more buyers."}
                    </p>
                    
                    {/* Character count */}
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className={`text-xs ${
                        metaDescriptionPreview.length >= 120 && metaDescriptionPreview.length <= 155
                          ? "text-green-600 dark:text-green-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`} data-testid="meta-char-count">
                        Meta Description: {metaDescriptionPreview.length}/155 characters
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SEO Fields */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Keyword Suggestions */}
                  {keywordSuggestions.length > 0 && (
                    <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <Label className="text-blue-900 dark:text-blue-100">Suggested Keywords</Label>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Based on your content. Click any suggestion to apply it.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {keywordSuggestions.map((keyword, index) => (
                          <Badge
                            key={index}
                            variant={currentSEOData.primaryKeyword === keyword ? "default" : "outline"}
                            className={`cursor-pointer transition-all ${
                              currentSEOData.primaryKeyword === keyword
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "hover:bg-blue-100 dark:hover:bg-blue-900 border-blue-300 dark:border-blue-700"
                            }`}
                            onClick={() => applyKeywordSuggestion(keyword)}
                            data-testid={`keyword-suggestion-${index}`}
                          >
                            <Search className="h-3 w-3 mr-1" />
                            {keyword}
                            {currentSEOData.primaryKeyword === keyword && (
                              <Check className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                        ))}
                      </div>
                      {autoOptimize && (
                        <p className="text-xs text-green-600 dark:text-green-400 italic mt-2 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Click any keyword to switch to manual mode and apply it
                        </p>
                      )}
                      {showAutoFixSuggestion && (
                        <Alert className="mt-2 border-green-500 bg-green-50 dark:bg-green-950">
                          <Check className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Keyword applied! You can now manually adjust the content to optimize density.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Primary Keyword */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Label className="font-semibold">
                        Primary Keyword 
                        <span className="text-xs text-muted-foreground ml-2">
                          (3x visibility boost when optimized)
                        </span>
                      </Label>
                      {currentSEOData.keywordDensity > 0 && (
                        <Badge 
                          className={`${getKeywordDensityColor(currentSEOData.keywordDensity)} text-white`}
                        >
                          {currentSEOData.keywordDensity.toFixed(1)}% density
                        </Badge>
                      )}
                      {!currentSEOData.primaryKeyword && (
                        <Badge variant="destructive" className="animate-pulse">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Missing +300 views
                        </Badge>
                      )}
                      {/* Auto-fix button for bad keyword density */}
                      {currentSEOData.keywordDensity > 0 && (currentSEOData.keywordDensity < 0.5 || currentSEOData.keywordDensity > 3) && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="ml-auto text-xs h-7"
                          onClick={autoFixKeywordDensity}
                          data-testid="button-auto-fix-density"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Auto-Fix
                        </Button>
                      )}
                    </div>
                    {autoOptimize ? (
                      <div className="p-3 rounded-md bg-muted">
                        <p className="font-medium">{currentSEOData.primaryKeyword || "Analyzing content..."}</p>
                      </div>
                    ) : (
                      <Input
                        value={manualFields.primaryKeyword}
                        onChange={(e) => {
                          const keyword = e.target.value;
                          handleManualFieldChange("primaryKeyword", keyword);
                          // Recalculate density on change
                          const newDensity = calculateKeywordDensity(`${debouncedTitle} ${debouncedBody}`, keyword);
                          handleManualFieldChange("keywordDensity", newDensity);
                        }}
                        placeholder="Enter your primary keyword..."
                        maxLength={50}
                        data-testid="input-primary-keyword"
                      />
                    )}
                  </div>

                  {/* SEO Excerpt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <Label className="font-semibold">
                          SEO Excerpt
                          <span className="text-xs text-muted-foreground ml-2">
                            (Your search result preview - critical for getting clicks!)
                          </span>
                        </Label>
                        {!currentSEOData.seoExcerpt && (
                          <Badge variant="destructive" className="animate-pulse">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Missing +50% CTR
                          </Badge>
                        )}
                      </div>
                      <span className={`text-xs ${
                        currentSEOData.seoExcerpt.length >= 120 && currentSEOData.seoExcerpt.length <= 160
                          ? "text-green-500"
                          : "text-amber-500"
                      }`}>
                        {currentSEOData.seoExcerpt.length}/160 chars
                      </span>
                    </div>
                    {autoOptimize ? (
                      <div className="p-3 rounded-md bg-muted">
                        <p className="text-sm">{currentSEOData.seoExcerpt || "Generating..."}</p>
                      </div>
                    ) : (
                      <Textarea
                        value={manualFields.seoExcerpt}
                        onChange={(e) => handleManualFieldChange("seoExcerpt", e.target.value)}
                        placeholder="Enter a compelling description (120-160 characters)..."
                        maxLength={160}
                        rows={3}
                        data-testid="textarea-seo-excerpt"
                      />
                    )}
                  </div>

                  {/* Hashtags */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <Label>Hashtags</Label>
                      <span className="text-xs text-muted-foreground">({(isEditingHashtags ? manualFields.hashtags.length : currentSEOData.hashtags.length)}/10)</span>
                      {/* Customized indicator */}
                      {autoOptimize && persistedHashtags !== null && !isEditingHashtags && (
                        <Badge variant="secondary" className="text-xs">
                          Customized
                        </Badge>
                      )}
                      {/* Edit and reset buttons for auto mode */}
                      {autoOptimize && (
                        <div className="ml-auto flex gap-1">
                          {persistedHashtags !== null && !isEditingHashtags && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7"
                              onClick={() => setPersistedHashtags(null)}
                              data-testid="button-reset-hashtags"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Reset
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant={isEditingHashtags ? "default" : "outline"}
                            className="text-xs h-7"
                            onClick={toggleHashtagEditing}
                            data-testid="button-edit-hashtags"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            {isEditingHashtags ? "Done" : "Edit"}
                          </Button>
                        </div>
                      )}
                    </div>
                    {autoOptimize && !isEditingHashtags ? (
                      <div className="flex flex-wrap gap-2 p-3 rounded-md bg-muted min-h-[60px]">
                        {currentSEOData.hashtags.length > 0 ? (
                          currentSEOData.hashtags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Info className="h-4 w-4" />
                            <span>No hashtags found. Click "Edit" to add manually.</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={hashtagInput}
                            onChange={(e) => setHashtagInput(e.target.value)}
                            placeholder="Add hashtag (e.g., forex, trading)..."
                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
                            data-testid="input-hashtag"
                          />
                          <Button
                            type="button"
                            onClick={addHashtag}
                            size="sm"
                            disabled={(isEditingHashtags ? manualFields.hashtags.length : currentSEOData.hashtags.length) >= 10}
                            data-testid="button-add-hashtag"
                          >
                            <Hash className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(isEditingHashtags ? manualFields.hashtags : currentSEOData.hashtags).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="group">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeHashtag(index)}
                                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                data-testid={`button-remove-hashtag-${index}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        {(isEditingHashtags ? manualFields.hashtags : currentSEOData.hashtags).length === 0 && (
                          <p className="text-xs text-muted-foreground italic">
                            Add relevant trading hashtags like #forex, #trading, #EURUSD, etc.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* URL Slug */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <Label>URL Slug</Label>
                    </div>
                    {autoOptimize ? (
                      <div className="p-3 rounded-md bg-muted">
                        <code className="text-sm">{currentSEOData.urlSlug || "generating-slug..."}</code>
                      </div>
                    ) : (
                      <Input
                        value={manualFields.urlSlug}
                        onChange={(e) => handleManualFieldChange("urlSlug", e.target.value.replace(/[^a-z0-9-]/g, ""))}
                        placeholder="url-friendly-slug"
                        maxLength={60}
                        data-testid="input-url-slug"
                      />
                    )}
                  </div>

                  {/* Image Alt Texts */}
                  {imageUrls.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <Label>Image Alt Texts</Label>
                      </div>
                      {autoOptimize ? (
                        <div className="space-y-2">
                          {currentSEOData.imageAltTexts.map((altText, index) => (
                            <div key={index} className="p-2 rounded-md bg-muted text-sm">
                              <span className="font-medium">Image {index + 1}:</span> {altText}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {imageUrls.map((_, index) => (
                            <Input
                              key={index}
                              value={manualFields.imageAltTexts[index] || ""}
                              onChange={(e) => {
                                const newAltTexts = [...manualFields.imageAltTexts];
                                newAltTexts[index] = e.target.value;
                                handleManualFieldChange("imageAltTexts", newAltTexts);
                              }}
                              placeholder={`Describe image ${index + 1}...`}
                              data-testid={`input-alt-text-${index}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Internal Links */}
                  {currentSEOData.internalLinks.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <Label>Suggested Internal Links</Label>
                      </div>
                      <div className="p-3 rounded-md bg-muted space-y-1">
                        {currentSEOData.internalLinks.map((link, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{link.category}</span>
                            <Badge variant="outline" className="text-xs">
                              {link.relevance}% relevant
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Optimization Tips Sidebar */}
                <div className="lg:col-span-1">
                  <div className="sticky top-4 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Optimization Tips
                      </h3>
                      <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                        <div className="space-y-3">
                          {optimizationTips.map((tip, index) => (
                            <Alert key={index} className={`
                              ${tip.type === "success" ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}
                              ${tip.type === "warning" ? "border-amber-500 bg-amber-50 dark:bg-amber-950" : ""}
                              ${tip.type === "error" ? "border-red-500 bg-red-50 dark:bg-red-950" : ""}
                              ${tip.type === "info" ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : ""}
                            `}>
                              <div className="flex items-start gap-2">
                                {tip.icon}
                                <AlertDescription className="text-xs">
                                  {tip.message}
                                </AlertDescription>
                              </div>
                            </Alert>
                          ))}

                          {optimizationTips.length === 0 && (
                            <Alert>
                              <Info className="h-4 w-4" />
                              <AlertDescription>
                                Start typing to see optimization suggestions
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* SEO Score */}
                    <div className="p-4 rounded-lg border space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        SEO Score
                      </h4>
                      <div className="space-y-2">
                        <Progress 
                          value={
                            Math.min(100, 
                              (optimizationTips.filter(t => t.type === "success").length / 
                              Math.max(1, optimizationTips.length)) * 100
                            )
                          } 
                          className="h-2"
                        />
                        <p className="text-sm text-muted-foreground">
                          {optimizationTips.filter(t => t.type === "success").length} of{" "}
                          {optimizationTips.length} optimizations complete
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}