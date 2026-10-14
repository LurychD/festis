import { useSwipeDrawer, UseSwipeDrawerOptions, DragState } from './useSwipeDrawer';

export { useSwipeDrawer, type UseSwipeDrawerOptions, type DragState };

export interface UseDrawerSwipeGestureOptions {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  enabled?: boolean;
}

export function useDrawerSwipeGesture({
  isOpen,
  onOpen,
  onClose,
  enabled = true
}: UseDrawerSwipeGestureOptions) {
  const { dragState } = useSwipeDrawer({
    isOpen,
    onOpen,
    onClose,
    enabled
  });

  return { dragState };
}
