import React, { Component, ReactNode, useState, useEffect } from 'react';
import { AlertCircle, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  sectionName: string;
  addAuditLog: (collection: string, details?: string) => void;
  setView: (view: any) => void;
  showAlert?: (title: string, errorCode?: string) => void;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

const CrashTrigger = ({ sectionName, children }: { sectionName: string, children: ReactNode }) => {
  const shouldCrash = localStorage.getItem("forceCrash") === sectionName;
  
  if (shouldCrash) {
    localStorage.removeItem("forceCrash");
    throw new Error(`Crash forzado (simulado) en ${sectionName}`);
  }

  return <>{children}</>;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { sectionName, addAuditLog, showAlert } = this.props;
    const e = `${error.message}`;
    
    // Log silencioso al auditlog (evitamos alert o toast invasivo aquí para no romper el flujo)
    addAuditLog(`Error (Crash) interceptado en sección: ${sectionName} | ${e}`);

    if (showAlert) {
       showAlert(`Error en ${sectionName}`, e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 border border-red-500/30 bg-red-500/10 rounded-lg flex flex-col gap-3 text-red-200">
          <div className="flex items-center gap-3">
             <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
             <div>
               <p className="font-semibold text-sm">El componente "{this.props.sectionName}" ha fallado</p>
               <p className="text-xs text-red-300 opacity-80 mt-1">{this.state.errorMsg}</p>
             </div>
          </div>
          <div className="mt-2">
             <button 
               onClick={() => this.props.setView('bugs')}
               className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition shadow-sm w-fit"
             >
               <Bug className="w-3.5 h-3.5" />
               Ver Radar de Bugs
             </button>
          </div>
        </div>
      );
    }

    return <CrashTrigger sectionName={this.props.sectionName}>{this.props.children}</CrashTrigger>;
  }
}
