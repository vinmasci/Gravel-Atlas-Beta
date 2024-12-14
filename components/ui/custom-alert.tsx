// components/ui/custom-alert.tsx
import { Alert, AlertDescription } from "../../components/ui/alert"
import { XCircle } from "lucide-react"

// In components/ui/custom-alert.tsx
export function CustomAlert({ message }: { message: string }) {
    return (
      <Alert 
        variant="destructive" 
        className="absolute top-4 right-4 z-50 w-auto bg-destructive text-destructive-foreground shadow-lg"
      >
        <XCircle className="h-4 w-4" />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }