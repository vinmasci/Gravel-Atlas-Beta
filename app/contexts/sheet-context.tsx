// Create this new file at: app/contexts/sheet-context.tsx
// Add this entire code:

'use client';

import React, { createContext, useContext, useCallback } from 'react';

type SheetType = 'profile' | 'sidebar' | 'mobile' | null;

interface SheetContextType {
  activeSheet: SheetType;
  setActiveSheet: (sheet: SheetType) => void;
  clearSheet: () => void;
}

const SheetContext = createContext<SheetContextType | undefined>(undefined);

export function SheetProvider({ children }: { children: React.ReactNode }) {
  const [activeSheet, setActiveSheet] = React.useState<SheetType>(null);

  const clearSheet = useCallback(() => {
    setActiveSheet(null);
  }, []);

  return (
    <SheetContext.Provider value={{ activeSheet, setActiveSheet, clearSheet }}>
      {children}
    </SheetContext.Provider>
  );
}

export function useSheet() {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('useSheet must be used within a SheetProvider');
  }
  return context;
}