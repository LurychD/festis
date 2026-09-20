import React from 'react';
import { BugTrackerView } from './BugTracker';
import { BugTicket } from '../types';
import { Lock } from 'lucide-react';

interface BugsRoadmapViewProps {
  bugs: BugTicket[];
  setBugs: React.Dispatch<React.SetStateAction<BugTicket[]>>;
  showAlert: (msg: string) => void;
  addAuditLog: (c: string, d: string) => void;
  userName: string;
  isAuthorized: boolean;
}

export const BugsRoadmapView: React.FC<BugsRoadmapViewProps> = ({
  bugs, setBugs, showAlert, addAuditLog, userName, isAuthorized
}) => {
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 shadow-inner">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Acceso Restringido</h2>
        <p className="text-slate-600 max-w-sm">No tienes acceso a esta sección. Contacta al desarrollador si crees que esto es un error.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32">
       <header className="flex flex-col gap-1 items-center">
         <h2 className="text-3xl font-bold text-slate-800 text-center">Bug Tracker</h2>
         <p className="text-slate-600 font-semibold text-xs">Reporte y gestión de errores</p>
       </header>

       <div className="space-y-4">
         <BugTrackerView bugs={bugs} setBugs={setBugs} showAlert={showAlert} addAuditLog={addAuditLog} userName={userName} isAuthorized={isAuthorized} />
       </div>
    </div>
  );
};
