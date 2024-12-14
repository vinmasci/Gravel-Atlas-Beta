import { createContext, useContext } from 'react';
import { useDrawMode } from '../../app/hooks/use-draw-mode';
import type { UseDrawModeReturn } from '../../app/hooks/use-draw-mode';

const DrawModeContext = createContext<UseDrawModeReturn | null>(null);

export const useDrawModeContext = () => {
  const context = useContext(DrawModeContext);
  if (!context) throw new Error('useDrawModeContext must be used within DrawModeProvider');
  return context;
};

interface DrawModeProviderProps {
  children: React.ReactNode;
  map: mapboxgl.Map | null;
}

export const DrawModeProvider: React.FC<DrawModeProviderProps> = ({ children, map }) => {
  const drawMode = useDrawMode(map);
  return (
    <DrawModeContext.Provider value={drawMode}>
      {children}
    </DrawModeContext.Provider>
  );
};