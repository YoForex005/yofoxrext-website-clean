import { Metadata } from "next";
import TransactionHistoryClient from "./TransactionHistoryClient";

export const metadata: Metadata = {
  title: "Transaction History | YoForex",
  description: "View your complete coin transaction history including earnings, purchases, and spending on YoForex.",
  keywords: "transactions, coin history, earnings, purchases, transaction log",
  openGraph: {
    title: "Transaction History | YoForex",
    description: "View your complete coin transaction history including earnings, purchases, and spending on YoForex.",
    type: "website",
    siteName: "YoForex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Transaction History | YoForex",
    description: "View your complete coin transaction history including earnings, purchases, and spending on YoForex.",
  },
};

export default function TransactionHistoryPage() {
  return <TransactionHistoryClient />;
}
