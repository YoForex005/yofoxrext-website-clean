import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forex Pip Calculator - Calculate Pip Value & Profit/Loss | YoForex',
  description: 'Free forex pip calculator. Calculate pip value, profit/loss, and risk/reward ratio for your trades. Supports all major currency pairs.',
  openGraph: {
    title: 'Forex Pip Calculator | YoForex',
    description: 'Calculate pip value and potential profit/loss for your forex trades',
    type: 'website',
  },
};

export default function PipCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
