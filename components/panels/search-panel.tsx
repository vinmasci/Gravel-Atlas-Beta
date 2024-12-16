import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export function SearchPanel() {
  return (
    <div className="fixed top-20 left-4 right-4 max-w-lg mx-auto z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
        <div className="flex gap-2">
          <Input 
            placeholder="Search locations or routes..."
            className="flex-1"
          />
<Button size="icon" className="w-10 h-10 flex items-center justify-center">
  <Search className="h-4 w-4" />
</Button>
        </div>
      </div>
    </div>
  );
}