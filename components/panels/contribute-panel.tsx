import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Route } from 'lucide-react';
import { UploadPhotoDialog } from './upload-photo';

export function ContributePanel() {
  const handlePhotoUploadComplete = () => {
    // In the future, we can refresh the photo markers on the map here
    console.log('Photo upload completed')
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-t-lg shadow-lg p-4 space-y-4">
      <div className="flex gap-4">
        <Button className="flex-1" variant="outline">
          <Route className="mr-2 h-4 w-4" />
          Draw Route
        </Button>
        <UploadPhotoDialog onUploadComplete={handlePhotoUploadComplete} />
      </div>
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Route name"
          className="w-full"
        />
        <Button className="w-full">
          Save Route
        </Button>
      </div>
    </div>
  );
}