import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function UserPanel() {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">Guest User</h3>
          <p className="text-sm text-muted-foreground">Sign in to contribute</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline">Sign In</Button>
        <Button>Register</Button>
      </div>
    </div>
  );
}