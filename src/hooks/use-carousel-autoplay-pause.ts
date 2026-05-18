import { useCallback, useEffect, useRef } from "react";

export function useCarouselAutoplayPause(
  setIsAutoPlayEnabled: (enabled: boolean) => void,
  resumeDelayMs = 15000,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCarouselInteraction = useCallback(() => {
    // We only update if we need to, but since we don't have access to current state here,
    // we can use the setter with a callback if the store supports it, or simply rely
    // on Zustand not updating if the value is the same. Wait, Zustand only avoids update if value is same.
    setIsAutoPlayEnabled(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsAutoPlayEnabled(true);
    }, resumeDelayMs);
  }, [setIsAutoPlayEnabled, resumeDelayMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return handleCarouselInteraction;
}
