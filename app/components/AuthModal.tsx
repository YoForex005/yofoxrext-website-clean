"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Mail,
  Lock,
  Sparkles,
  LogIn,
  UserPlus,
  Shield,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { signInWithGoogle, checkGoogleSignInRedirect, isGoogleAuthEnabled } from "@/lib/firebase";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: string;
}

type AuthMode = "signin" | "signup";
type PasswordStrength = "weak" | "medium" | "strong";

export default function AuthModal({ 
  open, 
  onOpenChange,
  action = "continue"
}: AuthModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>("weak");
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Set mounted state after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Calculate password strength
  useEffect(() => {
    if (mode === "signup" && password) {
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      const isLongEnough = password.length >= 8;
      
      const score = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar, isLongEnough]
        .filter(Boolean).length;
      
      if (score <= 2) {
        setPasswordStrength("weak");
      } else if (score <= 4) {
        setPasswordStrength("medium");
      } else {
        setPasswordStrength("strong");
      }
    }
  }, [password, mode]);
  
  // Check for Google Sign-In redirect result - only after component is mounted
  useEffect(() => {
    if (!mounted) return;
    
    const handleRedirectResult = async () => {
      if (typeof window !== 'undefined' && localStorage.getItem('googleSignInPending') === 'true') {
        setIsLoading(true);
        try {
          const idToken = await checkGoogleSignInRedirect();
          
          if (idToken) {
            const response = await apiRequest("POST", "/api/auth/google", { idToken });
            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || "Google authentication failed");
            }

            await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
            await queryClient.refetchQueries({ queryKey: ["/api/me"] });

            toast({
              title: "Login Successful",
              description: "Welcome to YoForex!",
            });

            onOpenChange(false);
          }
        } catch (error: any) {
          console.error("Google redirect auth error:", error);
          toast({
            title: "Google Sign-In Failed",
            description: error.message || "Something went wrong. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('googleSignInPending');
          }
        }
      }
    };

    handleRedirectResult();
  }, [mounted]);

  // Close modal if user becomes authenticated
  useEffect(() => {
    if (user && open) {
      onOpenChange(false);
      toast({
        title: "Welcome to YoForex!",
        description: "You're now signed in and ready to explore.",
        variant: "default",
      });
    }
  }, [user, open, onOpenChange, toast]);

  // Reset form when modal closes or mode changes
  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setAcceptedTerms(false);
      setShowVerificationMessage(false);
      setMode("signin");
    }
  }, [open]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/me"] });

      toast({
        title: "Login Successful",
        description: "Welcome back to YoForex!",
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    if (!acceptedTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the Terms of Service and Privacy Policy to continue.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/register", { email, password });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Show verification message
      setShowVerificationMessage(true);
      
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account and claim your 150 welcome Sweets!",
      });

      // Auto-switch to login mode after 5 seconds
      setTimeout(() => {
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
        setAcceptedTerms(false);
        setShowVerificationMessage(false);
      }, 5000);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      const idToken = await signInWithGoogle();
      const response = await apiRequest("POST", "/api/auth/google", { idToken });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Google authentication failed");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/me"] });

      toast({
        title: "Login Successful",
        description: "Welcome to YoForex!",
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error("Google auth error:", error);
      toast({
        title: "Google Sign-In Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
    }
  };

  const getPasswordStrengthWidth = () => {
    switch (passwordStrength) {
      case "weak":
        return "w-1/3";
      case "medium":
        return "w-2/3";
      case "strong":
        return "w-full";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <Sparkles className="h-14 w-14 text-primary relative z-10" />
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            {mode === "signin" ? "Welcome Back to YoForex!" : "Join YoForex Today!"}
          </DialogTitle>
          
          <DialogDescription className="text-center text-muted-foreground">
            {mode === "signin" 
              ? "Sign in to access exclusive trading tools and community features"
              : "Create your account and earn 150 Sweets as a welcome bonus!"
            }
          </DialogDescription>
        </DialogHeader>

        {showVerificationMessage ? (
          <div className="space-y-4 mt-4 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-8 w-8 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Check Your Email!</h3>
                <p className="text-sm mt-1">
                  We've sent a verification link to <strong>{email}</strong>
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account and claim your 150 welcome Sweets. 
              The link expires in 24 hours.
            </p>
            <Button
              onClick={() => {
                setMode("signin");
                setShowVerificationMessage(false);
              }}
              variant="outline"
              className="w-full"
              data-testid="button-goto-signin"
            >
              Go to Sign In
            </Button>
          </div>
        ) : (
          <div className="space-y-5 mt-4">
            {/* Google Sign-In Section */}
            <div className="space-y-3">
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading || !isGoogleAuthEnabled}
                variant="outline"
                className={`w-full h-12 gap-3 font-medium transition-all ${
                  isGoogleAuthEnabled 
                    ? 'border-2 hover:bg-slate-50 dark:hover:bg-slate-900 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700' 
                    : 'opacity-50 cursor-not-allowed border-muted'
                }`}
                data-testid="button-google-signin"
              >
                <div className="bg-white rounded-full p-1">
                  <SiGoogle className="h-5 w-5" style={{ color: '#4285F4' }} />
                </div>
                <span className="text-base">
                  {isGoogleAuthEnabled ? "Continue with Google" : "Google Sign-In (Coming Soon)"}
                </span>
              </Button>
              
              {!isGoogleAuthEnabled && (
                <p className="text-xs text-center text-muted-foreground italic">
                  Google Sign-In is currently being set up
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground font-medium">
                  {isGoogleAuthEnabled ? "Or continue with email" : "Sign in with email"}
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={mode === "signin" ? handleEmailAuth : handleRegistration} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={mode === "signin" ? "Enter your password" : "Create a strong password (min 8 characters)"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                  className="h-11"
                  data-testid="input-password"
                />
                
                {/* Password Strength Indicator (Sign Up only) */}
                {mode === "signup" && password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${getPasswordStrengthColor()} ${getPasswordStrengthWidth()}`}
                        ></div>
                      </div>
                      <span className="text-xs font-medium capitalize">{passwordStrength}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {password.length >= 8 ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-400" />
                        )}
                        <span>8+ characters</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/[A-Z]/.test(password) ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-400" />
                        )}
                        <span>Uppercase</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/[0-9]/.test(password) ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-400" />
                        )}
                        <span>Number</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-400" />
                        )}
                        <span>Special char</span>
                      </div>
                    </div>
                  </div>
                )}

                {mode === "signin" && (
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    <button 
                      type="button" 
                      className="hover:underline"
                      onClick={() => toast({
                        title: "Password Reset",
                        description: "Password reset feature coming soon!",
                      })}
                    >
                      Forgot password?
                    </button>
                  </p>
                )}
              </div>

              {/* Confirm Password (Sign Up only) */}
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={8}
                    className="h-11"
                    data-testid="input-confirm-password"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Passwords do not match
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Passwords match
                    </p>
                  )}
                </div>
              )}

              {/* Terms & Privacy Checkbox (Sign Up only) */}
              {mode === "signup" && (
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    disabled={isLoading}
                    data-testid="checkbox-terms"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground leading-tight cursor-pointer"
                  >
                    I agree to the{" "}
                    <a href="/terms" target="_blank" className="text-primary hover:underline font-medium">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" target="_blank" className="text-primary hover:underline font-medium">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                disabled={isLoading || (mode === "signup" && !acceptedTerms)}
                data-testid={mode === "signin" ? "button-login" : "button-register"}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    {mode === "signin" ? "Signing in..." : "Creating account..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {mode === "signin" ? (
                      <>
                        <LogIn className="h-4 w-4" />
                        Sign In
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Create Account
                      </>
                    )}
                  </span>
                )}
              </Button>
            </form>

            {/* Mode Toggle */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {mode === "signin" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      onClick={() => {
                        setMode("signup");
                        setPassword("");
                        setConfirmPassword("");
                      }}
                      className="text-primary font-medium hover:underline"
                      disabled={isLoading}
                      data-testid="button-switch-to-signup"
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => {
                        setMode("signin");
                        setPassword("");
                        setConfirmPassword("");
                        setAcceptedTerms(false);
                      }}
                      className="text-primary font-medium hover:underline"
                      disabled={isLoading}
                      data-testid="button-switch-to-signin"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
