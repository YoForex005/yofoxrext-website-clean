import { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "My Dashboard | YoForex",
  description: "Manage your YoForex account, track your earnings, and view your recent activity.",
  keywords: "dashboard, account, trading activity, forex earnings",
  openGraph: {
    title: "My Dashboard | YoForex",
    description: "Manage your YoForex account, track your earnings, and view your recent activity.",
    type: "website",
    siteName: "YoForex",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Dashboard | YoForex",
    description: "Manage your YoForex account, track your earnings, and view your recent activity.",
  },
};

export default function DashboardPage() {
  // Let the client component handle authentication
  // This allows the page to load and show login prompt if needed
  return <DashboardClient />;
}
