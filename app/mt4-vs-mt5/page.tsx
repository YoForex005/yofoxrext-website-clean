import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Server, Cpu, TrendingUp, Code, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FAQSchema, OrganizationSchema } from '../components/SEOSchema';

export const metadata: Metadata = {
  title: 'MT4 vs MT5 - Complete Comparison Guide 2025 | MetaTrader Platform | YoForex',
  description: 'Detailed MT4 vs MT5 comparison. Learn the differences between MetaTrader 4 and MetaTrader 5, which platform is better for Expert Advisors, and download free EAs for both platforms.',
  keywords: 'mt4 vs mt5, metatrader 4 vs 5, mt4 mt5 difference, which is better mt4 or mt5, mt4 expert advisor, mt5 ea, metatrader comparison, mql4 vs mql5',
  openGraph: {
    title: 'MT4 vs MT5 - Which MetaTrader Platform is Better?',
    description: 'Complete comparison of MetaTrader 4 and MetaTrader 5 platforms. Find out which is best for your trading style.',
    images: ['/og-mt4-vs-mt5.png'],
  },
  alternates: {
    canonical: 'https://yoforex.net/mt4-vs-mt5',
  }
};

const comparisonData = [
  {
    feature: 'Release Year',
    mt4: '2005',
    mt5: '2010',
    winner: 'mt5'
  },
  {
    feature: 'Programming Language',
    mt4: 'MQL4',
    mt5: 'MQL5',
    winner: 'mt5'
  },
  {
    feature: 'Timeframes',
    mt4: '9 timeframes',
    mt5: '21 timeframes',
    winner: 'mt5'
  },
  {
    feature: 'Order Types',
    mt4: '4 types',
    mt5: '6 types + Stop Limit',
    winner: 'mt5'
  },
  {
    feature: 'Technical Indicators',
    mt4: '30 indicators',
    mt5: '38+ indicators',
    winner: 'mt5'
  },
  {
    feature: 'Graphical Objects',
    mt4: '31 objects',
    mt5: '44 objects',
    winner: 'mt5'
  },
  {
    feature: 'Strategy Tester',
    mt4: 'Single-threaded',
    mt5: 'Multi-threaded',
    winner: 'mt5'
  },
  {
    feature: 'Market Depth',
    mt4: 'Not available',
    mt5: 'Available',
    winner: 'mt5'
  },
  {
    feature: 'Economic Calendar',
    mt4: 'Not built-in',
    mt5: 'Built-in',
    winner: 'mt5'
  },
  {
    feature: 'Broker Adoption',
    mt4: '90% of brokers',
    mt5: '60% of brokers',
    winner: 'mt4'
  },
  {
    feature: 'EA Availability',
    mt4: '10,000+ EAs',
    mt5: '5,000+ EAs',
    winner: 'mt4'
  },
  {
    feature: 'Community Support',
    mt4: 'Massive community',
    mt5: 'Growing community',
    winner: 'mt4'
  },
  {
    feature: 'Resource Usage',
    mt4: 'Lightweight',
    mt5: 'More demanding',
    winner: 'mt4'
  },
  {
    feature: 'Simplicity',
    mt4: 'Very simple',
    mt5: 'More complex',
    winner: 'mt4'
  },
];

const faqs = [
  {
    question: 'Should I use MT4 or MT5 for Expert Advisors?',
    answer: 'For EA trading, MT4 remains popular due to its vast library of existing EAs and simpler programming. However, MT5 offers superior backtesting with multi-threading, making it better for EA development and optimization. Choose MT4 for ready-made EAs, MT5 for developing new strategies.'
  },
  {
    question: 'Can I transfer my MT4 EA to MT5?',
    answer: 'MT4 EAs cannot run directly on MT5 due to different programming languages (MQL4 vs MQL5). The code needs to be converted or rewritten. However, many popular MT4 EAs have MT5 versions available. YoForex offers both MT4 and MT5 versions for most EAs.'
  },
  {
    question: 'Which platform is better for beginners?',
    answer: 'MT4 is generally better for beginners due to its simplicity, massive community support, and abundance of free resources. MT5 has more features but can be overwhelming for new traders. Start with MT4 and transition to MT5 as your needs grow.'
  },
  {
    question: 'Do all brokers support both MT4 and MT5?',
    answer: 'No, while most forex brokers offer MT4, not all provide MT5. About 90% of brokers support MT4, while only 60% offer MT5. Always check with your broker before choosing a platform. Some brokers offer both, allowing you to choose.'
  },
  {
    question: 'Is MT5 replacing MT4?',
    answer: 'While MetaQuotes (the developer) has stopped selling new MT4 licenses to brokers and focuses on MT5 development, MT4 remains extremely popular. The transition is gradual, and MT4 will likely remain relevant for several more years due to its massive user base.'
  }
];

export default function MT4vsMT5Page() {
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
                <Server className="w-3 h-3 mr-1" />
                Platform Comparison Guide
              </Badge>
              
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                MT4 vs MT5: Complete Comparison
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Detailed comparison of MetaTrader 4 and MetaTrader 5 platforms. 
                Discover which trading platform is best for your Expert Advisors and trading strategy.
              </p>
              
              <div className="flex gap-4 justify-center">
                <Link href="/marketplace?platform=mt4">
                  <Button size="lg" variant="outline">
                    Browse MT4 EAs
                  </Button>
                </Link>
                <Link href="/marketplace?platform=mt5">
                  <Button size="lg">
                    Browse MT5 EAs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Summary Cards */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">MetaTrader 4</CardTitle>
                    <Badge variant="outline" className="bg-blue-100">Classic</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    The industry standard for forex trading since 2005. Simple, reliable, and supported by virtually all brokers.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Massive EA library (10,000+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>90% broker support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Beginner-friendly</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Lightweight & fast</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span>Limited timeframes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span>Single-threaded testing</span>
                    </div>
                  </div>
                  <div className="pt-4">
                    <p className="font-semibold mb-2">Best For:</p>
                    <p className="text-sm text-muted-foreground">
                      Forex traders, beginners, those using existing EAs, traders who prefer simplicity
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">MetaTrader 5</CardTitle>
                    <Badge variant="outline" className="bg-green-100">Advanced</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    The next generation platform with advanced features for professional traders and EA developers.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>21 timeframes available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Multi-threaded testing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Built-in economic calendar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Market depth (DOM)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span>Fewer available EAs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span>Steeper learning curve</span>
                    </div>
                  </div>
                  <div className="pt-4">
                    <p className="font-semibold mb-2">Best For:</p>
                    <p className="text-sm text-muted-foreground">
                      Professional traders, EA developers, multi-asset traders, those needing advanced analysis tools
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Detailed Comparison Table */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Detailed Feature Comparison
            </h2>
            
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Feature</TableHead>
                    <TableHead className="text-center">MT4</TableHead>
                    <TableHead className="text-center">MT5</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.feature}</TableCell>
                      <TableCell className="text-center">
                        <div className={`inline-flex items-center gap-2 ${item.winner === 'mt4' ? 'text-green-600 font-semibold' : ''}`}>
                          {item.mt4}
                          {item.winner === 'mt4' && <CheckCircle className="w-4 h-4" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className={`inline-flex items-center gap-2 ${item.winner === 'mt5' ? 'text-green-600 font-semibold' : ''}`}>
                          {item.mt5}
                          {item.winner === 'mt5' && <CheckCircle className="w-4 h-4" />}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Which Platform Should You Choose?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-6 h-6 text-blue-600" />
                    Choose MT4 If You:
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span>Are new to forex trading and want simplicity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span>Want to use existing, proven Expert Advisors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span>Trade primarily forex pairs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span>Need maximum broker compatibility</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span>Have a lower-spec computer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span>Value community support and resources</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    Choose MT5 If You:
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span>Need advanced charting and analysis tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span>Develop and test your own EAs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span>Trade stocks, futures, or cryptocurrencies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span>Want faster backtesting capabilities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span>Need market depth information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span>Prefer having all tools in one platform</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
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
        <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-green-600 text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              Get Started with Expert Advisors
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Download free EAs for both MT4 and MT5 platforms
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/marketplace">
                <Button size="lg" variant="secondary">
                  Browse EA Marketplace
                </Button>
              </Link>
              <Link href="/guides/ea-installation">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/20">
                  EA Installation Guide
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}