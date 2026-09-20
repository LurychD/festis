import React from 'react';
import { SocialPost } from '../../types';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Music } from 'lucide-react';

export interface InstagramSimulatorOptions {
  profileName: string;
  profileImage: string;
  mediaUrl: string;
  content: string;
  aspectRatio: '1:1' | '4:5' | '16:9';
  repostName?: string;
  isSharingPostToStory?: boolean;
  storyItems?: { id: string, type: 'text' | 'gif', content: string }[];
}

interface InstagramSimulatorProps {
  options: InstagramSimulatorOptions;
  format: 'post' | 'story' | 'reel';
}

export const InstagramSimulator: React.FC<InstagramSimulatorProps> = ({ options, format }) => {
  const { profileName, profileImage, mediaUrl, content, aspectRatio, repostName, isSharingPostToStory, storyItems } = options;
  
  const bgImg = mediaUrl || 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?ixlib=rb-4.0.3';
  const avatar = profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=80';
  const name = profileName || 'usuario';

  if (format === 'post') {
    const aspectClass = aspectRatio === '4:5' ? 'aspect-[4/5]' : aspectRatio === '16:9' ? 'aspect-video' : 'aspect-square';
    
    return (
      <div className="w-full max-w-[350px] mx-auto bg-white rounded-xl border border-slate-200 overflow-hidden text-sm shadow-md font-sans">
        {/* Header */}
        <div className="flex flex-col">
          {repostName && (
            <div className="flex items-center gap-2 px-3 pt-3 pb-1 text-slate-500 text-xs font-medium">
              <MoreHorizontal className="w-3 h-3" />
              <span>{repostName} ha reposteado esto</span>
            </div>
          )}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <img src={avatar} className="w-8 h-8 rounded-full object-cover bg-slate-200" alt="avatar" />
              <span className="font-bold text-slate-900">{name}</span>
            </div>
            <MoreHorizontal className="w-5 h-5 text-slate-900" />
          </div>
        </div>
        
        {/* Media */}
        <div className={`${aspectClass} bg-slate-100 relative`}>
          <img src={bgImg} alt="Post" className="w-full h-full object-cover" />
        </div>
        
        {/* Actions */}
        <div className="p-3 flex justify-between items-center">
          <div className="flex gap-4">
            <Heart className="w-6 h-6 text-slate-900" />
            <MessageCircle className="w-6 h-6 text-slate-900 z-10 scale-x-[-1]" />
            <Send className="w-6 h-6 text-slate-900" />
          </div>
          <Bookmark className="w-6 h-6 text-slate-900" />
        </div>
        <div className="px-3 pb-3">
          <p className="font-semibold text-slate-900 mb-1">102 Me gusta</p>
          <div className="flex flex-col">
            <p className="break-words">
              <span className="font-semibold text-slate-900 mr-2">{name}</span>
              <span className="text-slate-800 whitespace-pre-wrap">{content}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (format === 'story') {
    return (
      <div className="w-full max-w-[300px] aspect-[9/16] mx-auto rounded-xl overflow-hidden relative shadow-md font-sans bg-slate-900 flex flex-col justify-between">
        {/* Media Background */}
        <div className="absolute inset-0">
          {!isSharingPostToStory && (
            <img src={bgImg} alt="Story" className="w-full h-full object-cover opacity-90" />
          )}
          {isSharingPostToStory && (
            <div className="w-full h-full bg-gradient-to-tr from-orange-400 via-pink-500 to-purple-500 flex items-center justify-center p-6">
              <div className="bg-white p-2 pb-6 rounded-lg shadow-xl w-full rotate-2 transform-gpu">
                <div className="flex items-center gap-2 p-2">
                  <img src={avatar} className="w-6 h-6 rounded-full object-cover bg-slate-200" alt="avatar" />
                  <span className="font-bold text-slate-900 text-xs">{name}</span>
                </div>
                <div className="aspect-square bg-slate-100 rounded-md overflow-hidden">
                  <img src={bgImg} alt="Story post" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Story Elements (Stickers / Text / GIF) */}
        {!isSharingPostToStory && storyItems && storyItems.map((item, i) => (
          <div key={`${item.id}-${i}`} className="absolute z-20 w-full text-center mt-32" style={{ top: `${(i * 15) + 20}%`}}>
            {item.type === 'text' ? (
              <span className="bg-black/60 text-white rounded-lg px-4 py-2 text-lg font-bold shadow-lg">
                {item.content}
              </span>
            ) : (
              <img src={item.content} alt="gif" className="h-24 mx-auto drop-shadow-lg" />
            )}
          </div>
        ))}

        {/* Top Overlay */}
        <div className="relative z-10 w-full p-3 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex gap-1 mb-3">
            <div className="flex-1 h-0.5 bg-white/80 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <img src={avatar} className="w-8 h-8 rounded-full border border-white object-cover bg-slate-200" alt="avatar" />
            <span className="font-bold text-white text-sm drop-shadow-md">{name}</span>
            <span className="text-white/80 text-xs drop-shadow-md">3h</span>
          </div>
        </div>
        
        {/* Bottom Overlay */}
        <div className="relative z-10 p-4 bg-gradient-to-t from-black/50 to-transparent">
          {content && !isSharingPostToStory && (!storyItems || storyItems.length === 0) && (
            <div className="text-white text-center mb-4 text-sm font-semibold whitespace-pre-wrap drop-shadow-md">
              {content}
            </div>
          )}
          <div className="flex gap-3 items-center">
            <div className="flex-1 border border-white/40 rounded-full h-10 flex items-center px-4 text-white/80 text-sm">
              Enviar mensaje
            </div>
            <Heart className="w-6 h-6 text-white" />
            <Send className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  }

  if (format === 'reel') {
    return (
      <div className="w-full max-w-[300px] aspect-[9/16] mx-auto rounded-xl overflow-hidden relative shadow-md font-sans bg-slate-900">
         <div className="absolute inset-0">
          <img src={bgImg} alt="Reel" className="w-full h-full object-cover opacity-90" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <img src={avatar} className="w-8 h-8 rounded-full border border-white object-cover bg-slate-200" alt="avatar" />
                <span className="font-bold text-white text-sm drop-shadow-md">{name}</span>
                <button className="border border-white text-white px-3 py-1 rounded-lg text-xs font-semibold ml-2">Seguir</button>
              </div>
              <p className="text-white text-sm font-medium whitespace-pre-wrap line-clamp-3 mb-4 drop-shadow-md">{content}</p>
              <div className="flex items-center gap-2 text-white bg-white/20 w-max px-3 py-1 rounded-full text-xs flex-nowrap font-semibold backdrop-blur-sm">
                <Music className="w-3 h-3" /> Sonido original
              </div>
            </div>
            <div className="flex flex-col justify-end items-center gap-6 pb-2">
               <div className="flex flex-col items-center gap-1 text-white">
                 <Heart className="w-7 h-7 text-white" />
                 <span className="text-xs font-semibold">10K</span>
               </div>
               <div className="flex flex-col items-center gap-1 text-white">
                 <MessageCircle className="w-7 h-7 text-white scale-x-[-1]" />
                 <span className="text-xs font-semibold">142</span>
               </div>
               <div className="flex flex-col items-center gap-1 text-white">
                 <Send className="w-7 h-7 text-white" />
               </div>
               <div className="flex flex-col items-center gap-1 text-white">
                 <MoreHorizontal className="w-6 h-6 text-white" />
               </div>
               <div className="w-8 h-8 rounded-md bg-white border-2 border-white/50 overflow-hidden relative">
                  <img src={avatar} className="w-full h-full object-cover" alt="audio profile" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Music className="w-3 h-3 text-white" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
