import React from 'react';
import { Hammer } from 'lucide-react';

interface SocialMediaPreviewProps {
  posts: any[];
  userName: string;
}

export const SocialMediaPreview: React.FC<SocialMediaPreviewProps> = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-sky-800">
      <div className="bg-white p-12 rounded-[3rem] shadow-sm border-4 border-dashed border-sky-100 flex flex-col items-center gap-6 text-center max-w-lg mx-auto">
        <div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center">
          <Hammer className="w-10 h-10 text-sky-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">Simulador Web</h2>
          <h3 className="text-xl font-bold uppercase tracking-widest text-sky-400 mt-1">Próximamente</h3>
        </div>
        <p className="text-sm font-medium text-slate-500 leading-relaxed">
          Estamos rediseñando esta sección para ofrecerte una previsualización más precisa y ligera de tus campañas sociales.
        </p>
      </div>
    </div>
  );
};
