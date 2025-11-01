import Header from '@/components/Header';
import EnhancedFooter from '@/components/EnhancedFooter';
import { Wrench, RefreshCw, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MaintenancePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-lg w-full mx-4">
          <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-10 text-center border border-gray-200 dark:border-gray-700">
            <div className="mb-6 animate-pulse">
              <Wrench className="h-20 w-20 mx-auto text-orange-500" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Under Maintenance
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              We're currently performing scheduled maintenance to improve your experience. 
              We'll be back shortly!
            </p>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <Clock className="h-4 w-4" />
              <span>Expected completion: 1-2 hours</span>
            </div>

            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Link href="/">
                <Button size="lg" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            For urgent support, please contact{' '}
            <a href="mailto:support@yoforex.net" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">
              support@yoforex.net
            </a>
          </p>
        </div>
      </main>
      <EnhancedFooter />
    </>
  );
}

export const metadata = {
  title: 'Maintenance Mode | YoForex',
  description: 'YoForex is currently undergoing scheduled maintenance. We will be back soon.',
  robots: {
    index: false,
    follow: false,
  },
};
