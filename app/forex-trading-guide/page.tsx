import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, TrendingUp, Shield, Users, DollarSign, Target, AlertTriangle, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FAQSchema, OrganizationSchema } from '../components/SEOSchema';

export const metadata: Metadata = {
  title: 'Forex Trading Guide 2025 - Complete Beginner to Expert | YoForex',
  description: 'Master forex trading with our comprehensive guide. Learn currency trading basics, strategies, risk management, and how to use Expert Advisors. Join 10,000+ successful traders.',
  keywords: 'forex trading, forex guide, currency trading, forex education, trading strategies, forex tutorial, babypips alternative, forex factory guide, learn forex',
  openGraph: {
    title: 'Complete Forex Trading Guide - From Beginner to Expert',
    description: 'Comprehensive forex trading education covering everything from basics to advanced strategies.',
    images: ['/og-forex-guide.png'],
  },
  alternates: {
    canonical: 'https://yoforex.net/forex-trading-guide',
  }
};

const tradingLevels = [
  {
    level: 'Beginner',
    duration: '1-3 months',
    topics: [
      'What is Forex Trading?',
      'Currency Pairs Explained',
      'How to Read Charts',
      'Basic Trading Terms',
      'Opening Your First Trade',
      'Risk Management Basics',
    ],
    color: 'bg-blue-50 border-blue-200',
  },
  {
    level: 'Intermediate',
    duration: '3-6 months',
    topics: [
      'Technical Analysis',
      'Fundamental Analysis',
      'Trading Strategies',
      'Using Indicators',
      'Position Sizing',
      'Trading Psychology',
    ],
    color: 'bg-green-50 border-green-200',
  },
  {
    level: 'Advanced',
    duration: '6+ months',
    topics: [
      'Expert Advisors (EAs)',
      'Algorithmic Trading',
      'Advanced Risk Management',
      'Market Microstructure',
      'Portfolio Management',
      'Creating Trading Systems',
    ],
    color: 'bg-purple-50 border-purple-200',
  },
];

const popularStrategies = [
  {
    name: 'Scalping',
    timeframe: '1-15 minutes',
    description: 'Quick trades targeting small price movements',
    difficulty: 'Hard',
    profitTarget: '5-10 pips',
  },
  {
    name: 'Day Trading',
    timeframe: '5 minutes - 1 hour',
    description: 'Open and close positions within the same day',
    difficulty: 'Medium',
    profitTarget: '20-50 pips',
  },
  {
    name: 'Swing Trading',
    timeframe: '4 hours - Daily',
    description: 'Hold positions for days to capture larger moves',
    difficulty: 'Easy',
    profitTarget: '50-200 pips',
  },
  {
    name: 'Position Trading',
    timeframe: 'Weekly - Monthly',
    description: 'Long-term trades based on fundamental analysis',
    difficulty: 'Easy',
    profitTarget: '200+ pips',
  },
];

const faqs = [
  {
    question: 'How much money do I need to start forex trading?',
    answer: 'You can start forex trading with as little as $100-$500, though we recommend starting with $1,000 for better risk management. Many brokers offer micro accounts allowing you to trade with minimal capital. Always start with money you can afford to lose.'
  },
  {
    question: 'Is forex trading profitable?',
    answer: 'Forex trading can be profitable, but statistics show that 70-90% of retail traders lose money. Success requires education, practice, discipline, and proper risk management. Using tools like Expert Advisors can help improve consistency.'
  },
  {
    question: 'What are the best forex pairs for beginners?',
    answer: 'Beginners should start with major pairs like EUR/USD, GBP/USD, and USD/JPY. These pairs have high liquidity, lower spreads, and more predictable movements. Avoid exotic pairs until you gain experience.'
  },
  {
    question: 'How long does it take to learn forex trading?',
    answer: 'Basic forex concepts can be learned in 1-3 months, but becoming consistently profitable typically takes 1-2 years of dedicated practice. Using demo accounts and starting with small positions accelerates the learning process.'
  },
  {
    question: 'Should I use Expert Advisors as a beginner?',
    answer: 'Expert Advisors can help beginners by automating trades and removing emotional decisions. However, understand how they work before using them. Start with well-tested EAs and always use proper risk management settings.'
  }
];

export default function ForexTradingGuidePage() {
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
                <BookOpen className="w-3 h-3 mr-1" />
                Comprehensive Trading Education
              </Badge>
              
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Complete Forex Trading Guide
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Learn forex trading from scratch. Master currency markets with our step-by-step guide 
                covering everything from basics to advanced strategies and Expert Advisors.
              </p>
              
              <div className="flex gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="gap-2">
                    Start Learning Free <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="#beginner">
                  <Button size="lg" variant="outline">
                    Jump to Lessons
                  </Button>
                </Link>
              </div>
              
              <div className="flex gap-8 justify-center mt-8">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>10,000+ Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <span>Expert Instructors</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span>Practical Examples</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Learning Path */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Your Forex Learning Journey
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {tradingLevels.map((level, index) => (
                <Card key={index} className={level.color}>
                  <CardHeader>
                    <Badge className="w-fit mb-2">{level.duration}</Badge>
                    <CardTitle>{level.level}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {level.topics.map((topic, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span className="text-sm">{topic}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-4" variant="outline">
                      Start {level.level} Course
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Key Concepts */}
        <section id="beginner" className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Essential Forex Concepts
            </h2>
            
            <Tabs defaultValue="basics" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="pairs">Currency Pairs</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="risk">Risk Management</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basics" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Forex Trading Basics</CardTitle>
                    <CardDescription>Understanding the fundamentals of currency trading</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">What is Forex?</h3>
                      <p className="text-muted-foreground">
                        Forex (Foreign Exchange) is the global marketplace for trading currencies. 
                        With over $6 trillion traded daily, it's the world's largest financial market. 
                        Traders profit from currency value changes by buying low and selling high.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Market Hours</h3>
                      <p className="text-muted-foreground">
                        Forex trades 24 hours, 5 days a week across four main sessions: Sydney, Tokyo, 
                        London, and New York. The best trading occurs during session overlaps when 
                        liquidity is highest.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Leverage & Margin</h3>
                      <p className="text-muted-foreground">
                        Leverage allows trading larger positions with less capital (e.g., 1:100 means 
                        controlling $100,000 with $1,000). While it amplifies profits, it equally 
                        amplifies losses. Use leverage cautiously.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="pairs" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Understanding Currency Pairs</CardTitle>
                    <CardDescription>How to read and trade different currency pairs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Major Pairs</h3>
                      <p className="text-muted-foreground mb-2">
                        Most traded pairs involving USD: EUR/USD, GBP/USD, USD/JPY, USD/CHF, 
                        AUD/USD, USD/CAD, NZD/USD. These have high liquidity and tight spreads.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Reading Pairs</h3>
                      <p className="text-muted-foreground">
                        In EUR/USD = 1.0850, EUR is the base currency and USD is the quote currency. 
                        This means 1 EUR equals 1.0850 USD. When you buy EUR/USD, you're buying EUR 
                        and selling USD.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Pips & Spreads</h3>
                      <p className="text-muted-foreground">
                        A pip (point in percentage) is the smallest price move, typically the 4th decimal 
                        place (0.0001). The spread is the difference between bid and ask prices, 
                        representing your trading cost.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analysis" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Market Analysis Methods</CardTitle>
                    <CardDescription>Technical and fundamental approaches to trading</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Technical Analysis</h3>
                      <p className="text-muted-foreground">
                        Study price charts, patterns, and indicators to predict future movements. 
                        Popular tools include Moving Averages, RSI, MACD, and Fibonacci retracements. 
                        Technical analysis forms the basis for most Expert Advisors.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Fundamental Analysis</h3>
                      <p className="text-muted-foreground">
                        Analyze economic indicators, central bank policies, and geopolitical events. 
                        Key data includes GDP, inflation, employment figures, and interest rate decisions 
                        that drive long-term currency trends.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Sentiment Analysis</h3>
                      <p className="text-muted-foreground">
                        Gauge market mood through positioning data, news sentiment, and trader surveys. 
                        Understanding whether traders are bullish or bearish helps identify potential 
                        reversals and trend continuations.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="risk" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Management Essentials</CardTitle>
                    <CardDescription>Protect your capital and trade sustainably</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <h3 className="font-semibold mb-2">Golden Rules</h3>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Never risk more than 1-2% per trade</li>
                            <li>• Always use stop-loss orders</li>
                            <li>• Don't overtrade or revenge trade</li>
                            <li>• Keep emotions in check</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Position Sizing</h3>
                      <p className="text-muted-foreground">
                        Calculate proper lot sizes based on account balance and risk tolerance. 
                        Formula: Position Size = (Account Balance × Risk %) / (Stop Loss in Pips × Pip Value)
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Risk-Reward Ratio</h3>
                      <p className="text-muted-foreground">
                        Aim for at least 1:2 risk-reward ratio (risk $100 to make $200). 
                        This ensures profitability even with a 40% win rate. Expert Advisors 
                        can help maintain consistent risk-reward ratios.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Trading Strategies */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Popular Trading Strategies
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {popularStrategies.map((strategy, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{strategy.name}</CardTitle>
                      <Badge variant={strategy.difficulty === 'Hard' ? 'destructive' : 
                                     strategy.difficulty === 'Medium' ? 'default' : 'secondary'}>
                        {strategy.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{strategy.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Timeframe:</span>
                        <p className="font-medium">{strategy.timeframe}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target:</span>
                        <p className="font-medium">{strategy.profitTarget}</p>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      Learn {strategy.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Expert Advisors Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-3xl font-bold mb-4">
                      Automate with Expert Advisors
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Take your trading to the next level with Expert Advisors (EAs). 
                      Automate your strategies, remove emotions, and trade 24/5 without 
                      being glued to your screen.
                    </p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        <span>Emotion-free trading</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span>Consistent strategy execution</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <span>Trade multiple strategies</span>
                      </li>
                    </ul>
                    <Link href="/marketplace">
                      <Button size="lg">Browse Expert Advisors</Button>
                    </Link>
                  </div>
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Getting Started with EAs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="space-y-2 text-sm">
                          <li>1. Choose a reliable EA from our marketplace</li>
                          <li>2. Install on MT4/MT5 platform</li>
                          <li>3. Configure settings and risk parameters</li>
                          <li>4. Test on demo account first</li>
                          <li>5. Monitor and optimize performance</li>
                        </ol>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
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
        <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              Start Your Forex Trading Journey Today
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of successful traders in our community
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/forum">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/20">
                  Join Community
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}