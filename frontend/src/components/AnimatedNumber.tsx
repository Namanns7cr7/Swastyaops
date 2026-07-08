'use client';

/**
 * AnimatedNumber component — smoothly counts up from 0 to target numeric value on mount.
 * Handles suffixes like '%' or '/111' cleanly and respects prefers-reduced-motion.
 */
import { useEffect, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';

interface AnimatedNumberProps {
  value: string | number;
  duration?: number;
}

export default function AnimatedNumber({ value, duration = 800 }: AnimatedNumberProps) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [displayValue, setDisplayValue] = useState<string | number>(prefersReducedMotion ? value : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const strVal = String(value);
    // Parse numeric prefix (e.g. "84" from "84%", or "96" from "96/111", or "118")
    const match = strVal.match(/^(\d+(?:\.\d+)?)(.*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const targetNum = parseFloat(match[1]);
    const suffix = match[2] || '';
    const startTime = performance.now();

    let animationFrameId: number;

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic: 1 - (1 - t)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentNum = Math.floor(easeOut * targetNum);

      setDisplayValue(`${currentNum}${suffix}`);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(strVal);
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration, prefersReducedMotion]);

  return <>{displayValue}</>;
}
