import React, { useState } from 'react';
import { Festival, GalleryItem, SocialPost, Task } from '../../types';
import { useFirestoreSyncArray } from '../../hooks/useFirestoreSync';
import { SocialMediaAgenda } from './SocialMediaAgenda';
import { SocialMediaBoard } from './SocialMediaBoard';
import { SocialMediaPreview } from './SocialMediaPreview';
import { LayoutGrid, Calendar, MonitorPlay } from 'lucide-react';

interface SocialMediaViewProps {
  festivals: Festival[];
  gallery: GalleryItem[];
  tasks: Task[];
  userName: string;
  showAlert: (msg: string) => void;
  showToast: (msg: string) => void;
  setView: (view: any) => void;
  isAuthorized: boolean;
  setConfirmConfig: (config: any) => void;
}

export const SocialMediaView: React.FC<SocialMediaViewProps> = ({
  festivals,
  gallery,
  tasks,
  userName,
  showAlert,
  showToast,
  setView,
  isAuthorized,
  setConfirmConfig
}) => {
  const [posts, setPosts] = useFirestoreSyncArray<SocialPost>("social_posts");
  const [activeTab, setActiveTab] = useState<'board' | 'calendar' | 'preview'>('calendar');

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Main Content */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'calendar' && (
          <SocialMediaAgenda 
            posts={posts} 
            festivals={festivals}
            onNavigateToBoard={() => setActiveTab('board')}
          />
        )}
        {activeTab === 'board' && (
          <SocialMediaBoard 
            posts={posts} 
            setPosts={setPosts} 
            festivals={festivals} 
            tasks={tasks}
            gallery={gallery}
            userName={userName}
            isAuthorized={isAuthorized}
            showToast={showToast}
            setConfirmConfig={setConfirmConfig}
          />
        )}
        {activeTab === 'preview' && (
          <SocialMediaPreview posts={posts} userName={userName} />
        )}
      </div>

      {/* Social Media Bottom Bar */}
      <nav className="fixed bottom-6 left-0 right-0 w-full flex justify-center px-4 z-50 no-print">
        <div className="glass w-full max-w-sm flex items-center justify-around py-4 px-2 bg-sky-900/95 shadow-2xl backdrop-blur-3xl border-sky-800 rounded-3xl">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`p-2 transition-all flex flex-col items-center gap-1 ${
              activeTab === 'calendar' ? 'text-sky-200 scale-110' : 'text-sky-500 hover:text-sky-300'
            }`}
          >
            <Calendar className="h-6 w-6" />
            <span className="text-[8px] font-bold uppercase">Agenda</span>
          </button>

          <button
            onClick={() => setActiveTab('board')}
            className={`p-2 transition-all flex flex-col items-center gap-1 relative ${
              activeTab === 'board' ? 'text-sky-200 scale-110' : 'text-sky-500 hover:text-sky-300'
            }`}
          >
            <LayoutGrid className="h-6 w-6" />
            <span className="text-[8px] font-bold uppercase">Pizarra</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`p-2 transition-all flex flex-col items-center gap-1 relative ${
              activeTab === 'preview' ? 'text-sky-200 scale-110' : 'text-sky-500 hover:text-sky-300'
            }`}
          >
            <MonitorPlay className="h-6 w-6" />
            <span className="text-[8px] font-bold uppercase">Preview</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
