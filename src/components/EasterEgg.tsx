import React, { useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Float, useGLTF } from '@react-three/drei';
import { CustomMug } from './Models3D';

interface EasterEggViewProps {
  showToast?: (msg: string) => void;
  addAuditLog?: (collection: string, details: string) => void;
  userName?: string;
}

export const EasterEggView: React.FC<EasterEggViewProps> = ({ showToast, addAuditLog, userName = 'Usuario' }) => {
  const hasLogged = useRef(false);

  useEffect(() => {
    if (!hasLogged.current) {
      hasLogged.current = true;
      if (showToast) {
        showToast("Easter egg #1 encontrado!");
      }
      if (addAuditLog) {
        addAuditLog('easter_egg', `${userName} ha encontrado el easter egg #1 (Taza 3D).`);
      }
    }
  }, [showToast, addAuditLog, userName]);

  return (
    <div className="flex flex-col items-center p-4 space-y-2 h-full min-h-[80vh]">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-black uppercase text-[#e91e63] tracking-widest">
          RECUERDOS
        </h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Arrastra para rotar la taza
        </p>
      </div>
      
      <div className="w-full grow aspect-video bg-transparent rounded-3xl overflow-hidden relative cursor-crosshair">
          <Canvas camera={{ position: [0, 2, 8] }}>
            <ambientLight intensity={0.6} />
            <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={1.5} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            
            <Suspense fallback={null}>
              <Float speed={2} rotationIntensity={0.5} floatIntensity={1} position={[0, -1, 0]}>
                 <CustomMug scale={1.5} />
              </Float>
              <Environment preset="city" />
            </Suspense>

            <OrbitControls 
              enableZoom={true} 
              enablePan={false}
              autoRotate={true}
              autoRotateSpeed={1.0}
              minDistance={2} 
              maxDistance={15} 
            />
          </Canvas>
      </div>
    </div>
  );
};
