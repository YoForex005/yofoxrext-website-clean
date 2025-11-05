"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import DOMPurify from 'isomorphic-dompurify';
import type { ForumCategory } from "@shared/schema";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import LeftEngagementSidebar from "./LeftEngagementSidebar";
import RightEngagementSidebar from "./RightEngagementSidebar";
import AutoSEOPanel, { type SEOData } from "@/components/AutoSEOPanel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  Check, 
  Copy, 
  Share2, 
  Upload,
  X,
  Coins,
  Eye,
  Save,
  Send,
  Hash,
  Clock,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  ImageIcon,
  Link2,
  FileText,
  File,
  Paperclip,
  DollarSign,
  Download,
  MessageSquare,
  Loader2,
  Sparkles,
  HelpCircle,
  TrendingUp,
  Users,
  Lightbulb,
  Code,
  ChevronDown,
  Settings2,
  Zap,
  Target,
  Award,
  BookOpen,
  Globe,
  Calendar,
  BarChart3,
  Shield,
  Rocket,
  Star,
  Layers,
  Filter,
  Search,
  ArrowRight,
  Info,
  Plus,
  Minus,
  CheckCircle,
  Circle
} from "lucide-react";

// Thread types configuration with improved descriptions
const threadTypes = [
  {
    value: "discussion",
    icon: MessageSquare,
    color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/30",
    title: "Discussion",
    description: "Start a conversation about trading strategies or market trends"
  },
  {
    value: "question",
    icon: HelpCircle,
    color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-500/30",
    title: "Question",
    description: "Ask the community for help or advice"
  },
  {
    value: "ea-review",
    icon: Code,
    color: "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/30",
    title: "EA Review",
    description: "Share and review Expert Advisors or automated strategies"
  },
  {
    value: "analysis",
    icon: BarChart3,
    color: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/30",
    title: "Analysis",
    description: "Share technical or fundamental market analysis"
  },
  {
    value: "education",
    icon: BookOpen,
    color: "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/30",
    title: "Education",
    description: "Create educational content or tutorials"
  },
  {
    value: "announcement",
    icon: TrendingUp,
    color: "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/30",
    title: "Announcement",
    description: "Share important news or updates"
  }
];

// File attachment interface
interface FileAttachment {
  id: string;
  file: File;
  url?: string;
  price: number;
  uploading?: boolean;
  error?: string;
}

// Enhanced form validation schema
const threadFormSchema = z.object({
  threadType: z.string().default("discussion"),
  title: z.string()
    .min(15, "Add 3-4 more words to help others understand")
    .max(90, "Keep it under 90 characters")
    .refine(
      (val) => {
        const upperCount = (val.match(/[A-Z]/g) || []).length;
        const letterCount = (val.match(/[a-zA-Z]/g) || []).length;
        return letterCount === 0 || upperCount / letterCount < 0.5;
      },
      { message: "Avoid ALL CAPS - it's easier to read in normal case" }
    ),
  body: z.string().min(100, "Content must be at least 100 characters"), // Plain text content
  contentHtml: z.string().min(100, "Content must be at least 100 characters"), // Rich HTML content
  categorySlug: z.string().min(1, "Please select a category"),
  hashtags: z.array(z.string()).max(10).default([]),
  attachments: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    size: z.number(),
    url: z.string(),
    mimeType: z.string(),
    price: z.number().min(0).max(10000),
    downloads: z.number().default(0)
  })).default([]),
});

type ThreadFormData = z.infer<typeof threadFormSchema>;

interface EnhancedThreadComposeClientProps {
  categories: ForumCategory[];
}

// Modern chip/tag selector component
function ChipSelector({ 
  options, 
  selected, 
  onSelect, 
  placeholder = "Select items...",
  maxItems = 10,
  icon
}: { 
  options: string[];
  selected: string[];
  onSelect: (items: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  icon?: any;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter(opt => 
    !selected.includes(opt) && 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onSelect(selected.filter(s => s !== option));
    } else if (selected.length < maxItems) {
      onSelect([...selected, option]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 border rounded-lg bg-background">
        {selected.length === 0 ? (
          <span className="text-muted-foreground text-sm py-1">{placeholder}</span>
        ) : (
          selected.map(item => (
            <Badge 
              key={item} 
              variant="secondary"
              className="gap-1 px-3 py-1 hover:bg-secondary/80 transition-colors animate-in fade-in-50 zoom-in-95 max-w-[200px]"
            >
              {icon && <icon className="w-3 h-3 flex-shrink-0" />}
              <span className="truncate">{item}</span>
              <button
                type="button"
                onClick={() => toggleOption(item)}
                className="ml-1 hover:text-destructive transition-colors flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isOpen ? 'Hide' : 'Show'} available options ({filteredOptions.length})
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {filteredOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleOption(option)}
                  className="text-left px-3 py-2 text-sm border rounded-lg hover:bg-accent transition-colors overflow-hidden"
                  title={option}
                >
                  <span className="block truncate">{option}</span>
                </button>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Enhanced formatting toolbar
function FormattingToolbar({ 
  editor, 
  isUploadingImage, 
  onImageUpload 
}: { 
  editor: any;
  isUploadingImage: boolean;
  onImageUpload: () => void;
}) {
  if (!editor) return null;

  const buttonClass = "relative h-9 w-9 p-0 transition-all duration-200";
  const activeClass = "bg-primary text-primary-foreground shadow-md scale-105";

  return (
    <div className="flex items-center gap-0.5 p-2 border-b bg-gradient-to-r from-muted/30 to-muted/10 rounded-t-lg">
      <TooltipProvider>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('bold') ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(buttonClass, editor.isActive('bold') && activeClass)}
                data-testid="button-bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bold (Ctrl+B)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('italic') ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(buttonClass, editor.isActive('italic') && activeClass)}
                data-testid="button-italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Italic (Ctrl+I)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('underline') ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn(buttonClass, editor.isActive('underline') && activeClass)}
                data-testid="button-underline"
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Underline (Ctrl+U)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
      
      <Separator orientation="vertical" className="h-6 mx-2" />
      
      <TooltipProvider>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn(buttonClass, editor.isActive('heading', { level: 1 }) && activeClass)}
                data-testid="button-h1"
              >
                <Heading1 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Heading 1</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(buttonClass, editor.isActive('heading', { level: 2 }) && activeClass)}
                data-testid="button-h2"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Heading 2</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
      
      <Separator orientation="vertical" className="h-6 mx-2" />
      
      <TooltipProvider>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(buttonClass, editor.isActive('bulletList') && activeClass)}
                data-testid="button-bullet-list"
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bullet List</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(buttonClass, editor.isActive('orderedList') && activeClass)}
                data-testid="button-ordered-list"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Numbered List</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
      
      <div className="ml-auto">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onImageUpload}
          disabled={isUploadingImage}
          className="h-9 px-4 bg-primary/10 hover:bg-primary/20 font-medium transition-all hover:scale-105"
          data-testid="button-insert-image"
        >
          {isUploadingImage ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4 mr-2" />
              Insert Image
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Enhanced file attachment component
function FileAttachmentSection({ 
  attachments, 
  onAttachmentsChange 
}: { 
  attachments: FileAttachment[]; 
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
}) {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 10) {
      toast({
        title: "Too many files",
        description: "Maximum 10 attachments allowed",
        variant: "destructive",
      });
      return;
    }

    const newAttachments: FileAttachment[] = [];
    
    for (const file of Array.from(files)) {
      // Check file size (20MB max)
      const maxFileSize = 20 * 1024 * 1024; // 20MB in bytes
      if (file.size > maxFileSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 20MB limit`,
          variant: "destructive",
        });
        continue;
      }

      const id = Math.random().toString(36).substring(7);
      newAttachments.push({
        id,
        file,
        price: 0,
        uploading: true,
      });
    }

    if (newAttachments.length === 0) return;

    onAttachmentsChange([...attachments, ...newAttachments]);

    // Upload files
    for (const attachment of newAttachments) {
      const formData = new FormData();
      formData.append('files', attachment.file);

      try {
        setUploadingFiles(prev => [...prev, attachment.id]);
        
        console.log(`[FileUpload] Starting upload for: ${attachment.file.name}`);
        
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        // Parse response regardless of status
        const responseText = await res.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('[FileUpload] Failed to parse response:', responseText);
          data = { error: responseText };
        }

        if (res.ok) {
          console.log(`[FileUpload] Upload successful for: ${attachment.file.name}`, data);
          const url = data.urls?.[0];
          
          if (!url) {
            console.error('[FileUpload] No URL returned from server:', data);
            throw new Error("Server did not return file URL");
          }
          
          onAttachmentsChange(prev => prev.map(a => 
            a.id === attachment.id 
              ? { ...a, url, uploading: false }
              : a
          ));
          
          toast({
            title: "File uploaded",
            description: `${attachment.file.name} uploaded successfully`,
            variant: "default",
          });
        } else {
          // Handle different error scenarios
          console.error(`[FileUpload] Upload failed for: ${attachment.file.name}`, {
            status: res.status,
            statusText: res.statusText,
            response: data
          });

          let errorMessage = "Upload failed";
          
          // Parse error message based on status code
          if (res.status === 401) {
            errorMessage = "Please log in to upload files";
          } else if (res.status === 400) {
            errorMessage = data.error || "Invalid file or request";
          } else if (res.status === 413) {
            errorMessage = "File size too large (max 20MB)";
          } else if (res.status === 415) {
            errorMessage = "File type not supported";
          } else if (res.status === 500) {
            errorMessage = data.error || "Server error - please try again";
          } else if (data.error) {
            errorMessage = data.error;
          }

          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        console.error(`[FileUpload] Error uploading ${attachment.file.name}:`, error);
        
        onAttachmentsChange(prev => prev.map(a => 
          a.id === attachment.id 
            ? { ...a, uploading: false, error: errorMessage }
            : a
        ));
        
        toast({
          title: "Upload failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setUploadingFiles(prev => prev.filter(id => id !== attachment.id));
      }
    }
  };

  const handlePriceChange = (id: string, price: number) => {
    onAttachmentsChange(attachments.map(a => 
      a.id === id ? { ...a, price } : a
    ));
  };

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(a => a.id !== id));
  };

  const totalPotentialEarnings = attachments.reduce((sum, a) => sum + a.price, 0);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return <FileText className="h-5 w-5" />;
    if (['zip', 'rar', '7z'].includes(ext || '')) return <File className="h-5 w-5" />;
    if (['ex4', 'ex5', 'mq4', 'mq5'].includes(ext || '')) return <Code className="h-5 w-5" />;
    return <Paperclip className="h-5 w-5" />;
  };

  return (
    <Card className="border-2 bg-gradient-to-br from-background to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-primary" />
            File Attachments
          </div>
          {totalPotentialEarnings > 0 && (
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 animate-pulse">
              <Coins className="h-3 w-3 mr-1" />
              Potential: {totalPotentialEarnings} Sweets
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Share resources, indicators, or documentation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer group"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
              <Upload className="h-12 w-12 text-primary relative z-10 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <p className="text-base font-medium">Click to upload files</p>
              <p className="text-sm text-muted-foreground mt-1">
                PDFs, ZIPs, EAs, indicators (max 20MB per file)
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.zip,.rar,.7z,.ex4,.ex5,.mq4,.mq5,.set,.csv"
          />
        </div>

        {attachments.length > 0 && (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div 
                key={attachment.id} 
                className={cn(
                  "relative p-4 border-2 rounded-xl bg-card transition-all animate-in fade-in-50 zoom-in-95",
                  attachment.error ? "border-destructive/50 bg-destructive/5" : "hover:shadow-md"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    attachment.error ? "bg-destructive/20" : "bg-primary/10"
                  )}>
                    {getFileIcon(attachment.file.name)}
                  </div>
                  
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-medium truncate" title={attachment.file.name}>
                      {attachment.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(attachment.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  {!attachment.error && !attachment.uploading && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1">
                      <Coins className="h-4 w-4 text-yellow-600" />
                      <Input
                        type="number"
                        min="0"
                        max="10000"
                        value={attachment.price}
                        onChange={(e) => handlePriceChange(attachment.id, parseInt(e.target.value) || 0)}
                        className="w-20 h-7 text-sm bg-transparent border-0 focus-visible:ring-0"
                        placeholder="0"
                        disabled={attachment.uploading}
                      />
                    </div>
                  )}

                  {attachment.uploading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Uploading...</span>
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAttachment(attachment.id)}
                    disabled={attachment.uploading}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {attachment.error && (
                  <div className="mt-2 flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm font-medium">{attachment.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Enhanced character counter with visual feedback
function CharacterCounter({ current, min, max }: { current: number; min?: number; max: number }) {
  const percentage = (current / max) * 100;
  const isValid = (!min || current >= min) && current <= max;
  const isTooShort = min && current < min;
  const isNearLimit = current > max * 0.8;
  
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-32 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "absolute left-0 top-0 h-full transition-all duration-300",
            isValid && !isNearLimit && "bg-green-500",
            isNearLimit && isValid && "bg-yellow-500",
            !isValid && "bg-red-500"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className={cn(
        "text-xs font-medium transition-colors",
        isValid && !isNearLimit && "text-green-600",
        isNearLimit && isValid && "text-yellow-600",
        !isValid && "text-red-600"
      )}>
        {current}/{max}
        {isTooShort && <span className="ml-1">({min - current} more)</span>}
      </span>
    </div>
  );
}

// Enhanced progress indicator with clickable steps
function EnhancedProgressIndicator({ 
  currentStep, 
  totalSteps,
  onStepClick,
  steps
}: { 
  currentStep: number; 
  totalSteps: number;
  onStepClick?: (step: number) => void;
  steps: { title: string; description: string; icon: any }[];
}) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute left-0 right-0 top-8 h-0.5 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
        
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const Icon = step.icon;
          
          return (
            <div 
              key={stepNumber}
              className="relative z-10 flex flex-col items-center cursor-pointer group"
              onClick={() => onStepClick && stepNumber <= currentStep && onStepClick(stepNumber)}
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center font-semibold transition-all duration-300 shadow-lg",
                  isActive && "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/20",
                  isCompleted && "bg-primary/20 text-primary hover:scale-105",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-7 h-7" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              <div className="mt-3 text-center">
                <p className={cn(
                  "font-semibold text-sm transition-colors",
                  isActive && "text-primary",
                  !isActive && "text-muted-foreground"
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[120px]">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EnhancedThreadComposeClient({ categories }: EnhancedThreadComposeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { requireAuth, AuthPrompt, isAuthenticating } = useAuthPrompt("create a thread");
  
  const [currentStep, setCurrentStep] = useState(1);
  const [hashtagInput, setHashtagInput] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [quickStartMode, setQuickStartMode] = useState(true);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  
  // Pre-select category from URL param
  const categoryParam = searchParams?.get("category") || "";
  
  // Group categories by parent/subcategory structure
  const parentCategories = categories.filter(c => !c.parentSlug);
  const getCategorySubcategories = (parentSlug: string) => 
    categories.filter(c => c.parentSlug === parentSlug);

  // Steps configuration
  const steps = [
    {
      title: "Basics",
      description: "Type & content",
      icon: FileText
    },
    {
      title: "Enhance",
      description: "Files & pricing",
      icon: Sparkles
    },
    {
      title: "Review",
      description: "Preview & post",
      icon: CheckCircle
    }
  ];

  // Form setup
  const form = useForm<ThreadFormData>({
    resolver: zodResolver(threadFormSchema),
    defaultValues: {
      threadType: "discussion",
      title: "",
      body: "", // Plain text content
      contentHtml: "", // Rich HTML content
      categorySlug: categoryParam || "",
      hashtags: [],
      attachments: [],
    },
  });

  const titleLength = form.watch("title").length;
  const contentHtml = form.watch("contentHtml");
  
  // Validation helpers
  const canProceedStep1 = 
    titleLength >= 10 && 
    form.watch("categorySlug") && 
    editor?.getText().length >= 20;

  const isFormValid = canProceedStep1;

  // Initialize TipTap editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'tiptap-image max-w-full h-auto rounded-lg my-4 mx-auto block cursor-move hover:shadow-lg transition-shadow',
          style: 'max-height: 500px; object-fit: contain;',
          loading: 'lazy',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your amazing content...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const files = Array.from(event.dataTransfer.files);
          const imageFiles = files.filter(file => file.type.startsWith('image/'));
          
          if (imageFiles.length > 0) {
            event.preventDefault();
            setIsDragging(false);
            
            imageFiles.forEach(async (file) => {
              await handleImageUpload(file);
            });
            
            return true;
          }
        }
        return false;
      },
      handleDOMEvents: {
        dragover: (view, event) => {
          event.preventDefault();
          if (!isDragging && event.dataTransfer?.types.includes('Files')) {
            setIsDragging(true);
          }
          return false;
        },
        dragleave: (view, event) => {
          if (isDragging) {
            const rect = view.dom.getBoundingClientRect();
            if (
              event.clientX <= rect.left ||
              event.clientX >= rect.right ||
              event.clientY <= rect.top ||
              event.clientY >= rect.bottom
            ) {
              setIsDragging(false);
            }
          }
          return false;
        },
        drop: () => {
          setIsDragging(false);
          return false;
        },
        paste: async (view, event) => {
          const items = event.clipboardData?.items;
          if (items) {
            for (const item of Array.from(items)) {
              if (item.type.startsWith('image/')) {
                event.preventDefault();
                const file = item.getAsFile();
                if (file) {
                  await handleImageUpload(file);
                }
                return true;
              }
            }
          }
          return false;
        },
      },
    },
  });

  // Update form when editor content changes
  useEffect(() => {
    if (editor) {
      const updateContent = () => {
        // Set both plain text and HTML content
        form.setValue("body", editor.getText()); // Plain text for backend
        form.setValue("contentHtml", editor.getHTML()); // Rich HTML for display
      };
      editor.on('update', updateContent);
      return () => {
        editor.off('update', updateContent);
      };
    }
  }, [editor, form]);

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Images must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('files', file);

    try {
      setIsUploadingImage(true);
      
      const res = await fetch("/api/upload/simple", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        const imageUrl = data.urls?.[0];
        if (imageUrl && editor) {
          editor.chain()
            .focus()
            .setImage({ 
              src: imageUrl,
              alt: file.name,
              title: file.name,
            })
            .run();
          toast({
            title: "Image uploaded!",
            description: "Image inserted at cursor position",
          });
        } else {
          throw new Error("No image URL returned");
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${res.status}`);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Trigger file picker for image upload
  const triggerImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await handleImageUpload(file);
      }
    };
    input.click();
  };

  // Hashtag management
  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !form.watch("hashtags").includes(tag) && form.watch("hashtags").length < 10) {
      form.setValue("hashtags", [...form.watch("hashtags"), tag]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    form.setValue("hashtags", form.watch("hashtags").filter(t => t !== tag));
  };

  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: async (data: ThreadFormData) => {
      await requireAuth();
      
      // Use the body field directly from the form data (already extracted by editor.getText())
      const threadData = {
        ...data,
        body: data.body, // Plain text content from editor.getText()
        contentHtml: data.contentHtml, // Rich HTML content from editor.getHTML()
        attachments: attachments.map(a => ({
          id: a.id,
          filename: a.file.name,
          size: a.file.size,
          url: a.url || '',
          mimeType: a.file.type,
          price: a.price,
          downloads: 0
        }))
      };

      return apiRequest("/api/threads", {
        method: "POST",
        body: JSON.stringify(threadData),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Thread created!",
        description: "Your thread has been published successfully.",
      });
      
      // Redirect to the newly created thread
      if (data.thread?.slug && data.thread?.categorySlug) {
        router.push(`/thread/${data.thread.categorySlug}/${data.thread.slug}`);
      } else if (data.thread?.slug) {
        // Fallback if categorySlug is missing
        router.push(`/thread/${data.thread.slug}`);
      } else {
        // Fallback to discussions page
        router.push("/discussions");
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to create thread",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ThreadFormData) => {
    createThreadMutation.mutate(data);
  };

  const handleStepClick = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          {/* Main Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-in fade-in-50 zoom-in-95">
              Create New Thread
            </h1>
            <p className="text-muted-foreground mt-2">
              Share your knowledge and connect with the trading community
            </p>
            
            {/* Quick Start Toggle */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <Label htmlFor="quick-start" className="text-sm font-medium">
                Quick Start Mode
              </Label>
              <Button
                id="quick-start"
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickStartMode(!quickStartMode)}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors",
                  quickStartMode ? "bg-primary" : "bg-muted"
                )}
              >
                <div className={cn(
                  "absolute w-5 h-5 bg-background rounded-full transition-transform",
                  quickStartMode ? "translate-x-6" : "translate-x-0.5"
                )} />
              </Button>
            </div>
          </div>

          {/* Progress Indicator */}
          <EnhancedProgressIndicator 
            currentStep={currentStep} 
            totalSteps={3}
            onStepClick={handleStepClick}
            steps={steps}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr,320px] gap-6 max-w-[1600px] mx-auto">
            {/* Left Sidebar */}
            <div className="hidden lg:block">
              <div className="lg:sticky lg:top-[88px]">
                <LeftEngagementSidebar />
              </div>
            </div>

            {/* Main Form */}
            <div className="w-full">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* STEP 1: Basic Information */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2">
                      {/* Basic Fields Card */}
                      <Card className="border-2 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Thread Details
                          </CardTitle>
                          <CardDescription>
                            Add a compelling title and rich content
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Category Selection */}
                          <FormField
                            control={form.control}
                            name="categorySlug"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  Category
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-11 text-base">
                                      <SelectValue placeholder="Select a category..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="max-h-[300px]">
                                    {parentCategories.map((parent) => {
                                      const subcategories = getCategorySubcategories(parent.slug);
                                      
                                      return [
                                        <SelectItem 
                                          key={parent.slug} 
                                          value={parent.slug}
                                          className="py-3"
                                        >
                                          <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            <span className="font-medium">{parent.name}</span>
                                          </div>
                                        </SelectItem>,
                                        ...subcategories.map(subcat => (
                                          <SelectItem 
                                            key={subcat.slug} 
                                            value={subcat.slug}
                                            className="pl-8 py-2"
                                          >
                                            <div>
                                              <span className="font-medium">↳ {subcat.name}</span>
                                              <span className="text-xs text-muted-foreground block">
                                                {subcat.description}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))
                                      ];
                                    }).flat()}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Title */}
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center justify-between">
                                  <span className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Title
                                  </span>
                                  <CharacterCounter current={titleLength} min={15} max={90} />
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="What's your XAUUSD scalping rule that actually works?"
                                    className="text-lg h-12 overflow-wrap-anywhere"
                                    data-testid="input-title"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Rich Text Editor */}
                          <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              Your story or question
                            </Label>
                            <div 
                              className={cn(
                                "border-2 rounded-xl overflow-hidden transition-all",
                                isDragging && "border-primary shadow-lg ring-4 ring-primary/10"
                              )}
                            >
                              <FormattingToolbar 
                                editor={editor} 
                                isUploadingImage={isUploadingImage}
                                onImageUpload={triggerImageUpload}
                              />
                              <div className="relative">
                                <EditorContent 
                                  editor={editor} 
                                  className="min-h-[300px]"
                                />
                                {isDragging && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm pointer-events-none">
                                    <div className="text-center p-6 bg-background/90 rounded-lg border-2 border-dashed border-primary">
                                      <Upload className="h-12 w-12 mx-auto mb-2 text-primary animate-bounce" />
                                      <p className="text-lg font-semibold text-primary">Drop images here</p>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Images will be uploaded and inserted at cursor
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            {editor && (
                              <div className="flex justify-between text-xs">
                                <span className={cn(
                                  "transition-colors",
                                  editor.getText().length < 150 ? "text-red-500" : "text-green-500"
                                )}>
                                  {editor.getText().length} characters
                                  {editor.getText().length >= 150 && (
                                    <CheckCircle className="inline h-3 w-3 ml-1" />
                                  )}
                                </span>
                                <span className="text-muted-foreground">
                                  💡 Drag & drop or paste images directly
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Advanced Options */}
                          {!quickStartMode && (
                            <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
                              <CollapsibleTrigger asChild>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="w-full justify-between"
                                >
                                  <span className="flex items-center gap-2">
                                    <Settings2 className="h-4 w-4" />
                                    Advanced Options
                                  </span>
                                  <ChevronDown className={cn(
                                    "h-4 w-4 transition-transform",
                                    showAdvancedOptions && "rotate-180"
                                  )} />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-4 space-y-4">
                                {/* Hashtags */}
                                <div className="space-y-3">
                                  <Label className="flex items-center gap-2">
                                    <Hash className="h-4 w-4" />
                                    Hashtags (optional)
                                  </Label>
                                  <div className="flex gap-2">
                                    <Input
                                      value={hashtagInput}
                                      onChange={(e) => setHashtagInput(e.target.value)}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          addHashtag();
                                        }
                                      }}
                                      placeholder="Add hashtag..."
                                      className="flex-1"
                                    />
                                    <Button
                                      type="button"
                                      onClick={addHashtag}
                                      variant="secondary"
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      Add
                                    </Button>
                                  </div>
                                  {form.watch("hashtags").length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {form.watch("hashtags").map((tag) => (
                                        <Badge 
                                          key={tag} 
                                          variant="secondary"
                                          className="hashtag-badge gap-1 px-3 py-1 animate-in fade-in-50 zoom-in-95"
                                        >
                                          <span className="truncate">#{tag}</span>
                                          <button
                                            type="button"
                                            onClick={() => removeHashtag(tag)}
                                            className="ml-1 hover:text-destructive transition-colors flex-shrink-0"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* STEP 2: Enhance with SEO & File Attachments */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2">
                      {/* SEO Optimization Section */}
                      <AutoSEOPanel
                        title={form.watch("title")}
                        body={editor?.getText() || ""}
                        imageUrls={[]}
                        categories={categories.map(c => c.slug)}
                        onSEOUpdate={(data) => setSeoData(data)}
                      />
                      
                      {/* File Attachments Section */}
                      <FileAttachmentSection 
                        attachments={attachments}
                        onAttachmentsChange={setAttachments}
                      />
                    </div>
                  )}

                  {/* STEP 3: Preview & Submit */}
                  {currentStep === 3 && editor && (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2">
                      <Card className="border-2 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-primary" />
                            Preview Your Thread
                          </CardTitle>
                          <CardDescription>
                            Review your thread before posting
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            <div>
                              <Badge variant="secondary" className="mb-2">
                                {form.watch("threadType")}
                              </Badge>
                              <h2 className="text-2xl font-bold">{form.watch("title")}</h2>
                            </div>
                            
                            <Separator />
                            
                            <div 
                              className="prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ 
                                __html: DOMPurify.sanitize(editor.getHTML())
                              }}
                            />
                            
                            {form.watch("hashtags").length > 0 && (
                              <>
                                <Separator />
                                <div className="flex flex-wrap gap-2">
                                  {form.watch("hashtags").map((tag) => (
                                    <Badge key={tag} variant="outline">
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              </>
                            )}
                            
                            {attachments.length > 0 && (
                              <>
                                <Separator />
                                <div className="space-y-3">
                                  <Label>Attachments ({attachments.length})</Label>
                                  {attachments.map((attachment) => (
                                    <div 
                                      key={attachment.id} 
                                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                                    >
                                      <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-sm font-medium">{attachment.file.name}</span>
                                      </div>
                                      <Badge variant={attachment.price > 0 ? "default" : "secondary"}>
                                        {attachment.price > 0 ? (
                                          <>
                                            <Coins className="h-3 w-3 mr-1" />
                                            {attachment.price} Sweets
                                          </>
                                        ) : (
                                          "Free"
                                        )}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex flex-col gap-4">
                    {/* Requirements feedback for Step 1 */}
                    {currentStep === 1 && !canProceedStep1 && (
                      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 mt-0.5 text-orange-500" />
                          <div className="space-y-1">
                            <p className="font-medium text-orange-600">Complete these to continue:</p>
                            <ul className="space-y-0.5">
                              {!form.watch("categorySlug") && (
                                <li className="flex items-center gap-1">
                                  <Circle className="h-2 w-2" />
                                  Select a category
                                </li>
                              )}
                              {titleLength < 10 && (
                                <li className="flex items-center gap-1">
                                  <Circle className="h-2 w-2" />
                                  Add {10 - titleLength} more characters to title
                                </li>
                              )}
                              <li className="flex items-center gap-1">
                                <Circle className="h-2 w-2" />
                                Add at least 20 characters to content
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      {currentStep > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={() => setCurrentStep(currentStep - 1)}
                          className="gap-2"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                      )}

                      <div className="ml-auto flex gap-3">
                        {currentStep < 3 ? (
                          <Button
                            type="button"
                            size="lg"
                            onClick={() => setCurrentStep(currentStep + 1)}
                            disabled={currentStep === 1 && !canProceedStep1}
                            className="gap-2 min-w-[120px]"
                          >
                            Next
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                      ) : (
                        <Button
                          type="submit"
                          size="lg"
                          disabled={!isFormValid || createThreadMutation.isPending}
                          className="gap-2 min-w-[140px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        >
                          {createThreadMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Rocket className="w-4 h-4" />
                              Post Thread (+3 coins)
                            </>
                          )}
                        </Button>
                      )}
                      </div>
                    </div>
                  </div>
                </form>
              </Form>

              <AuthPrompt />
            </div>

            {/* Right Sidebar */}
            <div className="hidden lg:block">
              <div className="lg:sticky lg:top-[88px]">
                <RightEngagementSidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
      <EnhancedFooter />
    </>
  );
}