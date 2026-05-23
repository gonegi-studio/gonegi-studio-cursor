
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Plus } from 'lucide-react';
import { RECOMMENDATION_POOL, APP_VERSION } from '../constants/lab.constants';

interface LabRoadmapProps {
  show: boolean;
  onClose: () => void;
}

export const LabRoadmap: React.FC<LabRoadmapProps> = ({ show, onClose }) => {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-6xl h-full bg-[#111111] border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-3 text-white">
                  <MapPin size={24} className="text-[#00D1FF]" />
                  시네마틱 DNA 수집 로드맵 <span className="text-[10px] bg-[#00D1FF]/20 text-[#00D1FF] px-3 py-1 rounded-full border border-[#00D1FF]/30 ml-4 font-black uppercase">{APP_VERSION} Stage 1 Active</span>
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white/10 rounded-2xl text-white transition-all"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar text-white">
              <div className="grid grid-cols-5 gap-8">
                {Object.entries(RECOMMENDATION_POOL).map(([category, movies]) => (
                  <div key={category} className="group space-y-6">
                    <div className="flex flex-col gap-2 pb-4 border-b border-white/10">
                      <h3 className="text-[11px] font-black uppercase text-[#00D1FF]">{category}</h3>
                    </div>
                    <div className="space-y-3">
                      {movies.map((movie, idx) => (
                        <div key={idx} className="text-[10px] font-bold text-white/40 leading-tight">
                          {movie}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
