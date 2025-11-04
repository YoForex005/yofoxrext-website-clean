"use client";

import { useState, useCallback, useEffect, useRef, Suspense, lazy } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";

// Lazy load TipTap components to avoid SSR issues
const EditorContent = dynamic(
  () => import("@tiptap/react").then(mod => mod.EditorContent),
  { ssr: false }
);

// Import TipTap modules only on client-side
let useEditor: any;
let StarterKit: any;
let Underline: any;
let Image: any;

if (typeof window !== 'undefined') {
  const tiptapReact = require("@tiptap/react");
  const tiptapStarterKit = require("@tiptap/starter-kit");
  const tiptapUnderline = require("@tiptap/extension-underline");
  const tiptapImage = require("@tiptap/extension-image");
  
  useEditor = tiptapReact.useEditor;
  StarterKit = tiptapStarterKit.default;
  Underline = tiptapUnderline.default;
  Image = tiptapImage.default;
}
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import AutoSEOPanel, { type SEOData } from "@/components/AutoSEOPanel";
import SEOPreview from "@/components/SEOPreview";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Upload, 
  X, 
  CheckCircle, 
  CheckCircle2,
  AlertCircle, 
  Eye, 
  FileCode,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Info,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Trophy,
  BarChart,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { EA_CATEGORY_OPTIONS } from "@shared/schema";
import { sanitizeRichTextHTML, countTextCharacters, extractTextExcerpt } from "@shared/sanitize";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Category emoji mapping
const CATEGORY_EMOJIS: Record<string, string> = {
  "Expert Advisor type": "🤖",
  "Martingale type": "🎲",
  "Grid": "🔲",
  "Arbitrage": "💹",
  "Hedging": "🛡️",
  "Scalping": "⚡",
  "News": "📰",
  "Trend": "📈",
  "Level trading": "📊",
  "Neural networks": "🧠",
  "Multicurrency": "🌍"
};

// LivePreview Component
interface LivePreviewProps {
  title: string;
  tags: string[];
  priceCoins: number;
  description: string;
  imageUrls: string[];
}

function LivePreview({ title, tags, priceCoins, description, imageUrls }: LivePreviewProps) {
  // Extract first 200 characters for description preview
  const descriptionPreview = description ? extractTextExcerpt(description, 200) : "";
  const hasContent = title || tags.length > 0 || description || imageUrls.length > 0;

  return (
    <Card data-testid="live-preview-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Preview - How Your EA Will Look
        </CardTitle>
        <CardDescription>
          This is how your EA will appear to buyers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-6 space-y-6 bg-muted/20" data-testid="preview-content">
          {/* Title Section */}
          <div className="space-y-3">
            {title ? (
              <h1 className="text-3xl font-bold tracking-tight" data-testid="preview-title">
                {title}
              </h1>
            ) : (
              <div className="text-muted-foreground italic" data-testid="preview-title-empty">
                No title yet. Add a title in the EA Details tab.
              </div>
            )}

            {/* Category Badges */}
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2" data-testid="preview-category-badges">
                {tags.map((tag, index) => {
                  const emoji = CATEGORY_EMOJIS[tag] || "🏷️";
                  return (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-sm"
                      data-testid={`preview-badge-${index}`}
                    >
                      {emoji} {tag}
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <div className="text-muted-foreground italic text-sm" data-testid="preview-categories-empty">
                No categories selected. Choose categories in the EA Details tab.
              </div>
            )}
          </div>

          {/* Price Badge */}
          <div className="flex items-center gap-2">
            <Badge 
              variant="default" 
              className="text-lg px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white"
              data-testid="preview-price-badge"
            >
              💰 {priceCoins} Gold Coins
            </Badge>
          </div>

          {/* Image Gallery */}
          {imageUrls.length > 0 ? (
            <div className="space-y-2" data-testid="preview-image-gallery">
              <p className="text-sm font-medium text-muted-foreground">Screenshots</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imageUrls.map((url, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-video rounded-lg overflow-hidden border bg-muted"
                    data-testid={`preview-image-${index}`}
                  >
                    <img
                      src={url}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                        COVER
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg" data-testid="preview-images-empty">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No images uploaded yet. Add screenshots in Files & Media tab.
              </p>
            </div>
          )}

          {/* Description Preview */}
          {description ? (
            <div className="space-y-2" data-testid="preview-description">
              <p className="text-sm font-medium text-muted-foreground">Description Preview</p>
              <div 
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeRichTextHTML(descriptionPreview) 
                }}
              />
              {countTextCharacters(description) > 200 && (
                <p className="text-xs text-muted-foreground italic">
                  ... (Full description will be shown on EA detail page)
                </p>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground italic py-4 text-center border-2 border-dashed rounded-lg" data-testid="preview-description-empty">
              No description yet. Start typing in the EA Details tab.
            </div>
          )}

          {/* Call to Action Preview */}
          {hasContent && (
            <div className="pt-4 border-t">
              <Button 
                className="w-full" 
                size="lg" 
                disabled
                data-testid="preview-cta-button"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Purchase for {priceCoins} Gold Coins
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Form validation schema
const eaFormSchema = z.object({
  title: z.string()
    .min(30, "Title must be at least 30 characters")
    .max(60, "Title must be at most 60 characters"),
  tags: z.array(z.string())
    .min(1, "Select at least 1 category")
    .max(5, "Maximum 5 categories allowed")
    .refine(
      (tags) => tags.every(tag => 
        EA_CATEGORY_OPTIONS.includes(tag as any) || tag.startsWith('Custom:')
      ),
      "Invalid category selected"
    ),
  customCategory: z.string().optional(),
  description: z.string()
    .min(1, "Description is required")
    .refine(
      (html) => {
        const textLength = countTextCharacters(html);
        return textLength >= 200;
      },
      "Description must be at least 200 characters (excluding HTML tags)"
    )
    .refine(
      (html) => {
        const textLength = countTextCharacters(html);
        return textLength <= 2000;
      },
      "Description must be at most 2000 characters (excluding HTML tags)"
    ),
  priceCoins: z.number()
    .int("Price must be a whole number")
    .min(20, "Price must be at least 20 coins for EA content")
    .max(1000, "Price must be at most 1000 coins"),
  eaFileUrl: z.string().min(1, "EA file is required"),
  imageUrls: z.array(z.string()).max(5, "Maximum 5 images allowed").default([]),
  
  // SEO fields
  slug: z.string().min(1, "Slug is required"),
  primaryKeyword: z.string().optional().default(""),
  seoExcerpt: z.string().optional().default(""),
  hashtags: z.array(z.string()).default([])
});

type EAFormData = z.infer<typeof eaFormSchema>;

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageCount, setImageCount] = useState(0);

  // Handle case where TipTap is not yet loaded
  const editor = typeof window !== 'undefined' && useEditor ? useEditor({
    immediatelyRender: false, // Fix SSR hydration mismatch
    extensions: [
      StarterKit,
      Underline,
      Image?.configure({
        inline: true,
        allowBase64: false,
      }),
    ].filter(Boolean),
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[200px] max-h-[400px] overflow-y-auto px-4 py-3',
      },
    },
    onUpdate: ({ editor }: { editor: any }) => {
      const html = editor.getHTML();
      onChange(html);
      
      const images = editor.getJSON().content?.filter((node: any) => 
        node.type === 'paragraph' && node.content?.some((child: any) => child.type === 'image')
      ) || [];
      const totalImages = images.reduce((count: number, node: any) => {
        return count + (node.content?.filter((child: any) => child.type === 'image').length || 0);
      }, 0);
      setImageCount(totalImages);
    },
  }, []) : null;
  
  // Cleanup editor on unmount to prevent duplicate extension warnings
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [editor, value]);

  useEffect(() => {
    if (editor) {
      const updateImageCount = () => {
        const json = editor.getJSON();
        let count = 0;
        
        const countImages = (node: any) => {
          if (node.type === 'image') {
            count++;
          }
          if (node.content) {
            node.content.forEach(countImages);
          }
        };
        
        if (json.content) {
          json.content.forEach(countImages);
        }
        
        setImageCount(count);
      };
      
      updateImageCount();
    }
  }, [editor]);

  const handleImageUpload = async (file: File) => {
    if (imageCount >= 5) {
      toast({
        title: "Image limit reached",
        description: "Maximum 5 inline images allowed",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'ea-inline-image');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      if (editor) {
        editor.chain().focus().setImage({ src: data.url }).run();
        toast({
          title: "Image inserted",
          description: "Image added to description",
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageButtonClick = () => {
    if (imageCount >= 5) {
      toast({
        title: "Image limit reached",
        description: "Maximum 5 inline images allowed",
        variant: "destructive",
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PNG, JPG, or WEBP image",
          variant: "destructive",
        });
        return;
      }
      handleImageUpload(file);
    }
    e.target.value = '';
  };

  if (!editor) {
    return null;
  }

  const textLength = countTextCharacters(editor.getHTML());
  const isImageLimitReached = imageCount >= 5;

  const getCharCountColor = () => {
    if (textLength < 200) return 'text-destructive';
    if (textLength < 500) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-green-600 dark:text-green-500';
  };

  return (
    <div className="border rounded-lg overflow-hidden" data-testid="rich-text-editor">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="bg-muted/50 border-b p-2 flex flex-wrap gap-1" data-testid="editor-toolbar">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={editor.isActive('bold') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className="min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px]"
                data-testid="button-bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold (Ctrl+B)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={editor.isActive('italic') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className="min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px]"
                data-testid="button-italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic (Ctrl+I)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={editor.isActive('underline') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className="min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px]"
                data-testid="button-underline"
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Underline (Ctrl+U)</TooltipContent>
          </Tooltip>

          <div className="w-px bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className="min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px]"
                data-testid="button-bullet-list"
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className="min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px]"
                data-testid="button-ordered-list"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Numbered List</TooltipContent>
          </Tooltip>

          <div className="w-px bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleImageButtonClick}
                disabled={isImageLimitReached || uploadingImage}
                className="min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px]"
                data-testid="button-insert-image"
              >
                {uploadingImage ? (
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isImageLimitReached ? `${imageCount}/5 images used (limit reached)` : `Insert Image (${imageCount}/5)`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <EditorContent editor={editor} />

      <div className={`px-4 py-2 bg-muted/30 border-t text-sm ${getCharCountColor()}`} data-testid="character-counter">
        {textLength} / 2000 characters (min 200)
        {textLength < 200 && <span className="ml-2 text-xs">• Need {200 - textLength} more</span>}
      </div>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to calculate estimated views
function calculateEstimatedViews(formData: {
  title: string;
  tags: string[];
  description: string;
  priceCoins: number;
  imageUrls: string[];
}): number {
  const { title, tags, description, priceCoins, imageUrls } = formData;
  let baseViews = 150;
  
  // Title optimization
  if (title.length >= 40 && title.length <= 60) baseViews += 100;
  
  // Description quality
  const descriptionLength = countTextCharacters(description);
  if (descriptionLength >= 500) baseViews += 150;
  if (descriptionLength >= 1000) baseViews += 100;
  
  // Images
  baseViews += imageUrls.length * 50;
  
  // Categories
  if (tags.length >= 2) baseViews += 100;
  if (tags.length >= 3) baseViews += 150;
  
  // Price sweetspot
  if (priceCoins >= 20 && priceCoins <= 100) baseViews += 200;
  
  return Math.min(baseViews, 1500); // Cap at 1500
}

// Helper function to get title strength
function getTitleStrength(title: string): { variant: 'destructive' | 'secondary' | 'default', label: string } {
  const length = title.length;
  if (length < 30) return { variant: 'destructive', label: 'Too Short' };
  if (length >= 30 && length < 40) return { variant: 'secondary', label: 'Okay' };
  if (length >= 40 && length <= 55) return { variant: 'default', label: 'Good' };
  if (length >= 56 && length <= 60) return { variant: 'default', label: 'Perfect' };
  return { variant: 'destructive', label: 'Too Long' };
}

// Publishing Progress Panel Component
interface PublishingProgressPanelProps {
  formData: {
    title: string;
    tags: string[];
    description: string;
    priceCoins: number;
    eaFileUrl: string;
    imageUrls: string[];
    primaryKeyword: string;
  };
}

function PublishingProgressPanel({ formData }: PublishingProgressPanelProps) {
  const { title, tags, description, priceCoins, eaFileUrl, imageUrls, primaryKeyword } = formData;
  const descriptionLength = countTextCharacters(description);
  
  const checks = [
    {
      label: 'Title added (30-60 chars)',
      completed: title.length >= 30 && title.length <= 60,
      icon: '✏️'
    },
    {
      label: 'Category selected (1-5)',
      completed: tags.length >= 1 && tags.length <= 5,
      icon: '🏷️'
    },
    {
      label: 'Description (min 200 chars)',
      completed: descriptionLength >= 200 && descriptionLength <= 2000,
      icon: '📝'
    },
    {
      label: 'EA file uploaded',
      completed: eaFileUrl.length > 0,
      icon: '📁'
    },
    {
      label: 'At least 1 image',
      completed: imageUrls.length >= 1,
      icon: '🖼️'
    },
    {
      label: 'Price set (20+ coins)',
      completed: priceCoins >= 20,
      icon: '💰'
    },
    {
      label: 'SEO keyword added',
      completed: primaryKeyword.length > 0,
      icon: '🔍'
    }
  ];
  
  const completedCount = checks.filter(c => c.completed).length;
  const percentComplete = Math.round((completedCount / checks.length) * 100);
  const allComplete = completedCount === checks.length;
  
  // Progress bar color
  const getProgressColor = () => {
    if (percentComplete < 50) return 'bg-red-500';
    if (percentComplete < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Publishing Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vertical Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-bold text-lg">{percentComplete}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ease-in-out ${getProgressColor()}`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
        
        {/* Checklist */}
        <div className="space-y-2">
          {checks.map((check, index) => (
            <div 
              key={index}
              className={`flex items-start gap-2 text-sm transition-all duration-200 ${
                check.completed ? 'opacity-100' : 'opacity-60'
              }`}
            >
              {check.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0 animate-in fade-in slide-in-from-left-2 duration-300" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground mt-0.5 flex-shrink-0" />
              )}
              <span className={check.completed ? 'font-medium' : ''}>
                <span className="mr-1">{check.icon}</span>
                {check.label}
              </span>
            </div>
          ))}
        </div>
        
        {/* Completion Badge */}
        {allComplete ? (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3 text-center animate-in zoom-in duration-300">
            <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300 font-semibold">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span>Ready to Publish!</span>
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
              <Info className="h-4 w-4" />
              <span>{checks.length - completedCount} steps remaining</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Quick Tips Card Component
function QuickTipsCard() {
  return (
    <Card className="mb-4 animate-in fade-in slide-in-from-right duration-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Quick Tips for Success
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>Add backtest screenshots</strong> – buyers trust results!</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>Set price 20–100 coins</strong> for first-time sales</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>Use bold & images</strong> in description for 2x more views</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>Tag 2–3 categories</strong> to reach the right traders</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}

// Live Stats Card Component
interface LiveStatsCardProps {
  formData: {
    title: string;
    tags: string[];
    description: string;
    priceCoins: number;
    imageUrls: string[];
  };
}

function LiveStatsCard({ formData }: LiveStatsCardProps) {
  const { title, description, imageUrls } = formData;
  const descriptionLength = countTextCharacters(description);
  const titleStrength = getTitleStrength(title);
  const estimatedViews = calculateEstimatedViews(formData);
  
  return (
    <Card className="mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 animate-in fade-in slide-in-from-right duration-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart className="h-5 w-5 text-blue-600" />
          Live Stats Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span>Title strength:</span>
            <Badge variant={titleStrength.variant as any}>{titleStrength.label}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Description:</span>
            <span className="text-muted-foreground">{descriptionLength}/2000 chars</span>
          </div>
          <div className="flex justify-between">
            <span>Images added:</span>
            <span className="text-muted-foreground">{imageUrls.length}/5</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-blue-600 dark:text-blue-400 font-medium">Estimated views:</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">~{estimatedViews} this week</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Top Performing EAs Card Component
function TopPerformingEAsCard() {
  const { data: topSellers, isLoading } = useQuery({
    queryKey: ['/api/content/top-sellers'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const topEAs = (topSellers as any)?.slice(0, 2) || [];
  
  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 animate-in fade-in slide-in-from-right duration-1000">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-600" />
          Top Performing EAs This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 animate-pulse">
                <div className="w-12 h-12 rounded bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : topEAs.length > 0 ? (
          <>
            <div className="space-y-3">
              {topEAs.map((ea: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors">
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                    {ea.imageUrls?.[0] ? (
                      <img 
                        src={ea.imageUrls[0]} 
                        alt={ea.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ea.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{ea.priceCoins || 0} ₡</Badge>
                      <span className="text-xs text-muted-foreground">{ea.salesCount || 0} sales</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3 italic">
              💡 This is what success looks like!
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No top sellers available yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface ProTipsProps {
  title: string;
  tips: string[];
  defaultOpen?: boolean;
}

function ProTips({ title, tips, defaultOpen = false }: ProTipsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100 text-base">
                <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                {title}
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <ul className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

interface ProgressTrackerProps {
  formData: {
    title: string;
    tags: string[];
    description: string;
    priceCoins: number;
    eaFileUrl: string;
    imageUrls: string[];
    primaryKeyword: string;
    seoExcerpt: string;
  };
}

function ProgressTracker({ formData }: ProgressTrackerProps) {
  const { title, tags, description, priceCoins, eaFileUrl, imageUrls, primaryKeyword, seoExcerpt } = formData;
  
  const descriptionLength = countTextCharacters(description);
  
  const eaDetailsComplete = [
    title.length >= 30 && title.length <= 60,
    tags.length >= 1 && tags.length <= 5,
    descriptionLength >= 200 && descriptionLength <= 2000,
    priceCoins >= 20 && priceCoins <= 1000
  ];
  
  const filesMediaComplete = [
    eaFileUrl.length > 0,
    imageUrls.length >= 1
  ];
  
  const seoComplete = [
    primaryKeyword.length > 0
  ];
  
  const eaDetailsCount = eaDetailsComplete.filter(Boolean).length;
  const filesMediaCount = filesMediaComplete.filter(Boolean).length;
  const seoCount = seoComplete.filter(Boolean).length;
  
  const totalCompleted = eaDetailsCount + filesMediaCount + seoCount;
  const totalRequired = 7;
  const percentComplete = Math.round((totalCompleted / totalRequired) * 100);
  
  const allRequiredComplete = eaDetailsCount === 4 && filesMediaCount === 2 && seoCount === 1;

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b shadow-sm mb-6 animate-in slide-in-from-top duration-300">
      <div className="container max-w-4xl mx-auto px-4 py-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                {allRequiredComplete ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300">Form Complete - Ready to Publish!</span>
                  </>
                ) : (
                  <>
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span>Publication Progress</span>
                  </>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                {totalCompleted} of {totalRequired} required fields completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{percentComplete}%</div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
          
          <Progress value={percentComplete} className="h-2" data-testid="progress-tracker" />
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className={`flex items-center gap-1.5 p-2 rounded-md ${eaDetailsCount === 4 ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300' : 'bg-muted'}`}>
              {eaDetailsCount === 4 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-bold">
                  {eaDetailsCount}
                </div>
              )}
              <span className="font-medium">EA Details: {eaDetailsCount}/4</span>
            </div>
            
            <div className={`flex items-center gap-1.5 p-2 rounded-md ${filesMediaCount === 2 ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300' : 'bg-muted'}`}>
              {filesMediaCount === 2 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-bold">
                  {filesMediaCount}
                </div>
              )}
              <span className="font-medium">Files & Media: {filesMediaCount}/2</span>
            </div>
            
            <div className={`flex items-center gap-1.5 p-2 rounded-md ${seoCount === 1 ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300' : 'bg-muted'}`}>
              {seoCount === 1 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-bold">
                  {seoCount}
                </div>
              )}
              <span className="font-medium">SEO: {seoCount}/1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublishEAFormClient() {
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Upload progress tracking
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [fileUploadSpeed, setFileUploadSpeed] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState(0);
  const [imageUploadProgress, setImageUploadProgress] = useState<{ [key: number]: number }>({});
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { requireAuth, AuthPrompt } = useAuthPrompt();

  const form = useForm<EAFormData>({
    resolver: zodResolver(eaFormSchema),
    defaultValues: {
      title: "",
      tags: [],
      customCategory: "",
      description: "",
      priceCoins: 20,
      eaFileUrl: "",
      imageUrls: [],
      slug: "",
      primaryKeyword: "",
      seoExcerpt: "",
      hashtags: []
    }
  });

  const title = form.watch("title");
  const description = form.watch("description");
  const priceCoins = form.watch("priceCoins");
  const imageUrls = form.watch("imageUrls");
  const eaFileUrl = form.watch("eaFileUrl");
  const tags = form.watch("tags");
  const customCategory = form.watch("customCategory");

  // Update SEO data when it changes
  const handleSEOUpdate = useCallback((data: SEOData) => {
    setSeoData(data);
    form.setValue("slug", data.urlSlug);
    form.setValue("primaryKeyword", data.primaryKeyword);
    form.setValue("seoExcerpt", data.seoExcerpt);
    form.setValue("hashtags", data.hashtags);
  }, [form]);

  // Enhanced EA File upload with progress tracking
  const handleEAFileUpload = async (file: File) => {
    // Validate file type
    const validExtensions = ['.ex4', '.ex5', '.mq4', '.zip'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: "Please upload .ex4, .ex5, .mq4, or .zip files only",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "EA file must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingFile(true);
    setFileUploadProgress(0);
    setFileUploadSpeed(0);
    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'ea-file');

    const xhr = new XMLHttpRequest();
    let startTime = Date.now();
    let lastLoaded = 0;

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        setFileUploadProgress(percentComplete);

        // Calculate upload speed
        const currentTime = Date.now();
        const timeDiff = (currentTime - startTime) / 1000; // seconds
        const loadedDiff = e.loaded - lastLoaded;
        const speed = loadedDiff / timeDiff; // bytes per second
        setFileUploadSpeed(speed);
        
        lastLoaded = e.loaded;
        startTime = currentTime;
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          form.setValue("eaFileUrl", data.url);
          toast({
            title: "File uploaded successfully",
            description: `${file.name} (${formatFileSize(file.size)})`,
          });
        } catch (error) {
          toast({
            title: "Upload failed",
            description: "Failed to process response",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Upload failed",
          description: "Server error occurred",
          variant: "destructive",
        });
      }
      setUploadingFile(false);
    });

    xhr.addEventListener('error', () => {
      toast({
        title: "Upload failed",
        description: "Network error occurred",
        variant: "destructive",
      });
      setUploadingFile(false);
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  };

  const { getRootProps: getFileRootProps, getInputProps: getFileInputProps, isDragActive: isFileDragActive } = useDropzone({
    accept: {
      'application/octet-stream': ['.ex4', '.ex5', '.mq4'],
      'application/zip': ['.zip']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          toast({
            title: "File too large",
            description: "EA file must be less than 10MB",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Invalid file",
            description: "Please upload a valid EA file",
            variant: "destructive",
          });
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        handleEAFileUpload(acceptedFiles[0]);
      }
    }
  });

  // Individual screenshot upload for specific slot
  const handleScreenshotUpload = async (file: File, slotIndex: number) => {
    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PNG, JPG, or WEBP images only",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Images must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setImageUploadProgress(prev => ({ ...prev, [slotIndex]: 0 }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'ea-screenshot');

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        setImageUploadProgress(prev => ({ ...prev, [slotIndex]: percentComplete }));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          const currentUrls = form.getValues("imageUrls");
          const newUrls = [...currentUrls];
          newUrls[slotIndex] = data.url;
          form.setValue("imageUrls", newUrls);
          toast({
            title: "Screenshot uploaded",
            description: `Slot ${slotIndex + 1} updated`,
          });
        } catch (error) {
          toast({
            title: "Upload failed",
            description: "Failed to process response",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Upload failed",
          description: "Server error occurred",
          variant: "destructive",
        });
      }
      setImageUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[slotIndex];
        return newProgress;
      });
    });

    xhr.addEventListener('error', () => {
      toast({
        title: "Upload failed",
        description: "Network error occurred",
        variant: "destructive",
      });
      setImageUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[slotIndex];
        return newProgress;
      });
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  };

  // Remove image from specific slot
  const removeImage = (index: number) => {
    const currentUrls = form.getValues("imageUrls");
    const newUrls = currentUrls.filter((_, i) => i !== index);
    form.setValue("imageUrls", newUrls);
    toast({
      title: "Screenshot removed",
      description: `Slot ${index + 1} cleared`,
    });
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const currentUrls = form.getValues("imageUrls");
    const newUrls = [...currentUrls];
    
    // Swap images
    const temp = newUrls[draggedIndex];
    newUrls[draggedIndex] = newUrls[dropIndex];
    newUrls[dropIndex] = temp;
    
    form.setValue("imageUrls", newUrls);
    setDraggedIndex(null);
    setDragOverIndex(null);
    
    toast({
      title: "Screenshots reordered",
      description: `Moved from slot ${draggedIndex + 1} to slot ${dropIndex + 1}`,
    });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Submit mutation
  const publishMutation = useMutation({
    mutationFn: async (data: EAFormData) => {
      // Use the first tag as the main category for backward compatibility
      const primaryCategory = data.tags[0] || "";
      
      // Sanitize HTML description before submission
      const sanitizedDescription = sanitizeRichTextHTML(data.description);
      
      return await apiRequest('POST', '/api/content', {
        title: data.title,
        description: sanitizedDescription,
        priceCoins: data.priceCoins,
        eaFileUrl: data.eaFileUrl,
        imageUrls: data.imageUrls,
        category: primaryCategory, // Use first tag as primary category
        tags: data.tags, // Send all selected categories as tags
        type: 'ea',
        status: 'pending',
        isFree: false,
        slug: data.slug,
        focusKeyword: data.primaryKeyword,
        autoMetaDescription: data.seoExcerpt,
        autoImageAltTexts: imageUrls.map((url, i) => `${title} - Screenshot ${i + 1}`)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success! 🎉",
        description: "Your EA is now pending approval. Redirecting...",
        duration: 5000,
      });
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Failed to publish",
        description: error instanceof Error ? error.message : "Failed to publish. Please try again.",
        variant: "destructive",
        duration: Infinity,
      });
    }
  });

  const onSubmit = (data: EAFormData) => {
    publishMutation.mutate(data);
  };

  // Simple authentication check - show login prompt if not authenticated
  // This avoids any complex loading states that could get stuck
  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-muted-foreground mb-4">
                Please log in to publish an EA
              </p>
              <Button 
                onClick={() => requireAuth(() => {
                  // Reload after successful auth
                  window.location.reload();
                })}
                data-testid="button-login"
              >
                Log In
              </Button>
            </CardContent>
          </Card>
        </div>
        <AuthPrompt />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-background to-muted/20 pb-20 lg:pb-8">
        {/* Page Header */}
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/publish-ea">
              <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to EA Listings
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="heading-publish-ea">
              Publish New Expert Advisor
            </h1>
            <p className="text-muted-foreground">
              Share your automated trading system with the community
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* 3-Column Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT SIDEBAR - Publishing Progress Panel */}
                <aside className="hidden lg:block lg:col-span-3">
                  <div className="sticky top-20">
                    <PublishingProgressPanel
                      formData={{
                        title,
                        tags,
                        description,
                        priceCoins,
                        eaFileUrl,
                        imageUrls,
                        primaryKeyword: seoData?.primaryKeyword || ""
                      }}
                    />
                  </div>
                </aside>

                {/* MAIN FORM CONTENT */}
                <div className="lg:col-span-6">
                  <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">EA Details</TabsTrigger>
                  <TabsTrigger value="files">Files & Media</TabsTrigger>
                  <TabsTrigger value="seo">SEO & Preview</TabsTrigger>
                </TabsList>

                {/* Tab 1: EA Details */}
                <TabsContent value="details" className="space-y-6 mt-6">
                  <ProTips
                    title="💡 Pro Tips for EA Details"
                    tips={[
                      "Include strategy type in title for better searchability (e.g., 'Scalping', 'Grid', 'Martingale')",
                      "Add backtest results and performance metrics in description to build trust",
                      "Select accurate categories - buyers filter by these to find EAs",
                      "Price competitively: research similar EAs to find the sweet spot"
                    ]}
                    defaultOpen={true}
                  />

                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>
                        Provide details about your Expert Advisor
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Title */}
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>EA Title *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="e.g., Gold Scalper Pro EA v2.5"
                                  {...field}
                                  data-testid="input-title"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                  {field.value.length}/60
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>
                              30-60 characters. Make it descriptive and keyword-rich.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Categories (Multi-select with checkbox grid) */}
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FormLabel>Categories * (Select 1-5)</FormLabel>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs">Select 1-5 categories that best describe your EA's trading strategy</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {tags.length}/5 selected
                              </span>
                            </div>
                            <FormControl>
                              <div className="space-y-4">
                                {/* Predefined Categories Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {EA_CATEGORY_OPTIONS.map((category) => {
                                    const isChecked = tags.includes(category);
                                    const isDisabled = !isChecked && tags.length >= 5;
                                    
                                    return (
                                      <div
                                        key={category}
                                        className={`flex items-center space-x-2 border rounded-lg p-3 transition-colors ${
                                          isChecked 
                                            ? 'bg-primary/10 border-primary' 
                                            : isDisabled
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-muted cursor-pointer'
                                        }`}
                                        onClick={() => {
                                          if (isDisabled) return;
                                          const newTags = isChecked
                                            ? tags.filter((t) => t !== category)
                                            : [...tags, category];
                                          field.onChange(newTags);
                                        }}
                                        data-testid={`checkbox-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
                                      >
                                        <Checkbox
                                          checked={isChecked}
                                          disabled={isDisabled}
                                          onCheckedChange={(checked) => {
                                            const newTags = checked
                                              ? [...tags, category]
                                              : tags.filter((t) => t !== category);
                                            field.onChange(newTags);
                                          }}
                                        />
                                        <label className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1">
                                          <span className="text-lg">{CATEGORY_EMOJIS[category]}</span>
                                          <span>{category}</span>
                                        </label>
                                      </div>
                                    );
                                  })}
                                  
                                  {/* Custom Category Checkbox */}
                                  <div
                                    className={`flex items-center space-x-2 border rounded-lg p-3 transition-colors ${
                                      customCategory && tags.some(t => t.startsWith('Custom:'))
                                        ? 'bg-primary/10 border-primary' 
                                        : tags.length >= 5 && !tags.some(t => t.startsWith('Custom:'))
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-muted cursor-pointer'
                                    }`}
                                    data-testid="checkbox-category-custom"
                                  >
                                    <Checkbox
                                      checked={tags.some(t => t.startsWith('Custom:'))}
                                      disabled={tags.length >= 5 && !tags.some(t => t.startsWith('Custom:'))}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          // Don't add to tags yet, wait for user to input custom name
                                        } else {
                                          // Remove custom category from tags
                                          const newTags = tags.filter(t => !t.startsWith('Custom:'));
                                          field.onChange(newTags);
                                          form.setValue('customCategory', '');
                                        }
                                      }}
                                    />
                                    <label className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1">
                                      <span className="text-lg">✨</span>
                                      <span>Custom</span>
                                    </label>
                                  </div>
                                </div>
                                
                                {/* Custom Category Input */}
                                {tags.some(t => t.startsWith('Custom:')) && (
                                  <div className="pt-2">
                                    <FormField
                                      control={form.control}
                                      name="customCategory"
                                      render={({ field: customField }) => (
                                        <FormItem>
                                          <FormLabel>Custom Category Name</FormLabel>
                                          <FormControl>
                                            <Input
                                              {...customField}
                                              placeholder="e.g., High-Frequency Trading"
                                              maxLength={50}
                                              data-testid="input-custom-category"
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                customField.onChange(value);
                                                
                                                // Update tags array with custom category
                                                if (value.length >= 3) {
                                                  const customTag = `Custom: ${value}`;
                                                  const newTags = tags.filter(t => !t.startsWith('Custom:'));
                                                  form.setValue('tags', [...newTags, customTag]);
                                                } else {
                                                  // Remove custom tag if input is too short
                                                  const newTags = tags.filter(t => !t.startsWith('Custom:'));
                                                  form.setValue('tags', newTags);
                                                }
                                              }}
                                            />
                                          </FormControl>
                                          <FormDescription>
                                            3-50 characters, alphanumeric and spaces only
                                          </FormDescription>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                )}

                                {/* Selected Categories Badges */}
                                {tags.length > 0 && (
                                  <div className="pt-2">
                                    <p className="text-sm font-medium mb-2">Selected Categories:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {tags.map((tag, index) => (
                                        <Badge
                                          key={index}
                                          variant="secondary"
                                          className="gap-1"
                                          data-testid={`badge-selected-${index}`}
                                        >
                                          {tag.startsWith('Custom:') ? '✨' : CATEGORY_EMOJIS[tag] || ''}
                                          {tag}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newTags = tags.filter((_, i) => i !== index);
                                              field.onChange(newTags);
                                              if (tag.startsWith('Custom:')) {
                                                form.setValue('customCategory', '');
                                              }
                                            }}
                                            className="ml-1 hover:text-destructive"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormDescription>
                              Select 1-5 categories that best describe your EA's trading strategy
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Description */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormLabel>Description *</FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">Include key features, strategy type, and performance metrics to attract buyers</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <FormControl>
                              <RichTextEditor
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Describe your EA's features, trading strategy, recommended settings, backtest results, etc..."
                              />
                            </FormControl>
                            <FormDescription>
                              200-2000 characters (text only, HTML tags excluded). Include key features, strategy, and performance metrics. You can format text and add up to 5 inline images.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Price */}
                      <FormField
                        control={form.control}
                        name="priceCoins"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormLabel>Price (Gold Coins) *</FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">Minimum 20 coins - price based on features, performance, and competition</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                min={20}
                                max={1000}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-price"
                              />
                            </FormControl>
                            <FormDescription>
                              20-1000 coins—users pay this to download your EA.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab 2: Files & Media */}
                <TabsContent value="files" className="space-y-6 mt-6">
                  <ProTips
                    title="💡 Pro Tips for Files & Media"
                    tips={[
                      "First screenshot will be the cover image - make it eye-catching!",
                      "Include MT4/MT5 trading results and backtest reports for credibility",
                      "Show strategy performance charts and profit curves",
                      "Drag to reorder screenshots - put your best ones first"
                    ]}
                  />

                  {/* Enhanced EA File Upload Zone */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileCode className="h-5 w-5" />
                        EA File Upload
                      </CardTitle>
                      <CardDescription>
                        Upload your Expert Advisor file (.ex4, .ex5, .mq4, or .zip) - Maximum 10MB
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        {...getFileRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                          isFileDragActive 
                            ? 'border-primary bg-primary/10 scale-[1.02]' 
                            : eaFileUrl && !uploadingFile
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                        }`}
                        data-testid="dropzone-ea-file"
                      >
                        <input {...getFileInputProps()} />
                        
                        {uploadingFile ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-center">
                              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                            </div>
                            <div className="space-y-2">
                              <p className="font-medium">Uploading {uploadedFileName}...</p>
                              <Progress value={fileUploadProgress} className="h-2" />
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>{fileUploadProgress}% complete</span>
                                {fileUploadSpeed > 0 && (
                                  <span>{formatFileSize(fileUploadSpeed)}/s</span>
                                )}
                              </div>
                              {uploadedFileSize > 0 && fileUploadProgress < 100 && (
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(uploadedFileSize * (fileUploadProgress / 100))} of {formatFileSize(uploadedFileSize)}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : eaFileUrl ? (
                          <div className="space-y-3">
                            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                            <div>
                              <p className="font-semibold text-lg mb-1">✓ EA File Uploaded Successfully</p>
                              <p className="text-sm text-muted-foreground font-mono">
                                {uploadedFileName || eaFileUrl.split('/').pop()}
                              </p>
                              {uploadedFileSize > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Size: {formatFileSize(uploadedFileSize)}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Are you sure you want to replace the uploaded EA file?")) {
                                  form.setValue("eaFileUrl", "");
                                  setUploadedFileName("");
                                  setUploadedFileSize(0);
                                  setFileUploadProgress(0);
                                }
                              }}
                              className="min-w-[120px]"
                              data-testid="button-replace-ea-file"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Replace File
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Upload className="h-16 w-16 mx-auto text-muted-foreground" />
                            <div>
                              <p className="font-semibold text-lg mb-1">
                                Drop .ex4, .ex5, .mq4, or .zip file here
                              </p>
                              <p className="text-sm text-muted-foreground">
                                or click to browse your files
                              </p>
                            </div>
                            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                              <span>✓ Max 10MB</span>
                              <span>•</span>
                              <span>✓ Single file only</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {form.formState.errors.eaFileUrl && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {form.formState.errors.eaFileUrl.message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* 5-Slot Screenshot Manager */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Screenshots (Optional)
                      </CardTitle>
                      <CardDescription>
                        Upload up to 5 screenshots. First image will be the cover. Drag to reorder.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Helpful Tips */}
                      <Alert>
                        <Sparkles className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          💡 <strong>Pro tip:</strong> Include MT4/MT5 trading results, backtest reports, and strategy performance charts for better engagement!
                        </AlertDescription>
                      </Alert>

                      {/* 5 Screenshot Slots */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[0, 1, 2, 3, 4].map((slotIndex) => {
                          const imageUrl = imageUrls[slotIndex];
                          const isUploading = imageUploadProgress[slotIndex] !== undefined;
                          const uploadProgress = imageUploadProgress[slotIndex] || 0;
                          const isDraggedOver = dragOverIndex === slotIndex;
                          const isDragging = draggedIndex === slotIndex;

                          return (
                            <div
                              key={slotIndex}
                              className={`relative aspect-[4/3] rounded-lg border-2 transition-all ${
                                isDraggedOver
                                  ? 'border-primary bg-primary/10 scale-105'
                                  : imageUrl
                                  ? 'border-muted bg-muted/20'
                                  : 'border-dashed border-muted-foreground/25'
                              } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
                              data-testid={`screenshot-slot-${slotIndex}`}
                            >
                              {isUploading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-background">
                                  <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-2" />
                                  <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                                  <Progress value={uploadProgress} className="w-full h-1 mt-2" />
                                </div>
                              ) : imageUrl ? (
                                <div
                                  className="relative h-full group cursor-move"
                                  draggable
                                  onDragStart={() => handleDragStart(slotIndex)}
                                  onDragOver={(e) => handleDragOver(e, slotIndex)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, slotIndex)}
                                  onDragEnd={handleDragEnd}
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`Screenshot ${slotIndex + 1}`}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                  
                                  {/* Slot Number Badge */}
                                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                                    #{slotIndex + 1}
                                    {slotIndex === 0 && " COVER"}
                                  </div>

                                  {/* Delete Button - Shows on Hover */}
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`Remove screenshot from slot ${slotIndex + 1}?`)) {
                                        removeImage(slotIndex);
                                      }
                                    }}
                                    data-testid={`button-delete-screenshot-${slotIndex}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>

                                  {/* Drag Handle Indicator */}
                                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-70 transition-opacity">
                                    <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                                      Drag to reorder
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <label
                                  htmlFor={`screenshot-upload-${slotIndex}`}
                                  className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors p-4"
                                  onDragOver={(e) => handleDragOver(e, slotIndex)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const files = e.dataTransfer.files;
                                    if (files.length > 0) {
                                      handleScreenshotUpload(files[0], slotIndex);
                                    }
                                    setDragOverIndex(null);
                                  }}
                                >
                                  <input
                                    id={`screenshot-upload-${slotIndex}`}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleScreenshotUpload(file, slotIndex);
                                      }
                                      e.target.value = '';
                                    }}
                                    data-testid={`input-screenshot-${slotIndex}`}
                                  />
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="h-12 w-12 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
                                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs font-medium text-muted-foreground">
                                        Slot {slotIndex + 1}
                                      </p>
                                      <p className="text-xs text-muted-foreground/70">
                                        Click or Drop
                                      </p>
                                    </div>
                                  </div>
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Screenshot Stats & Info */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                        <span>
                          {imageUrls.length} / 5 screenshots uploaded
                          {imageUrls.length === 5 && " (Maximum reached)"}
                        </span>
                        <span className="text-xs">PNG, JPG, WEBP • Max 5MB each</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab 3: SEO & Preview */}
                <TabsContent value="seo" className="space-y-6 mt-6">
                  <ProTips
                    title="💡 Pro Tips for SEO & Preview"
                    tips={[
                      "Use keywords buyers search for: 'scalping', 'grid', 'martingale', 'low drawdown'",
                      "SEO excerpt appears in search results - make it compelling",
                      "Preview shows how your EA looks to buyers - check it carefully",
                      "Good SEO helps your EA rank higher in marketplace search"
                    ]}
                  />

                  {/* Split-screen layout: AutoSEOPanel on left, LivePreview on right (desktop) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: SEO Panel */}
                    <div className="space-y-6">
                      <AutoSEOPanel
                        title={title}
                        body={description}
                        imageUrls={imageUrls}
                        onSEOUpdate={handleSEOUpdate}
                      />

                      {/* SEO Preview */}
                      <SEOPreview
                        title={title}
                        seoExcerpt={seoData?.seoExcerpt || ""}
                        primaryKeyword={seoData?.primaryKeyword || ""}
                        body={description}
                      />
                    </div>

                    {/* Right Column: Live Preview */}
                    <div className="lg:sticky lg:top-6 lg:self-start">
                      <LivePreview
                        title={title}
                        tags={tags}
                        priceCoins={priceCoins}
                        description={description}
                        imageUrls={imageUrls}
                      />
                    </div>
                  </div>
                </TabsContent>
                  </Tabs>

                  {/* Submit Buttons */}
                  <Card className="mt-6">
                    <CardContent className="pt-6 flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowPreview(!showPreview)}
                        data-testid="button-toggle-preview"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {showPreview ? "Hide" : "Show"} Preview
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={publishMutation.isPending || !eaFileUrl}
                        data-testid="button-publish-ea"
                      >
                        {publishMutation.isPending ? (
                          <>
                            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Publish EA
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Preview Section */}
                  {showPreview && title && description && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Preview</CardTitle>
                        <CardDescription>
                          This is how your EA will appear to users
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg p-6 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h2 className="text-2xl font-bold mb-2">{title}</h2>
                              {customCategory && <Badge>{customCategory}</Badge>}
                            </div>
                            <Badge variant="default" className="text-lg px-4 py-2">
                              {priceCoins} ₡
                            </Badge>
                          </div>
                          
                          {imageUrls.length > 0 && (
                            <img
                              src={imageUrls[0]}
                              alt={title}
                              className="w-full aspect-video object-cover rounded-lg"
                            />
                          )}
                          
                          <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
                          
                          <Button className="w-full" size="lg" disabled>
                            Download for {priceCoins} ₡
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* RIGHT SIDEBAR - Engagement Panel */}
                <aside className="hidden lg:block lg:col-span-3">
                  <div className="sticky top-20 space-y-4">
                    <QuickTipsCard />
                    <LiveStatsCard
                      formData={{
                        title,
                        tags,
                        description,
                        priceCoins,
                        imageUrls
                      }}
                    />
                    <TopPerformingEAsCard />
                  </div>
                </aside>
              </div>

              {/* MOBILE: Bottom Progress Bar */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t p-4 z-40 shadow-lg">
                <div className="flex items-center gap-3">
                  <Progress 
                    value={(() => {
                      const descriptionLength = countTextCharacters(description);
                      const checks = [
                        title.length >= 30 && title.length <= 60,
                        tags.length >= 1 && tags.length <= 5,
                        descriptionLength >= 200 && descriptionLength <= 2000,
                        eaFileUrl.length > 0,
                        imageUrls.length >= 1,
                        priceCoins >= 20,
                        (seoData?.primaryKeyword || "").length > 0
                      ];
                      const completedCount = checks.filter(Boolean).length;
                      return Math.round((completedCount / 7) * 100);
                    })()} 
                    className="flex-1" 
                  />
                  <span className="text-sm font-medium whitespace-nowrap">
                    {(() => {
                      const descriptionLength = countTextCharacters(description);
                      const checks = [
                        title.length >= 30 && title.length <= 60,
                        tags.length >= 1 && tags.length <= 5,
                        descriptionLength >= 200 && descriptionLength <= 2000,
                        eaFileUrl.length > 0,
                        imageUrls.length >= 1,
                        priceCoins >= 20,
                        (seoData?.primaryKeyword || "").length > 0
                      ];
                      const completedCount = checks.filter(Boolean).length;
                      return Math.round((completedCount / 7) * 100);
                    })()}%
                  </span>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </main>
      <EnhancedFooter />
      <AuthPrompt />
    </>
  );
}
