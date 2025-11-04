import { Metadata } from 'next';
import BrokersComingSoonClient from './BrokersComingSoonClient';

// SEO metadata for the coming soon page
export const metadata: Metadata = {
  title: "Broker Reviews Coming Soon | YoForex",
  description: "Our comprehensive broker review system is launching soon. Get ready to explore detailed analyses, user ratings, and expert insights on the best forex brokers for MT4/MT5 trading.",
  keywords: "forex brokers, MT4 brokers, MT5 brokers, broker reviews, regulated brokers, coming soon",
  openGraph: {
    title: "Broker Reviews Coming Soon | YoForex",
    description: "Our comprehensive broker review system is launching soon. Get ready to explore detailed analyses, user ratings, and expert insights on the best forex brokers for MT4/MT5 trading.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Broker Reviews Coming Soon | YoForex",
    description: "Our comprehensive broker review system is launching soon. Get ready to explore detailed analyses, user ratings, and expert insights on the best forex brokers for MT4/MT5 trading.",
  },
};

export default function BrokerDirectoryPage() {
  return <BrokersComingSoonClient />;
}