import { Metadata } from "next";
import SweetsDashboardClient from "./SweetsDashboardClient";

export const metadata: Metadata = {
  title: "Sweets Dashboard | YoForex",
  description: "Track your XP, rank progress, and unlocked features in the Sweets system. Earn rewards and level up your YoForex experience.",
  keywords: "sweets, xp, rank, progression, rewards, yoforex gamification",
  openGraph: {
    title: "Sweets Dashboard | YoForex",
    description: "Track your XP, rank progress, and unlocked features in the Sweets system.",
    type: "website",
    siteName: "YoForex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sweets Dashboard | YoForex",
    description: "Track your XP, rank progress, and unlocked features in the Sweets system.",
  },
};

export default function SweetsPage() {
  return <SweetsDashboardClient />;
}
