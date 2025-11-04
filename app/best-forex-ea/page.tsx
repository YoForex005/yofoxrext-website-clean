import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Star, TrendingUp, Shield, Zap, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FAQSchema, EAProductSchema, OrganizationSchema } from '../components/SEOSchema';

export const metadata: Metadata = {
  title: 'Best Forex EA 2025 - Top MT4/MT5 Expert Advisors & Trading Robots | YoForex',
  description: 'Discover the best Forex EA robots for MT4 and MT5 in 2025. Compare top-rated Expert Advisors, read reviews, download free EAs, and find profitable automated trading systems. Join 10,000+ traders using our EA marketplace.',
  keywords: 'best forex ea, best forex robot, mt4 ea, mt5 expert advisor, forex trading robot, automated trading, profitable ea, forex signals, algorithmic trading, mql5, forex factory',
  openGraph: {
    title: 'Best Forex EA & Trading Robots 2025 - YoForex',
    description: 'Find the most profitable Forex Expert Advisors. Compare features, performance, and user reviews.',
    images: ['/og-best-forex-ea.png'],
  },
  alternates: {
    canonical: 'https://yoforex.net/best-forex-ea',
  }
};

const topEAs = [
  {
    name: 'Gold Scalper Pro',
    type: 'Scalping EA',
    pairs: 'XAUUSD',
    minDeposit: '$500',
    monthlyReturn: '15-25%',
    rating: 4.8,
    reviews: 342,
    price: 'Free',
    features: ['News Filter', 'Auto Lot Sizing', 'Low DD'],
  },
  {
    name: 'Trend Master EA',
    type: 'Trend Following',
    pairs: 'EURUSD, GBPUSD',
    minDeposit: '$1000',
    monthlyReturn: '10-20%',
    rating: 4.7,
    reviews: 289,
    price: '$299',
    features: ['AI Analysis', 'Multi-Timeframe', 'Risk Management'],
  },
  {
    name: 'Night Scalper',
    type: 'Asian Session',
    pairs: 'Multiple',
    minDeposit: '$300',
    monthlyReturn: '8-15%',
    rating: 4.6,
    reviews: 198,
    price: '$199',
    features: ['Low Spread Trading', 'Time Filter', 'Stealth Mode'],
  },
  {
    name: 'Grid Trading Bot',
    type: 'Grid Strategy',
    pairs: 'USDJPY, EURJPY',
    minDeposit: '$2000',
    monthlyReturn: '12-18%',
    rating: 4.5,
    reviews: 156,
    price: '$149',
    features: ['Smart Grid', 'Recovery Mode', 'Hedging'],
  },
];

const faqs = [
  {
    question: 'What is a Forex EA (Expert Advisor)?',
    answer: 'A Forex EA or Expert Advisor is an automated trading software that runs on MetaTrader platforms (MT4/MT5). It executes trades automatically based on programmed trading strategies, eliminating emotional trading and enabling 24/7 market participation.'
  },
  {
    question: 'How do I choose the best Forex EA?',
    answer: 'Choose a Forex EA based on: verified backtesting results, live trading performance, user reviews, compatibility with your broker, appropriate risk management, regular updates, and transparent trading logic. Always test on a demo account first.'
  },
  {
    question: 'Are free Forex EAs as good as paid ones?',
    answer: 'Both free and paid EAs can be profitable. Free EAs on YoForex are often shared by experienced traders and can perform well. Paid EAs typically offer more features, dedicated support, and regular updates. Test any EA on demo before live trading.'
  },
  {
    question: 'What is the minimum deposit for running an EA?',
    answer: 'Minimum deposits vary by EA strategy. Scalping EAs may work with $300-500, while grid or martingale strategies typically need $1000-2000. Always check the EA documentation for recommended account size and risk settings.'
  },
  {
    question: 'Can I run multiple EAs on the same account?',
    answer: 'Yes, you can run multiple EAs on the same MT4/MT5 account. Use different magic numbers for each EA, ensure sufficient margin, avoid conflicting strategies on the same pair, and monitor total account risk carefully.'
  }
];

export default function BestForexEAPage() {
  return (
    <>
      <OrganizationSchema />
      <FAQSchema faqs={faqs} />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <section className="relative py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-6">
              <Badge className="mb-4" variant="secondary">
                <TrendingUp className="w-3 h-3 mr-1" />
                Updated November 2025
              </Badge>
              
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Best Forex EA & Expert Advisors 2025
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Discover top-performing MT4 and MT5 Expert Advisors. Compare features, performance metrics, 
                and real user reviews from our community of 10,000+ traders.
              </p>
              
              <div className="flex gap-4 justify-center">
                <Link href="/marketplace">
                  <Button size="lg" className="gap-2">
                    Browse All EAs <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/publish-ea">
                  <Button size="lg" variant="outline">
                    Submit Your EA
                  </Button>
                </Link>
              </div>
              
              <div className="flex gap-8 justify-center mt-8">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span>Verified Performance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <span>Instant Download</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span>Community Tested</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Top Rated Forex Expert Advisors</h2>
              <p className="text-muted-foreground">
                Compare the best performing EAs based on live trading results and user reviews
              </p>
            </div>
            
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EA Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Currency Pairs</TableHead>
                    <TableHead>Min Deposit</TableHead>
                    <TableHead>Monthly Return</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topEAs.map((ea, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{ea.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {ea.reviews} reviews
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ea.type}</Badge>
                      </TableCell>
                      <TableCell>{ea.pairs}</TableCell>
                      <TableCell>{ea.minDeposit}</TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        {ea.monthlyReturn}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span>{ea.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ea.price === 'Free' ? 'success' : 'default'}>
                          {ea.price}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/ea/${ea.name.toLowerCase().replace(/ /g, '-')}`}>
                          <Button size="sm" variant="ghost">
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Choose YoForex for Expert Advisors
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CheckCircle2 className="w-10 h-10 text-green-600 mb-4" />
                  <CardTitle>Verified Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    All EAs undergo rigorous backtesting and forward testing. 
                    View real trading results from our community members.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <Shield className="w-10 h-10 text-blue-600 mb-4" />
                  <CardTitle>Secure Downloads</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Safe, virus-free EA files with instant download. 
                    All files are scanned and verified before listing.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <Award className="w-10 h-10 text-purple-600 mb-4" />
                  <CardTitle>Expert Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Get help from EA developers and experienced traders. 
                    Active forum community for troubleshooting and optimization.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions About Forex EAs
            </h2>
            
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {faq.answer}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              Start Automated Trading Today
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of traders using Expert Advisors to trade 24/7
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/guides/getting-started-with-ea">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/20">
                  EA Setup Guide
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}