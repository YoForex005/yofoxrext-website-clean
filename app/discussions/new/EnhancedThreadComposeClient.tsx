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
import Link from '@tiptap/extension-link';
import DOMPurify from 'isomorphic-dompurify';
import type { ForumCategory } from "@shared/schema";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
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
import { useToast } from "@/hooks/use-toast";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { apiRequest } from "@/lib/queryClient";
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
  MessageSquare
} from "lucide-react";

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
  contentHtml: z.string().min(150, "Add a bit more detail (min 150 characters)"),
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

// Formatting toolbar component
function FormattingToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('files', file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          const imageUrl = data.urls?.[0];
          if (imageUrl) {
            editor.chain().focus().setImage({ src: imageUrl }).run();
          }
        }
      } catch (error) {
        console.error('Image upload failed:', error);
      }
    };
    input.click();
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-muted/30 rounded-t-lg">
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className="h-8 w-8 p-0"
        data-testid="button-bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('italic') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className="h-8 w-8 p-0"
        data-testid="button-italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('underline') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className="h-8 w-8 p-0"
        data-testid="button-underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className="h-8 w-8 p-0"
        data-testid="button-h1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className="h-8 w-8 p-0"
        data-testid="button-h2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className="h-8 w-8 p-0"
        data-testid="button-bullet-list"
      >
        <List className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className="h-8 w-8 p-0"
        data-testid="button-ordered-list"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={handleImageUpload}
        className="h-8 px-2"
        data-testid="button-insert-image"
      >
        <ImageIcon className="h-4 w-4 mr-1" />
        Image
      </Button>
    </div>
  );
}

// File attachment component
function FileAttachmentSection({ 
  attachments, 
  onAttachmentsChange 
}: { 
  attachments: FileAttachment[]; 
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
}) {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

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
      const id = Math.random().toString(36).substring(7);
      newAttachments.push({
        id,
        file,
        price: 0,
        uploading: true,
      });
    }

    onAttachmentsChange([...attachments, ...newAttachments]);

    // Upload files
    for (const attachment of newAttachments) {
      const formData = new FormData();
      formData.append('files', attachment.file);

      try {
        setUploadingFiles(prev => [...prev, attachment.id]);
        
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          const url = data.urls?.[0];
          
          onAttachmentsChange(prev => prev.map(a => 
            a.id === attachment.id 
              ? { ...a, url, uploading: false }
              : a
          ));
        } else {
          throw new Error("Upload failed");
        }
      } catch (error) {
        onAttachmentsChange(prev => prev.map(a => 
          a.id === attachment.id 
            ? { ...a, uploading: false, error: 'Upload failed' }
            : a
        ));
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
    if (['pdf'].includes(ext || '')) return <FileText className="h-4 w-4" />;
    if (['zip', 'rar', '7z'].includes(ext || '')) return <File className="h-4 w-4" />;
    if (['ex4', 'ex5', 'mq4', 'mq5'].includes(ext || '')) return <Coins className="h-4 w-4" />;
    return <Paperclip className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          <Paperclip className="inline h-4 w-4 mr-2" />
          File Attachments
        </Label>
        {totalPotentialEarnings > 0 && (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
            <Coins className="h-3 w-3 mr-1" />
            Potential: {totalPotentialEarnings} Sweets
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="file-upload" className="cursor-pointer">
          <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload files (PDFs, ZIPs, EAs, indicators, etc.)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max 20MB per file, up to 10 files
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.zip,.rar,.7z,.ex4,.ex5,.mq4,.mq5,.set,.csv"
          />
        </Label>

        {attachments.length > 0 && (
          <div className="space-y-2 mt-4">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                {getFileIcon(attachment.file.name)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(attachment.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Coins className="h-3 w-3 text-yellow-600" />
                    <Input
                      type="number"
                      min="0"
                      max="10000"
                      value={attachment.price}
                      onChange={(e) => handlePriceChange(attachment.id, parseInt(e.target.value) || 0)}
                      className="w-20 h-8 text-sm"
                      placeholder="0"
                      disabled={attachment.uploading}
                    />
                  </div>
                  
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAttachment(attachment.id)}
                    disabled={attachment.uploading}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {attachment.uploading && (
                  <div className="flex items-center gap-2">
                    <Progress className="w-20 h-2" value={50} />
                  </div>
                )}
                
                {attachment.error && (
                  <Badge variant="destructive" className="text-xs">
                    {attachment.error}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Character counter component
function CharacterCounter({ current, min, max }: { current: number; min?: number; max: number }) {
  const percentage = (current / max) * 100;
  const isValid = (!min || current >= min) && current <= max;
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <Progress value={percentage} className="h-1 w-20" />
      <span className={isValid ? "text-muted-foreground" : "text-destructive"}>
        {current}/{max}
      </span>
    </div>
  );
}

// Step indicator component
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        
        return (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                ${isActive ? 'bg-primary text-primary-foreground scale-110' : ''}
                ${isCompleted ? 'bg-primary/20 text-primary' : ''}
                ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
              `}
            >
              {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
            </div>
            {stepNumber < totalSteps && (
              <div className={`w-12 h-0.5 mx-1 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        );
      })}
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
  
  // Pre-select category from URL param
  const categoryParam = searchParams?.get("category") || "";
  
  // Group categories by parent/subcategory structure
  const parentCategories = categories.filter(c => !c.parentSlug);
  const getCategorySubcategories = (parentSlug: string) => 
    categories.filter(c => c.parentSlug === parentSlug);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  const form = useForm<ThreadFormData>({
    resolver: zodResolver(threadFormSchema),
    defaultValues: {
      title: "",
      contentHtml: "",
      categorySlug: categoryParam,
      hashtags: [],
      attachments: [],
    },
  });

  const watchedValues = form.watch();
  const titleLength = watchedValues.title?.length || 0;

  // Update form when editor content changes
  useEffect(() => {
    if (editor) {
      const html = editor.getHTML();
      form.setValue('contentHtml', html);
    }
  }, [editor?.state]);

  const createThreadMutation = useMutation({
    mutationFn: async (data: ThreadFormData) => {
      // Sanitize HTML content before sending
      const sanitizedContent = DOMPurify.sanitize(data.contentHtml, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'img'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'class'],
      });

      const payload = {
        ...data,
        contentHtml: sanitizedContent,
        attachments: attachments.filter(a => a.url).map(a => ({
          id: a.id,
          filename: a.file.name,
          size: a.file.size,
          url: a.url!,
          mimeType: a.file.type || 'application/octet-stream',
          price: a.price,
          downloads: 0,
        })),
      };

      const res = await apiRequest("POST", "/api/threads", payload);
      return await res.json() as { thread: any; coinsEarned: number; message: string };
    },
    onSuccess: (response) => {
      const threadUrl = `${window.location.origin}/thread/${response.thread.slug}`;
      
      toast({
        title: "Thread posted! 🎉",
        description: (
          <div className="space-y-3">
            <p className="font-medium">
              +{response.coinsEarned} coins earned!
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(threadUrl);
                  toast({ title: "Link copied!" });
                }}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy link
              </Button>
            </div>
          </div>
        ),
        duration: 10000,
      });
      
      setTimeout(() => {
        router.push(`/thread/${response.thread.slug}`);
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ThreadFormData) => {
    requireAuth(() => {
      createThreadMutation.mutate(data);
    });
  };

  const addHashtag = () => {
    if (!hashtagInput.trim()) return;
    const normalized = hashtagInput.trim().toLowerCase().replace(/^#/, "");
    const current = form.getValues("hashtags") || [];
    if (!current.includes(normalized) && current.length < 10) {
      form.setValue("hashtags", [...current, normalized]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    const current = form.getValues("hashtags") || [];
    form.setValue("hashtags", current.filter(t => t !== tag));
  };

  const canProceedStep1 = titleLength >= 15 && editor?.getText().length >= 150;
  const isFormValid = form.formState.isValid;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          {/* Header with progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Create New Thread</h1>
              {isSavingDraft && (
                <Badge variant="secondary" className="animate-pulse">
                  <Save className="w-3 h-3 mr-1" />
                  Saving...
                </Badge>
              )}
            </div>
            <StepIndicator currentStep={currentStep} totalSteps={2} />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* STEP 1: Core Content */}
              {currentStep === 1 && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      What's on your mind?
                    </CardTitle>
                    <CardDescription>
                      Share your trading question, strategy, or insight with rich formatting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Category Selection */}
                    <FormField
                      control={form.control}
                      name="categorySlug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Where does this belong?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[400px]">
                              {parentCategories.map((parentCat) => {
                                const subcats = getCategorySubcategories(parentCat.slug);
                                
                                return [
                                  <SelectItem 
                                    key={parentCat.slug} 
                                    value={parentCat.slug}
                                    data-testid={`option-category-${parentCat.slug}`}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{parentCat.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {parentCat.description}
                                      </span>
                                    </div>
                                  </SelectItem>,
                                  
                                  ...subcats.map((subcat) => (
                                    <SelectItem 
                                      key={subcat.slug} 
                                      value={subcat.slug}
                                      data-testid={`option-category-${subcat.slug}`}
                                    >
                                      <div className="flex flex-col ml-4">
                                        <span className="font-medium">↳ {subcat.name}</span>
                                        <span className="text-xs text-muted-foreground">
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
                            <span>Title</span>
                            <CharacterCounter current={titleLength} min={15} max={90} />
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="What's your XAUUSD scalping rule that actually works?"
                              className="text-lg"
                              data-testid="input-title"
                            />
                          </FormControl>
                          {titleLength > 0 && titleLength < 15 && (
                            <p className="text-xs text-muted-foreground">
                              Add {15 - titleLength} more characters...
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Rich Text Editor */}
                    <div className="space-y-2">
                      <Label>Your story or question</Label>
                      <div className="border rounded-lg overflow-hidden">
                        <FormattingToolbar editor={editor} />
                        <EditorContent 
                          editor={editor} 
                          className="min-h-[300px]"
                        />
                      </div>
                      {editor && (
                        <div className="flex justify-between text-xs">
                          <span className={editor.getText().length < 150 ? "text-red-500" : "text-muted-foreground"}>
                            {editor.getText().length} characters
                          </span>
                          {editor.getText().length >= 150 && (
                            <span className="text-green-500 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Minimum length met
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Hashtags */}
                    <div className="space-y-2">
                      <Label>Hashtags (optional)</Label>
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
                          <Hash className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      {form.watch("hashtags").length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {form.watch("hashtags").map((tag) => (
                            <Badge key={tag} variant="secondary">
                              #{tag}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-1"
                                onClick={() => removeHashtag(tag)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 2: File Attachments */}
              {currentStep === 2 && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Paperclip className="w-5 h-5" />
                      Add Files & Set Pricing
                    </CardTitle>
                    <CardDescription>
                      Attach files and optionally charge Sweets for downloads
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FileAttachmentSection 
                      attachments={attachments}
                      onAttachmentsChange={setAttachments}
                    />

                    {/* Preview */}
                    {showPreview && editor && (
                      <div className="space-y-4">
                        <Label>Preview</Label>
                        <Card>
                          <CardHeader>
                            <CardTitle>{form.watch("title")}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div 
                              className="prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ 
                                __html: DOMPurify.sanitize(editor.getHTML())
                              }}
                            />
                            {attachments.length > 0 && (
                              <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                                <Label className="text-sm font-semibold mb-3 block">
                                  <Paperclip className="inline h-3 w-3 mr-1" />
                                  Attachments ({attachments.length})
                                </Label>
                                <div className="space-y-2">
                                  {attachments.map((attachment) => (
                                    <div key={attachment.id} className="flex items-center justify-between p-2 border rounded bg-background">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{attachment.file.name}</span>
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
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                )}

                <div className="ml-auto flex gap-2">
                  {currentStep === 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {showPreview ? 'Hide' : 'Show'} Preview
                    </Button>
                  )}

                  {currentStep < 2 ? (
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(currentStep + 1)}
                      disabled={!canProceedStep1}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!isFormValid || createThreadMutation.isPending}
                    >
                      {createThreadMutation.isPending ? (
                        <>Creating...</>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1" />
                          Post Thread
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>

          {AuthPrompt}
        </div>
      </div>
      <EnhancedFooter />
    </>
  );
}