import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, BarChart3, Target, Bell, Zap, Shield, Clock, Users, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { FAQSchema, OrganizationSchema } from '../components/SEOSchema';

export const metadata: Metadata = {
  title: 'Forex Signals - Free & Premium Trading Signals | Gold XAUUSD Signals | YoForex',
  description: 'Get accurate Forex signals for MT4/MT5. Free daily signals for XAUUSD Gold, EURUSD, GBPUSD. Join 5000+ traders receiving profitable forex trading signals with 80%+ win rate.',
  keywords: 'forex signals, gold signals, xauusd signals, free forex signals, trading signals, mt4 signals, mt5 signals, signal provider, forex alerts, trading alerts, babypips, forexfactory',
  openGraph: {
    title: 'Forex Trading Signals - Free Daily Signals | YoForex',
    description: 'Receive accurate forex signals with entry, stop loss, and take profit levels. 80%+ win rate.',
    images: ['/og-forex-signals.png'],
  },
  alternates: {
    canonical: 'https://yoforex.net/forex-signals',
  }
};

const signalProviders = [
  {
    name: 'Gold Master Signals',
    specialty: 'XAUUSD',
    accuracy: '85%',
    signals: '5-10 daily',
    subscribers: 2341,
    price: 'Free',
    features: ['Real-time alerts', 'Risk management', 'Market analysis'],
  },
  {
    name: 'FX Pro Signals',
    specialty: 'Major Pairs',
    accuracy: '82%',
    signals: '10-15 daily',
    subscribers: 1876,
    price: '$49/month',
    features: ['All pairs', 'VIP support', 'Video analysis'],
  },
  {
    name: 'Scalping Signals',
    specialty: 'Quick trades',
    accuracy: '78%',
    signals: '20+ daily',
    subscribers: 1432,
    price: '$29/month',
    features: ['1-5 pip targets', 'Low risk', 'High frequency'],
  },
];

const recentSignals = [
  { pair: 'XAUUSD', type: 'BUY', entry: '2024.50', sl: '2020.00', tp: '2035.00', status: 'Active', pips: '+45' },
  { pair: 'EURUSD', type: 'SELL', entry: '1.0850', sl: '1.0880', tp: '1.0800', status: 'Closed', pips: '+50' },
  { pair: 'GBPUSD', type: 'BUY', entry: '1.2650', sl: '1.2620', tp: '1.2700', status: 'Closed', pips: '+50' },
  { pair: 'USDJPY', type: 'SELL', entry: '149.50', sl: '150.00', tp: '148.50', status: 'Active', pips: '+30' },
];

const faqs = [
  {
    question: 'What are Forex trading signals?',
    answer: 'Forex signals are trade recommendations that specify currency pair, direction (buy/sell), entry price, stop loss, and take profit levels. They help traders make informed decisions based on technical and fundamental analysis.'
  },
  {
    question: 'How accurate are your forex signals?',
    answer: 'Our top signal providers maintain 75-85% accuracy rates. We verify all performance statistics monthly and display real trading results. Past performance does not guarantee future results.'
  },
  {
    question: 'How do I receive trading signals?',
    answer: 'Signals are delivered via: Email alerts, Telegram notifications, Mobile app push notifications, and directly in your YoForex dashboard. You can customize alert preferences in settings.'
  },
  {
    question: 'Are gold (XAUUSD) signals included?',
    answer: 'Yes! Gold/XAUUSD is one of our most popular signal offerings. We have dedicated gold specialists providing 5-10 high-quality XAUUSD signals daily with detailed analysis.'
  },
  {
    question: 'Can I use signals with any broker?',
    answer: 'Yes, our signals work with all MT4/MT5 brokers. We provide standard entry/exit levels that you can execute manually or using trade copier software with any broker.'
  }
];

export default function ForexSignalsPage() {
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
                Live Trading Signals
              </Badge>
              
              <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Forex Trading Signals & Gold Alerts
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Get profitable forex signals with 80%+ accuracy. Real-time alerts for XAUUSD Gold, 
                major pairs, and indices. Join 5000+ traders profiting daily.
              </p>
              
              <div className="flex gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="gap-2">
                    Get Free Signals <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="#providers">
                  <Button size="lg" variant="outline">
                    View Signal Providers
                  </Button>
                </Link>
              </div>
              
              <div className="flex gap-8 justify-center mt-8">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span>80%+ Accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <span>Real-time Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span>5000+ Traders</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Signals */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Recent Trading Signals Performance
            </h2>
            
            <Alert className="mb-8">
              <Bell className="h-4 w-4" />
              <AlertDescription>
                Live signals updated every 5 minutes. Past performance does not guarantee future results.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3">Pair</th>
                        <th className="text-left py-3">Direction</th>
                        <th className="text-left py-3">Entry</th>
                        <th className="text-left py-3">Stop Loss</th>
                        <th className="text-left py-3">Take Profit</th>
                        <th className="text-left py-3">Status</th>
                        <th className="text-left py-3">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSignals.map((signal, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 font-medium">{signal.pair}</td>
                          <td className="py-3">
                            <Badge variant={signal.type === 'BUY' ? 'success' : 'destructive'}>
                              {signal.type}
                            </Badge>
                          </td>
                          <td className="py-3">{signal.entry}</td>
                          <td className="py-3 text-red-600">{signal.sl}</td>
                          <td className="py-3 text-green-600">{signal.tp}</td>
                          <td className="py-3">
                            <Badge variant={signal.status === 'Active' ? 'default' : 'secondary'}>
                              {signal.status}
                            </Badge>
                          </td>
                          <td className="py-3 font-semibold text-green-600">{signal.pips}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Signal Providers */}
        <section id="providers" className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Top Signal Providers
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {signalProviders.map((provider, index) => (
                <Card key={index} className="relative">
                  {provider.price === 'Free' && (
                    <Badge className="absolute -top-3 -right-3" variant="success">
                      FREE
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle>{provider.name}</CardTitle>
                    <CardDescription>{provider.specialty}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Accuracy</span>
                      <span className="font-bold text-green-600">{provider.accuracy}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Signals</span>
                      <span className="font-medium">{provider.signals}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Subscribers</span>
                      <span className="font-medium">{provider.subscribers.toLocaleString()}</span>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="space-y-2 mb-4">
                        {provider.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                      <Button className="w-full" variant={provider.price === 'Free' ? 'default' : 'outline'}>
                        {provider.price === 'Free' ? 'Get Free Signals' : `Subscribe - ${provider.price}`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Choose YoForex Signals
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">Verified Track Record</h3>
                  <p className="text-sm text-muted-foreground">
                    All signals tracked with transparent performance history
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2">24/7 Market Coverage</h3>
                  <p className="text-sm text-muted-foreground">
                    Signals for all trading sessions: Asian, European, US
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold mb-2">Risk Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Every signal includes SL and multiple TP levels
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
                  <h3 className="font-semibold mb-2">Instant Delivery</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time alerts via Telegram, email, and mobile app
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4">
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
        <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              Start Receiving Profitable Signals Today
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join 5000+ traders making consistent profits with our signals
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/guides/how-to-use-signals">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/20">
                  How It Works
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}