import dynamic from 'next/dynamic';

export const TimeAgo = dynamic(() => import('./TimeAgo').then(mod => ({ default: mod.TimeAgo })), {
  ssr: false,
  loading: () => <span className="text-muted-foreground">...</span>
});
