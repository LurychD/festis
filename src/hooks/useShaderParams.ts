import { useState, useEffect, useCallback } from 'react';

const DEFAULT_PAPER_PARAMS = { scale: 0.6, contrast: 0.3, roughness: 0.4, fiber: 0.3, crumples: 0.3, folds: 0.65, fade: 0, drops: 0.2 };
const DEFAULT_CMYK_PARAMS = { scale: 1, size: 0.2, contrast: 1, softness: 1, grainSize: 0.5, grainMixer: 0, grainOverlay: 0, gridNoise: 0.2, floodC: 0.15, floodM: 0, floodY: 0, floodK: 0 };
const DEFAULT_GRAIN_PARAMS = { scale: 0.6, speed: 0.5, stepsPerColor: 2, softness: 0 };

export const useShaderParams = () => {
  const [paperParams, setPaperParams] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('shader_paperParams');
    return saved ? JSON.parse(saved) : DEFAULT_PAPER_PARAMS;
  });

  const [cmykParams, setCmykParams] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('shader_cmykParams');
    return saved ? JSON.parse(saved) : DEFAULT_CMYK_PARAMS;
  });

  const [grainParams, setGrainParams] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('shader_grainParams');
    return saved ? JSON.parse(saved) : DEFAULT_GRAIN_PARAMS;
  });

  const updatePaperParam = useCallback((key: string, val: number) => {
    setPaperParams(prev => {
      const next = { ...prev, [key]: val };
      localStorage.setItem('shader_paperParams', JSON.stringify(next));
      return next;
    });
  }, []);

  const updateCmykParam = useCallback((key: string, val: number) => {
    setCmykParams(prev => {
      const next = { ...prev, [key]: val };
      localStorage.setItem('shader_cmykParams', JSON.stringify(next));
      return next;
    });
  }, []);

  const updateGrainParam = useCallback((key: string, val: number) => {
    setGrainParams(prev => {
      const next = { ...prev, [key]: val };
      localStorage.setItem('shader_grainParams', JSON.stringify(next));
      return next;
    });
  }, []);

  return {
    paperParams, updatePaperParam,
    cmykParams, updateCmykParam,
    grainParams, updateGrainParam
  };
};
