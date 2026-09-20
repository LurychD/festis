import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const fragmentShader = `
uniform float u_time;
uniform vec2 u_resolution;

#define MAX_ITER 5

void main() {
    vec2 p = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv = p * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    vec2 i = vec2(uv);
    float c = 1.0;
    float inten = .005;

    for (int n = 0; n < MAX_ITER; n++) {
        float t = u_time * (1.0 - (3.5 / float(n+1)));
        i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
        c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
    }

    c /= float(MAX_ITER);
    c = 1.17-pow(abs(c), 1.4);
    vec3 col = vec3(pow(abs(c), 8.0));
    
    // Convert to ocean colors
    vec3 ocean = mix(vec3(0.0, 0.4, 0.8), vec3(0.0, 0.8, 0.9), col.x * 0.5 + p.y * 0.5);
    ocean = mix(vec3(0.0, 0.1, 0.3), ocean, c);
    
    gl_FragColor = vec4(ocean, 1.0);
}
`;

const vertexShader = `
void main() {
    gl_Position = vec4(position, 1.0);
}
`;

const ShaderQuad = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    [size]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.getElapsedTime();
      const dpr = state.viewport.dpr || state.gl.getPixelRatio() || 1;
      materialRef.current.uniforms.u_resolution.value.set(state.size.width * dpr, state.size.height * dpr);
    }
  });

  return (
    <mesh ref={meshRef} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

interface OceanShaderProps {
  onClose: () => void;
}

export const OceanShader: React.FC<OceanShaderProps> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 z-[99999] bg-black cursor-crosshair animate-in fade-in duration-1000"
      onClick={onClose}
    >
      <div className="absolute top-8 left-0 w-full text-center z-10 pointer-events-none">
         <h2 className="text-white font-black uppercase tracking-[0.5em] text-sm md:text-xl mix-blend-overlay opacity-50 drop-shadow-lg">
            SECRET LEVEL UNLOCKED
         </h2>
      </div>
      <div className="absolute inset-0">
        <Canvas orthographic camera={{ position: [0, 0, 1] }} style={{ width: '100%', height: '100%' }}>
          <ShaderQuad />
        </Canvas>
      </div>
      <div className="absolute bottom-8 text-center w-full z-10 pointer-events-none">
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
           Festis Shaders - Ocean Waves
        </p>
      </div>
    </div>
  );
};

export default OceanShader;
