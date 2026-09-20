import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export const CustomMug = (props: any) => {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);
  const { scene } = useGLTF('/models/Taza_Cdg_1.glb');
  
  const customMaterials = useRef<THREE.Mesh[]>([]);
  const liquidMeshRef = useRef<THREE.Mesh | null>(null);

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    customMaterials.current = [];
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = (mesh.material as THREE.Material).clone();
        
        const isLiquid = mesh.name.toLowerCase().includes('coffee') || 
                         mesh.name.toLowerCase().includes('liquid') || 
                         mesh.name.toLowerCase().includes('café') || 
                         (mesh.material as any).name?.toLowerCase().includes('coffee');
                         
        if (isLiquid) {
           liquidMeshRef.current = mesh;
           // Liquid can be smoother and darker
           if ((mesh.material as any).isMeshStandardMaterial) {
               (mesh.material as THREE.MeshStandardMaterial).roughness = 0.2;
           }
           
           mesh.material.onBeforeCompile = (shader) => {
              shader.uniforms.slosh = { value: new THREE.Vector2(0, 0) };
              mesh.userData.shader = shader;
              if (!shader.vertexShader.includes('uniform vec2 slosh;')) {
                 shader.vertexShader = `uniform vec2 slosh;\n` + shader.vertexShader;
                 shader.vertexShader = shader.vertexShader.replace(
                   `#include <begin_vertex>`,
                   `#include <begin_vertex>\n` +
                   `transformed.y += (position.x * slosh.x + position.z * slosh.y) * 0.5;\n`
                 );
              }
           };
           (mesh.material as any).customProgramCacheKey = () => 'liquidSlosh';
           customMaterials.current.push(mesh);
        } else {
           // Ceramic PBR settings
           if ((mesh.material as any).isMeshStandardMaterial) {
               (mesh.material as THREE.MeshStandardMaterial).roughness = 0.1; // Brille un poquito
               (mesh.material as THREE.MeshStandardMaterial).metalness = 0.05;
           }
        }
      }
    });
    return clone;
  }, [scene]);
  
  const outlineScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        
        const isLiquid = mesh.name.toLowerCase().includes('coffee') || 
                         mesh.name.toLowerCase().includes('liquid') || 
                         mesh.name.toLowerCase().includes('café') || 
                         (mesh.material as any).name?.toLowerCase().includes('coffee');
                         
        if (isLiquid) {
           mesh.visible = false;
           return;
        }

        mesh.material = new THREE.MeshBasicMaterial({
          color: '#972f8d',
          side: THREE.BackSide,
        });
        
        mesh.material.onBeforeCompile = (shader) => {
          shader.uniforms.time = { value: 0 };
          mesh.userData.shader = shader;
          if (!shader.vertexShader.includes('uniform float time;')) {
              shader.vertexShader = `uniform float time;\n` + shader.vertexShader;
              shader.vertexShader = shader.vertexShader.replace(
                `#include <begin_vertex>`,
                `#include <begin_vertex>\n` +
                `float steppedTime = floor(time * 12.0) / 12.0;\n` +
                `float noise = sin(position.x * 20.0 + steppedTime * 10.0) * cos(position.y * 20.0 + steppedTime * 10.0) * sin(position.z * 20.0 + steppedTime * 10.0);\n` +
                `transformed += normal * noise * 0.005;\n` +
                `transformed += normal * 0.025;\n` + // uniform outline expansion 
                `transformed.y -= 0.015;\n` // Slight manual offset down to compensate for thickness
              );
          }
        };
        (mesh.material as any).customProgramCacheKey = () => 'outlineWobble';
        customMaterials.current.push(mesh);
      }
    });
    return clone;
  }, [scene]);

  useEffect(() => {
     customMaterials.current = [];
     clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.userData.shader) {
            customMaterials.current.push(child as THREE.Mesh);
        }
     });
     outlineScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.userData.shader) {
            customMaterials.current.push(child as THREE.Mesh);
        }
     });
  }, [clonedScene, outlineScene]);

  const prevTheta = useRef(0);
  const sloshVelocity = useRef({ x: 0, z: 0 });
  const sloshRotation = useRef({ x: 0, z: 0 });

  useFrame((state) => {
    customMaterials.current.forEach(mesh => {
       if (mesh.userData.shader && mesh.userData.shader.uniforms.time) {
           mesh.userData.shader.uniforms.time.value = state.clock.elapsedTime;
       }
    });

    // Física de sloshing
    const theta = Math.atan2(state.camera.position.x, state.camera.position.z);
    let deltaTheta = theta - prevTheta.current;
    
    if (deltaTheta > Math.PI) deltaTheta -= Math.PI * 2;
    if (deltaTheta < -Math.PI) deltaTheta += Math.PI * 2;
    if (Math.abs(deltaTheta) > 0.5) deltaTheta = 0; // Prevenir el rebote enorme en el primer frame
    
    prevTheta.current = theta;

    sloshVelocity.current.x += deltaTheta * 0.5;
    sloshVelocity.current.x -= sloshRotation.current.x * 0.15; // Spring force back to 0
    sloshVelocity.current.x *= 0.85; // Damping
    sloshRotation.current.x += sloshVelocity.current.x;

    if (liquidMeshRef.current && liquidMeshRef.current.userData.shader) {
        liquidMeshRef.current.userData.shader.uniforms.slosh.value.x = sloshRotation.current.x * Math.cos(theta);
        liquidMeshRef.current.userData.shader.uniforms.slosh.value.y = -sloshRotation.current.x * Math.sin(theta);
    }
  });

  return (
    <group ref={ref} {...props} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
      <primitive object={outlineScene} />
      <primitive object={clonedScene} />
    </group>
  );
};

useGLTF.preload('/models/Taza_Cdg_1.glb');
