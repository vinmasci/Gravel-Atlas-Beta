//IGNORE THIS FILE ITS NOT SET UP

import { LayerControl } from './layer-control';

export function LayersPanel() {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 w-72">
      <h3 className="font-semibold mb-4">Map Layers</h3>
      <div className="space-y-4">
      <LayerControl
  label="Gravel Roads"
  description="Show all mapped gravel segments"
  onChange={(checked) => onLayerToggle('gravel-roads')}
  checked={overlayStates['gravel-roads']}
/>
        <LayerControl
          label="Bike Paths"
          description="Show designated cycling routes"
        />
        <LayerControl
          label="Points of Interest"
          description="Show amenities and landmarks"
        />
        <LayerControl
          label="Photos"
          description="Show user-submitted photos"
        />
      </div>
    </div>
  );
}