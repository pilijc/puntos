import { useCallback, useRef } from "react";

export function useSingleTap<T extends (...args: any[]) => void>(
  callback: T | undefined,
  delay: number = 800
): (...args: Parameters<T>) => void {
  const isTapped = useRef(false);

  return useCallback(
    (...args: Parameters<T>) => {
      if (!callback || isTapped.current) return;
      isTapped.current = true;
      callback(...args);
      setTimeout(() => {
        isTapped.current = false;
      }, delay);
    },
    [callback, delay]
  );
}
