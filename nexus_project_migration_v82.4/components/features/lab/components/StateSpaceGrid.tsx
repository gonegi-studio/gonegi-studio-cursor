
import React from 'react';
import { motion } from 'motion/react';
import { CinematicSceneState } from '../../../../types';
import { Activity, Heart, Clock, Zap, ShieldAlert, ShieldCheck } from 'lucide-react';

interface StateSpaceGridProps {
  state: CinematicSceneState;
}

const StateCell: React.FC<{ label: string, val: any }> = ({ label, val }) => {
    const isGrounded = val && typeof val === 'object' && 'reasoning' in val;
    const value = isGrounded ? val.value : (typeof val === 'number' ? val : (typeof val === 'object' ? val.value : val));
    const confidence = isGrounded ? val.confidence : 0.9;
    const reasoning = isGrounded ? val.reasoning : "Observed state";
    
    const isPending = value === null;

    return (
        <div className="group relative flex justify-between items-center border-b border-white/[0.03] pb-2">
            <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[8px] font-black text-white/20 uppercase truncate max-w-[80px]">{label.replace(/_/g, ' ')}</span>
                {isGrounded && <div className={`w-1 h-1 rounded-full ${confidence > 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`} />}
            </div>
            <span className={`text-[10px] font-mono ${isPending ? 'text-white/40 italic' : 'text-white/80'}`}>
                {isPending ? 'INFERRED' : (typeof value === 'number' ? value.toFixed(2) : (Array.isArray(value) ? 'VEC' : value))}
            </span>

            {/* Hover Tooltip */}
            <div className="absolute right-0 bottom-full mb-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-2">
                        {confidence > 0.8 ? <ShieldCheck size={10} className="text-emerald-400" /> : <ShieldAlert size={10} className="text-amber-400" />}
                        <span className="text-[8px] font-black text-white/50 uppercase">Analysis Logic</span>
                    </div>
                    <p className="text-[9px] text-white/80 leading-relaxed italic">"{reasoning}"</p>
                </div>
            </div>
        </div>
    );
};

export const StateSpaceGrid: React.FC<StateSpaceGridProps> = ({ state }) => {
  return (
    <div className="grid grid-cols-4 gap-6">
        {[
            { label: "Physics Space", icon: <Activity className="text-blue-400" />, data: state.physics, color: "from-blue-500/10" },
            { label: "Emotion Space", icon: <Heart className="text-red-400" />, data: state.emotion, color: "from-red-500/10" },
            { label: "Temporal Space", icon: <Clock className="text-amber-400" />, data: state.temporal, color: "from-amber-500/10" },
            { label: "Optic Space", icon: <Zap className="text-cyan-400" />, data: state.optics, color: "from-cyan-500/10" }
        ].map((area, idx) => (
            <div key={idx} className={`bg-[#111111] rounded-[40px] border border-white/5 p-8 bg-gradient-to-br ${area.color} to-transparent space-y-6`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-xl">{area.icon}</div>
                    <h5 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{area.label}</h5>
                </div>
                <div className="space-y-4">
                    {Object.entries(area.data).map(([key, val], vIdx) => (
                        <StateCell key={vIdx} label={key} val={val} />
                    ))}
                </div>
            </div>
        ))}
    </div>
  );
};
