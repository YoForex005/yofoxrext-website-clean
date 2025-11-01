import Header from '@/components/Header';
import EnhancedFooter from '@/components/EnhancedFooter';
import { PrivacySettings } from '@/components/messages/PrivacySettings';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Message Privacy Settings | YoForex',
  description: 'Manage your message privacy settings, notifications, and blocked users',
};

export default function MessageSettingsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/messages">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-messages">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Messages
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold">Message Privacy Settings</h1>
          <p className="text-muted-foreground mt-2">
            Control your message privacy, notifications, and manage blocked users
          </p>
        </div>

        <PrivacySettings />
      </main>

      <EnhancedFooter />
    </div>
  );
}
