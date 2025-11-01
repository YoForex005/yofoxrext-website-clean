import Header from '@/components/Header';
import EnhancedFooter from '@/components/EnhancedFooter';
import { Sparkles, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ComingSoonPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center">
          <div className="mb-8 animate-bounce">
            <Sparkles className="h-20 w-20 mx-auto text-purple-600 dark:text-purple-400" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Coming Soon
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            We're working on something amazing. Stay tuned!
          </p>

          <form className="flex gap-2 max-w-md mx-auto mb-8">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Enter your email"
                className="pl-10 py-6 text-lg"
                data-testid="input-email-notify"
              />
            </div>
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 px-8">
              Notify Me
            </Button>
          </form>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/" className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <EnhancedFooter />
    </>
  );
}

export const metadata = {
  title: 'Coming Soon | YoForex',
  description: 'This page is coming soon. Stay tuned for exciting updates!',
  robots: {
    index: false,
    follow: false,
  },
};
