import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';
import { CustomMug } from './Models3D';
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock 
} from 'lucide-react';

interface PlayZoneViewProps {
  setView: (view: any) => void;
  userEasterEggs?: {
    email?: string;
    unlockedEggs?: string[];
    lastUpdated?: string;
  };
}

export const PlayZoneView: React.FC<PlayZoneViewProps> = ({ setView, userEasterEggs }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  const unlockedFromDb = userEasterEggs?.unlockedEggs?.includes("cup_3d") || localStorage.getItem("easterEggUnlocked") === "true";

  const items = [
    {
      id: "cup_3d",
      name: "Taza de Mamá",
      subtitle: "cafesito uwu",
      description: "",
      unlocked: unlockedFromDb,
      render: () => (
        <div className="w-full h-[320px] relative cursor-grab active:cursor-grabbing flex items-center justify-center">
          <Canvas camera={{ position: [0, 1.8, 6.5] }}>
            {/* General illumination for full and clear object visibility */}
            <ambientLight intensity={0.75} />
            <directionalLight position={[5, 5, 5]} intensity={1.5} />
            <pointLight position={[-5, -5, -5]} intensity={0.5} />
            
            <Suspense fallback={null}>
              <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.2} position={[0, -0.2, 0]}>
                 <CustomMug scale={3.0} />
              </Float>
              <Environment preset="city" />
            </Suspense>

            <OrbitControls 
              enableZoom={false} 
              enablePan={false}
              autoRotate={true}
              autoRotateSpeed={1.5}
            />
          </Canvas>
        </div>
      )
    },
    {
      id: "secret_2",
      name: "Secreto Encriptado",
      subtitle: "Seguí buscando",
      description: "",
      unlocked: false,
    },
    {
      id: "secret_3",
      name: "Misterio Oculto",
      subtitle: "Seguí buscando",
      description: "",
      unlocked: false,
    }
  ];

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const activeItem = items[currentIndex];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 250 : -250,
      opacity: 0,
      scale: 0.92
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1] as any // Custom easeOutExpo
      }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 250 : -250,
      opacity: 0,
      scale: 0.92,
      transition: {
        duration: 0.35,
        ease: [0.7, 0, 0.84, 0] as any // Custom easeInExpo
      }
    })
  };

  return (
    <div className="relative min-h-screen w-full bg-[#020205] text-slate-100 overflow-x-hidden flex flex-col justify-between selection:bg-rose-500/30 selection:text-rose-300 font-sans">
      
      {/* Stars Background Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.15] mix-blend-color-dodge" />
      </div>

      {/* Header Bar */}
      <header className="relative z-20 px-6 py-5 flex items-center justify-between border-b border-white/[0.03] bg-[#020205]/40 backdrop-blur-md">
        <button 
          onClick={() => setView('config')}
          className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.12] rounded-xl transition-all text-slate-400 hover:text-slate-100 border border-white/[0.05] flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver
        </button>
        
        {/* PlayZone Title and count have been removed per user's instructions */}
        <div />
        <div />
      </header>

      {/* Main Showcase Stage */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        
        {/* Carousel Slider Wrapper */}
        <div className="w-full max-w-2xl flex items-center justify-between gap-4">
          
          {/* Left Arrow Button */}
          <button 
            onClick={handlePrev}
            className="p-3 rounded-full bg-white/[0.02] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/[0.05] hover:border-white/[0.1] text-slate-400 hover:text-white transition-all transform hover:scale-110 active:scale-95 shrink-0"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Core Spotlight Display Area */}
          <div className="flex-1 min-h-[360px] flex items-center justify-center overflow-hidden relative">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`zone-stage-${currentIndex}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full flex flex-col items-center justify-center"
              >
                {activeItem.unlocked && activeItem.render ? (
                  // Unlocked Model
                  activeItem.render()
                ) : (
                  // Locked Question Mark Emblem
                  <div className="w-full h-[320px] flex flex-col items-center justify-center">
                    <motion.div 
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      className="w-24 h-24 rounded-full border border-dashed border-white/10 bg-white/[0.01] flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.02)] relative group"
                    >
                      <Lock className="h-8 w-8 text-slate-700 group-hover:text-slate-500 transition-colors" />
                      <div className="absolute inset-0 rounded-full border border-dashed border-white/5 animate-spin-slow" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Arrow Button */}
          <button 
            onClick={handleNext}
            className="p-3 rounded-full bg-white/[0.02] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/[0.05] hover:border-white/[0.1] text-slate-400 hover:text-white transition-all transform hover:scale-110 active:scale-95 shrink-0"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Subtitle & Labels Underneath */}
        <div className="text-center mt-6 max-w-md px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`zone-desc-${currentIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <h2 className="text-lg font-black uppercase tracking-wider text-white">
                {activeItem.unlocked ? activeItem.name : "Recuerdo Bloqueado"}
              </h2>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                {activeItem.unlocked ? activeItem.subtitle : "Seguí buscando"}
              </p>
              {activeItem.unlocked && activeItem.description && (
                <p className="text-xs text-slate-600 font-bold tracking-wide uppercase pt-1">
                  {activeItem.description}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Indicator Dots */}
        <div className="flex justify-center gap-2.5 mt-10">
          {items.map((_, idx) => (
            <button
              key={`pz-dot-${idx}`}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === idx ? "bg-white w-6" : "bg-white/10 hover:bg-white/25"
              }`}
            />
          ))}
        </div>
      </main>

      {/* Subtle bottom manual instruction bar */}
      <footer className="relative z-10 py-6 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest border-t border-white/[0.02] bg-[#020205]/20">
        Usa las flechas laterales o el teclado para explorar la galería de recuerdos
      </footer>
    </div>
  );
};
