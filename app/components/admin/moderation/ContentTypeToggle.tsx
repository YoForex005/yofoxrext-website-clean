import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ContentTypeToggleProps {
  value: 'all' | 'threads' | 'replies';
  onChange: (value: 'all' | 'threads' | 'replies') => void;
}

export function ContentTypeToggle({ value, onChange }: ContentTypeToggleProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <span className="text-sm text-gray-300">Content Type</span>
      <ToggleGroup 
        type="single" 
        value={value} 
        onValueChange={(v) => v && onChange(v as any)}
        className="bg-gray-800 rounded-lg p-1"
      >
        <ToggleGroupItem 
          value="all" 
          className="data-[state=on]:bg-gray-700 data-[state=on]:text-white px-4 py-2"
          data-testid="toggle-all"
        >
          All
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="threads"
          className="data-[state=on]:bg-gray-700 data-[state=on]:text-white px-4 py-2"
          data-testid="toggle-threads"
        >
          Threads
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="replies"
          className="data-[state=on]:bg-gray-700 data-[state=on]:text-white px-4 py-2"
          data-testid="toggle-replies"
        >
          Replies
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
