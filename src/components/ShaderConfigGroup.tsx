import React from 'react';
import { cn } from '../utils/helpers';

interface ShaderConfigGroupProps {
  title: string;
  enabled: boolean;
  onToggle: (val: boolean) => void;
  opacity: number;
  onOpacityChange: (val: number) => void;
  blendMode: string;
  onBlendModeChange: (val: string) => void;
  params: Record<string, number>;
  onParamsChange: (key: string, val: number) => void;
  controls: { key: string; label: string; min: number; max: number; step: number }[];
  colorTheme?: string;
}

export const ShaderConfigGroup: React.FC<ShaderConfigGroupProps> = ({
  title, enabled, onToggle, opacity, onOpacityChange, blendMode, onBlendModeChange,
  params, onParamsChange, controls, colorTheme = 'bg-sky-500'
}) => {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
            <span className="text-orange-500 font-black">Sh</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500">Configura este shader en todo el app</p>
          </div>
        </div>
        <button
          onClick={() => onToggle(!enabled)}
          className={cn("w-14 h-8 rounded-full transition-colors flex items-center px-1 shrink-0", enabled ? colorTheme : "bg-slate-300")}
        >
          <div className={cn("w-6 h-6 rounded-full bg-white transition-transform transform shadow-sm", enabled ? "translate-x-6" : "")} />
        </button>
      </div>

      {enabled && (
        <div className="flex flex-col gap-4 mt-2 p-5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 relative">
              <label className="text-xs font-bold text-slate-700">Opacidad (Global) {(opacity * 100).toFixed(0)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                className="w-full accent-slate-800"
              />
            </div>
            <div className="flex flex-col gap-2 relative">
              <label className="text-xs font-bold text-slate-700">Blend Mode (Global)</label>
              <select
                value={blendMode}
                onChange={(e) => onBlendModeChange(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
                <option value="color-dodge">Color Dodge</option>
                <option value="color-burn">Color Burn</option>
                <option value="hard-light">Hard Light</option>
                <option value="soft-light">Soft Light</option>
                <option value="difference">Difference</option>
                <option value="exclusion">Exclusion</option>
                <option value="hue">Hue</option>
                <option value="saturation">Saturation</option>
                <option value="color">Color</option>
                <option value="luminosity">Luminosity</option>
              </select>
            </div>
          </div>
          
          <hr className="border-slate-200 my-2" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Parámetros Internos</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {controls.map((c, idx) => (
              <div key={`${c.key}-${idx}`} className="flex flex-col gap-2">
                 <div className="flex justify-between items-center">
                   <label className="text-xs font-bold text-slate-700">{c.label}</label>
                   <span className="text-[10px] text-slate-400 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-100">
                     {params[c.key] !== undefined ? params[c.key] : ''}
                   </span>
                 </div>
                 <input
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={params[c.key] || 0}
                  onChange={(e) => onParamsChange(c.key, parseFloat(e.target.value))}
                  className="w-full accent-slate-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                 />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
