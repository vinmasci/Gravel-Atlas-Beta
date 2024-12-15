//IGNORE THIS FILE ITS NOT SET UP

import { Switch } from '@/components/ui/switch';

interface LayerControlProps {
  label: string;
  description?: string;
  onChange?: (checked: boolean) => void;
  checked?: boolean;
}

export function LayerControl({ 
  label, 
  description, 
  onChange,
  checked = false 
}: LayerControlProps) {
  return (
    <div className="flex items-center justify-between space-x-2 py-2">
      <div className="space-y-0.5">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}