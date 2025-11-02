import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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

async function getUser() {
  const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

  try {
    const res = await fetch(`${EXPRESS_URL}/api/me`, {
      headers: {
        Cookie: cookieHeader,
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (res.status === 401) {
      return null;
    }

    if (!res.ok) {
      throw new Error('Failed to fetch user');
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export default async function SweetsPage() {
  const user = await getUser();

  if (!user) {
    // Redirect to home page when not authenticated
    // User can login from there using the AuthModal
    redirect('/');
  }

  return <SweetsDashboardClient />;
}
