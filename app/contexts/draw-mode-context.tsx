import { createContext, useContext } from 'react';
import type { UseDrawModeReturn } from '@/app/hooks/use-draw-mode';

const DrawModeContext = createContext<UseDrawModeReturn | null>(null);

export const useDrawModeContext = () => {
  const context = useContext(DrawModeContext);
  if (!context) throw new Error('useDrawModeContext must be used within DrawModeProvider');
  return context;
};

export const DrawModeProvider = DrawModeContext.Provider;