import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { cn } from '../utils/helpers';

export interface PlanningViewRef {
  reloadBoard: () => void;
}

interface PlanningViewProps {
  userName?: string;
  isAuthorized?: boolean;
}

export const PlanningView = forwardRef<PlanningViewRef, PlanningViewProps>((props, ref) => {
  const [iframeKey, setIframeKey] = useState(0);

  useImperativeHandle(ref, () => ({
    reloadBoard: () => {
      setIframeKey((prev) => prev + 1);
    },
  }));

  return (
    <div className="w-full h-[calc(100vh-95px)] min-h-[600px] rounded-3xl border-2 border-slate-200/80 shadow-lg shadow-slate-200/50 overflow-hidden bg-white relative">
      <iframe
        key={iframeKey}
        src="https://excalidraw.com"
        title="Excalidraw Pizarra de Planificación"
        className="w-full h-full border-0"
        allow="clipboard-read; clipboard-write; web-share"
      />
    </div>
  );
});

PlanningView.displayName = 'PlanningView';
