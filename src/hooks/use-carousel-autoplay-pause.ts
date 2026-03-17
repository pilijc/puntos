import { useCallback, useEffect, useRef } from "react";

export function useCarouselAutoplayPause(
  setIsAutoPlayEnabled: (enabled: boolean) => void,
  resumeDelayMs = 15000,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCarouselInteraction = useCallback(() => {
    setIsAutoPlayEnabled(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsAutoPlayEnabled(true);
    }, resumeDelayMs);
  }, [resumeDelayMs, setIsAutoPlayEnabled]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return handleCarouselInteraction;
}
