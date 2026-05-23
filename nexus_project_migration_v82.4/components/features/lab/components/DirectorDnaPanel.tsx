
import React from 'react';
import { motion } from 'motion/react';
import { CinematicDirectorDNA, GroundedValue } from '../../../../types';
import { Dna, Move, Sun, Box, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { r2 } from '../services/dnaProcessor';
import { APP_VERSION } from '../constants/lab.constants';

interface DirectorDnaPanelProps {
  dna: CinematicDirectorDNA;
}

const GroundedMetric: React.FC<{ label: string, data: any }> = ({ label, data }) => {
    const isGrounded = data && typeof data === 'object' && 'reasoning' in data;
    const value = isGrounded ? data.value : (typeof data === 'number' ? data : null);
    const confidence = isGrounded ? data.confidence : 0.9;
    const reasoning = isGrounded ? data.reasoning : "Legacy direct observation";
    const source = isGrounded ? data.source : 'observed';

    const isPending = value === null;

    return (
        <div className="group relative space-y-2">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-tighter truncate">{label.replace(/_/g, ' ')}</span>
                    {isGrounded && (
                        <div className={`w-1 h-1 rounded-full ${confidence > 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    )}
                </div>
                <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black tracking-tight ${isPending ? 'text-white/40 italic' : 'text-white/70'}`}>
                        {isPending ? 'INFERRED' : (typeof value === 'number' ? r2(value) : (Array.isArray(value) ? 'VECTOR' : value))}
                    </span>
                </div>
            </div>
            
            <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
                {!isPending && typeof value === 'number' && (
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (value / (label.includes('duration') ? 10 : 1)) * 100)}%` }}
                        className={`h-full ${confidence > 0.8 ? 'bg-white/40' : 'bg-amber-500/40'}`}
                    />
                )}
            </div>

            {/* Hover Tooltip */}
            <div className="absolute left-0 bottom-full mb-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-2">
                        {confidence > 0.8 ? <ShieldCheck size={10} className="text-emerald-400" /> : <ShieldAlert size={10} className="text-amber-400" />}
                        <span className="text-[8px] font-black text-white/50 uppercase">Grounding Report</span>
                    </div>
                    <p className="text-[9px] text-white/80 leading-relaxed italic">"{reasoning}"</p>
                    <div className="mt-2 flex justify-between items-center border-t border-white/5 pt-2">
                        <span className="text-[7px] font-black text-white/30 uppercase">Source: {source}</span>
                        <span className="text-[7px] font-black text-white/30 uppercase">Conf: {Math.round(confidence * 100)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const DirectorDnaPanel: React.FC<DirectorDnaPanelProps> = ({ dna }) => {
  return (
    <div className="bg-[#111111] rounded-[48px] border border-white/5 p-10 space-y-12 bg-gradient-to-br from-white/[0.02] to-transparent">
        <div className="flex items-center gap-6 border-b border-white/5 pb-8">
            <div className="w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center text-white/40 border border-white/10 shadow-xl">
                <Dna size={32} />
            </div>
            <div>
                <h4 className="text-2xl font-black uppercase tracking-tighter italic text-white">Director DNA Synthesis</h4>
                <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.3em] mt-1">{APP_VERSION} Evidence-Grounded Production Controller</p>
            </div>
        </div>

        <div className="grid grid-cols-4 gap-12">
            {[
                { label: "Camera Motion", icon: <Move size={18} />, data: dna.camera_motion },
                { label: "Lens Behavior", icon: <Box size={18} />, data: dna.lens_behavior },
                { label: "Light Physics", icon: <Sun size={18} />, data: dna.lighting_behavior },
                { label: "Edit Pacing", icon: <Clock size={18} />, data: dna.editing_pacing }
            ].map((section, idx) => (
                <div key={idx} className="space-y-8">
                    <div className="flex items-center gap-3 text-white/40">
                        {section.icon}
                        <h5 className="text-[11px] font-black uppercase tracking-widest">{section.label}</h5>
                    </div>
                    <div className="space-y-6">
                        {Object.entries(section.data).map(([key, val], kIdx) => (
                             <GroundedMetric key={kIdx} label={key} data={val} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
