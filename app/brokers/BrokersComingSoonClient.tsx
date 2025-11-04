"use client";

import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  ShieldCheck, 
  Star, 
  Users,
  Bell,
  ChartBar,
  Award,
  Search,
  Clock,
  CheckCircle2,
  Globe,
  Zap
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function BrokersComingSoonClient() {
  const [email, setEmail] = useState("");
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

    // Simulate submission - in real app, this would call an API
    setTimeout(() => {
      toast({
        title: 'Success!',
        description: 'You\'re on the waitlist. We\'ll notify you when broker reviews launch!',
      });
      setEmail('');
      setIsSubmitting(false);
    }, 1000);
  };

  const features = [
    {
      icon: ShieldCheck,
      title: "Verified Reviews",
      description: "Real trader experiences with proof of account activity"
    },
    {
      icon: ChartBar,
      title: "Detailed Analytics",
      description: "Compare spreads, fees, execution speeds across brokers"
    },
    {
      icon: Star,
      title: "Community Ratings",
      description: "Rate brokers on support, withdrawals, and reliability"
    },
    {
      icon: Award,
      title: "Expert Analysis",
      description: "In-depth reviews from professional traders"
    },
    {
      icon: Globe,
      title: "Regulation Check",
      description: "Verify licenses and regulatory compliance"
    },
    {
      icon: Zap,
      title: "Live Updates",
      description: "Real-time broker status and trading conditions"
    }
  ];

  return (
    <>
      <Header />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
          <div className="container mx-auto px-4 py-20">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              {/* Coming Soon Badge */}
              <div className="flex justify-center">
                <Badge variant="outline" className="px-4 py-1 text-sm font-medium">
                  <Clock className="w-4 h-4 mr-2" />
                  Coming Soon
                </Badge>
              </div>

              {/* Main Title */}
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Broker Reviews & Ratings
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                We're building the most comprehensive broker review platform for forex traders. 
                Get ready to make informed decisions with real trader insights and verified data.
              </p>

              {/* Stats Preview */}
              <div className="flex flex-wrap justify-center gap-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Brokers Reviewed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">1000+</div>
                  <div className="text-sm text-muted-foreground">Verified Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Live Monitoring</div>
                </div>
              </div>

              {/* Email Notification Form */}
              <Card className="max-w-md mx-auto mt-12">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Bell className="w-5 h-5 text-primary" />
                      Get Early Access
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Be the first to know when broker reviews launch and get exclusive early access.
                    </p>
                    <form onSubmit={handleEmailSubmit} className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        className="flex-1"
                        data-testid="input-broker-notify-email"
                      />
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        data-testid="button-broker-notify"
                      >
                        {isSubmitting ? "Joining..." : "Notify Me"}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What's Coming</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our broker review system will help you choose the right broker with confidence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Meanwhile, Explore Our Community
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              While we're working on broker reviews, join our thriving community of traders
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/discussions">
                <Button size="lg" data-testid="button-explore-discussions">
                  <Users className="w-5 h-5 mr-2" />
                  Join Discussions
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button size="lg" variant="outline" data-testid="button-explore-marketplace">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Browse EAs
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Search className="w-6 h-6" />
                  What You'll Be Able to Do
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <span>Compare broker spreads, fees, and trading conditions side-by-side</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <span>Read verified reviews from real traders with proof of trading</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <span>Check broker regulation status and safety ratings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <span>Report scams and warn the community about problematic brokers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <span>Earn coins for contributing quality broker reviews</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </section>

        {/* Timeline */}
        <section className="container mx-auto px-4 py-16 border-t">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-8">Launch Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <div className="text-left flex-1">
                  <div className="font-semibold">Phase 1: Data Collection</div>
                  <div className="text-sm text-muted-foreground">Gathering broker information and regulatory data</div>
                </div>
                <Badge>In Progress</Badge>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
                <div className="text-left flex-1">
                  <div className="font-semibold">Phase 2: Review System</div>
                  <div className="text-sm text-muted-foreground">Building the review and rating infrastructure</div>
                </div>
                <Badge variant="outline">Q1 2025</Badge>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
                <div className="text-left flex-1">
                  <div className="font-semibold">Phase 3: Public Launch</div>
                  <div className="text-sm text-muted-foreground">Full platform available to all users</div>
                </div>
                <Badge variant="outline">Q2 2025</Badge>
              </div>
            </div>
          </div>
        </section>
      </main>

      <EnhancedFooter />
    </>
  );
}