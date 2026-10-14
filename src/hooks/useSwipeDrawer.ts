import { useState, useEffect, useRef } from 'react';

export interface DragState {
  isDragging: boolean;
  dragOffsetPx: number;
  dragProgress: number; // 0.0 a 1.0
  thresholdReached: boolean;
  direction: 'left' | 'right' | null;
}

export interface UseSwipeDrawerOptions {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  enabled?: boolean;
  thresholdPx?: number;
}

/**
 * Hook ergonómico táctil para drawers móviles (física 1:1, ratio biomecánico 1.1,
 * zona del pulgar derecho en la mitad inferior de la pantalla y Body Scroll Lock nativo).
 */
export function useSwipeDrawer({
  isOpen,
  onOpen,
  onClose,
  enabled = true,
  thresholdPx = 50
}: UseSwipeDrawerOptions) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragOffsetPx: 0,
    dragProgress: 0,
    thresholdReached: false,
    direction: null
  });

  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const isGestureActiveRef = useRef<boolean>(false);
  const originalOverflowRef = useRef<string>('');

  // 1. Body Scroll Lock nativo al estar abierto
  useEffect(() => {
    if (!enabled) return;

    if (isOpen) {
      originalOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflowRef.current || '';
    }

    return () => {
      document.body.style.overflow = originalOverflowRef.current || '';
    };
  }, [isOpen, enabled]);

  // 2. Control de gestos táctiles
  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      touchStartXRef.current = touch.clientX;
      touchStartYRef.current = touch.clientY;

      // Apertura: Solo válida si inicia en la mitad inferior (pulgar derecho) y cerca del borde derecho
      if (!isOpen) {
        const isInBottomHalf = touch.clientY > screenHeight * 0.45;
        const isNearRightEdge = touch.clientX > screenWidth - 55;
        if (isInBottomHalf && isNearRightEdge) {
          isGestureActiveRef.current = true;
          setDragState({
            isDragging: true,
            dragOffsetPx: 0,
            dragProgress: 0,
            thresholdReached: false,
            direction: 'left'
          });
        } else {
          isGestureActiveRef.current = false;
        }
      } else {
        // Cierre: Válido desde cualquier sector del drawer abierto
        isGestureActiveRef.current = true;
        setDragState({
          isDragging: true,
          dragOffsetPx: 0,
          dragProgress: 0,
          thresholdReached: false,
          direction: 'right'
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isGestureActiveRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartXRef.current;
      const deltaY = touch.clientY - touchStartYRef.current;

      // Cancelar si el desplazamiento vertical domina (ratio 1.1)
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.1) {
        isGestureActiveRef.current = false;
        setDragState((prev) => ({ ...prev, isDragging: false }));
        return;
      }

      // Cálculo de progreso 1:1
      const offset = Math.abs(deltaX);
      const progress = Math.min(1, offset / (thresholdPx * 2));
      const thresholdReached = offset >= thresholdPx;
      const dir: 'left' | 'right' = deltaX < 0 ? 'left' : 'right';

      setDragState({
        isDragging: true,
        dragOffsetPx: deltaX,
        dragProgress: progress,
        thresholdReached,
        direction: dir
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isGestureActiveRef.current) return;
      isGestureActiveRef.current = false;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartXRef.current;
      const deltaY = touch.clientY - touchStartYRef.current;

      setDragState({
        isDragging: false,
        dragOffsetPx: 0,
        dragProgress: 0,
        thresholdReached: false,
        direction: null
      });

      // Ratio biomecánico horizontal
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
        if (!isOpen && deltaX < -thresholdPx) {
          onOpen();
        } else if (isOpen && deltaX > thresholdPx) {
          onClose();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onOpen, onClose, enabled, thresholdPx]);

  return { dragState };
}
