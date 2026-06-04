import { useCallback, useRef, useState } from 'react';

/**
 * Two-finger pinch zoom for touch devices (patient prescription viewer).
 */
export function usePinchZoom(initialScale = 1, { min = 0.5, max = 4 } = {}) {
  const [scale, setScale] = useState(initialScale);
  const pinchRef = useRef({ distance: 0, baseScale: initialScale });

  const onTouchStart = useCallback(
    (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchRef.current = {
          distance: Math.hypot(dx, dy),
          baseScale: scale,
        };
      }
    },
    [scale]
  );

  const onTouchMove = useCallback(
    (e) => {
      if (e.touches.length !== 2 || pinchRef.current.distance <= 0) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchRef.current.distance;
      const next = Math.min(max, Math.max(min, pinchRef.current.baseScale * ratio));
      setScale(next);
    },
    [min, max]
  );

  const reset = useCallback(() => setScale(initialScale), [initialScale]);

  return { scale, setScale, reset, touchHandlers: { onTouchStart, onTouchMove } };
}
