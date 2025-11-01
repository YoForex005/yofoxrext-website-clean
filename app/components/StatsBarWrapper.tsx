import dynamic from 'next/dynamic';

const StatsBar = dynamic(() => import('./StatsBar'), {
  ssr: false,
  loading: () => (
    <div className="border-y bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="bg-muted rounded-lg h-11 w-11" />
              <div className="space-y-2">
                <div className="h-8 w-20 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
});

export default StatsBar;
