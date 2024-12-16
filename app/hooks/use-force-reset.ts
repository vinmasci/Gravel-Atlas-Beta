import { useEffect } from 'react';

export function useForceReset() {
  useEffect(() => {
    return () => {
      // Force cleanup of any lingering portals
      const portals = document.querySelectorAll('[data-state="closed"]');
      portals.forEach(portal => {
        if (portal.parentElement) {
          portal.parentElement.removeChild(portal);
        }
      });
    };
  }, []);
}