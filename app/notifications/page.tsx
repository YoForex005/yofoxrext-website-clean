import { Metadata } from "next";
import NotificationsClient from "./NotificationsClient";

export const metadata: Metadata = {
  title: "Notifications | YoForex",
  description: "View all your notifications including replies, likes, follows, and system alerts.",
  keywords: "notifications, alerts, activity, updates",
  openGraph: {
    title: "Notifications | YoForex",
    description: "View all your notifications including replies, likes, follows, and system alerts.",
    type: "website",
    siteName: "YoForex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Notifications | YoForex",
    description: "View all your notifications including replies, likes, follows, and system alerts.",
  },
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}
