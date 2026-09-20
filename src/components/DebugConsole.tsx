import { useState, useEffect } from 'react';

export function DebugConsole() {
  const [logs, setLogs] = useState<{timestamp: string; type: string; message: string}[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        if (window.innerWidth >= 1024) {
          document.body.style.paddingRight = '400px';
        } else {
          document.body.style.paddingRight = '';
        }
      }
    };

    if (isOpen) {
      handleResize();
    } else {
      document.body.style.paddingRight = '';
    }
    
    window.addEventListener('resize', handleResize);
    return () => {
      document.body.style.paddingRight = '';
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  useEffect(() => {
    const formatArgs = (args: any[]) => args.map(a => {
        try {
            return typeof a === 'object' ? JSON.stringify(a) : String(a);
        } catch {
            return String(a);
        }
    }).join(' ');

    const getTimestamp = () => {
        const now = new Date();
        return `${now.toLocaleDateString()} ${now.toLocaleTimeString()}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    };

    const originalError = console.error;
    console.error = (...args) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, { timestamp: getTimestamp(), type: 'ERROR', message: formatArgs(args) }]);
      }, 0);
      originalError.apply(console, args);
    };

    const originalLog = console.log;
    console.log = (...args) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, { timestamp: getTimestamp(), type: 'LOG', message: formatArgs(args) }]);
      }, 0);
      originalLog.apply(console, args);
    };
    
    const handleWindowError = (event: ErrorEvent) => {
      setLogs((prev) => [...prev, { timestamp: getTimestamp(), type: 'WINDOW ERROR', message: `${event.message} at ${event.filename}:${event.lineno}` }]);
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setLogs((prev) => [...prev, { timestamp: getTimestamp(), type: 'PROMISE REJECTION', message: String(event.reason) }]);
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalError;
      console.log = originalLog;
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl z-[300] text-xs font-mono font-bold hover:scale-105 transition-transform"
      >
        🐞 Consola
      </button>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-[290] lg:hidden backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed right-0 w-full h-[80vh] bottom-0 mt-auto lg:top-0 lg:h-full lg:mt-0 lg:w-[400px] bg-slate-950 text-green-400 font-mono text-[10px] sm:text-xs z-[300] flex flex-col lg:border-l border-t lg:border-t-0 border-slate-800 shadow-2xl rounded-t-2xl lg:rounded-t-none">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900 rounded-t-2xl lg:rounded-t-none">
          <h3 className="font-bold text-white flex items-center gap-2">🐞 Consola</h3>
          <div className="space-x-4">
            <button onClick={() => setLogs([])} className="text-slate-400 hover:text-white uppercase tracking-wider font-bold">Clear</button>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white uppercase tracking-wider font-bold">Cerrar</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">Esperando logs...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="break-all border-b border-slate-900 pb-2">
                <span className="text-slate-500 block mb-1 text-[9px] sm:text-[10px]">[{log.timestamp}]</span>
                <span className={log.type.includes('ERROR') ? 'text-red-400' : 'text-green-400'}>
                  [{log.type}] {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
