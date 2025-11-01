import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Rocket, Mail, Bell, Twitter, Linkedin, Github } from 'lucide-react';

interface ComingSoonProps {
  title?: string;
  description?: string;
  image?: string;
  launchDate?: Date;
  showEmailCapture?: boolean;
  showSocialLinks?: boolean;
}

/**
 * Full-page Coming Soon component
 * SEO-optimized with email capture functionality
 */
export function ComingSoon({
  title = 'Coming Soon',
  description = 'We\'re working hard to bring you something amazing. Stay tuned!',
  image,
  launchDate,
  showEmailCapture = true,
  showSocialLinks = true,
}: ComingSoonProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual newsletter/waitlist API endpoint
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast({
          title: 'Success!',
          description: 'You\'re on the waitlist. We\'ll notify you when we launch!',
        });
        setEmail('');
      } else {
        throw new Error('Failed to subscribe');
      }
    } catch (error) {
      toast({
        title: 'Oops!',
        description: 'Something went wrong. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate countdown if launchDate is provided
  const getCountdown = () => {
    if (!launchDate) return null;

    const now = new Date().getTime();
    const target = new Date(launchDate).getTime();
    const diff = target - now;

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
  };

  const countdown = getCountdown();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="max-w-2xl w-full space-y-8 text-center">
        {/* Hero Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <Rocket className="w-12 h-12 text-primary" data-testid="icon-coming-soon" />
          </div>
        </div>

        {/* Title and Description */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight" data-testid="text-title">
            {title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto" data-testid="text-description">
            {description}
          </p>
        </div>

        {/* Countdown Timer */}
        {countdown && (
          <div className="flex justify-center gap-4" data-testid="container-countdown">
            <CountdownCard value={countdown.days} label="Days" />
            <CountdownCard value={countdown.hours} label="Hours" />
            <CountdownCard value={countdown.minutes} label="Minutes" />
          </div>
        )}

        {/* Image */}
        {image && (
          <div className="relative w-full max-w-md mx-auto aspect-video rounded-lg overflow-hidden shadow-lg">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              data-testid="img-coming-soon"
            />
          </div>
        )}

        {/* Email Capture Form */}
        {showEmailCapture && (
          <Card className="max-w-md mx-auto" data-testid="card-email-capture">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center">
                <Bell className="w-5 h-5" />
                Get Notified
              </CardTitle>
              <CardDescription>
                Be the first to know when we launch!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="sr-only">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="text-center"
                    data-testid="input-email"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  data-testid="button-subscribe"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Subscribing...' : 'Notify Me'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Social Links */}
        {showSocialLinks && (
          <div className="flex justify-center gap-4 pt-4" data-testid="container-social-links">
            <SocialLink
              href="https://twitter.com"
              icon={<Twitter className="w-5 h-5" />}
              label="Twitter"
            />
            <SocialLink
              href="https://linkedin.com"
              icon={<Linkedin className="w-5 h-5" />}
              label="LinkedIn"
            />
            <SocialLink
              href="https://github.com"
              icon={<Github className="w-5 h-5" />}
              label="GitHub"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CountdownCard({ value, label }: { value: number; label: string }) {
  return (
    <Card className="w-24">
      <CardContent className="p-4 text-center">
        <div className="text-3xl font-bold" data-testid={`text-countdown-${label.toLowerCase()}`}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
      </CardContent>
    </Card>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors"
      aria-label={label}
      data-testid={`link-social-${label.toLowerCase()}`}
    >
      {icon}
    </a>
  );
}
