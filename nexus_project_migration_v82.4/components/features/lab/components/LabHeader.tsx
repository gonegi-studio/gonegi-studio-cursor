
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Film, 
  FolderOpen, 
  RotateCcw, 
  Save, 
  Trash2, 
  Scale, 
  Activity, 
  FastForward, 
  ShieldCheck,
  Plus
} from 'lucide-react';
import { APP_VERSION } from '../constants/lab.constants';

interface LabHeaderProps {
  status: string;
  seedingStatus: 'SEEDED' | 'CLEARED' | 'SERVER_SYNCED' | 'LOCAL_CACHE_MISMATCH';
  isLooping: boolean;
  isAnalyzing: boolean;
  isRefactoring: boolean;
  batchProgress: { current: number; total: number };
  analyzingFileName: string;
  resultsCount: number;
  showDeleteConfirm: boolean;
  isCalibrationMode: boolean;
  onImportLibrary: () => void;
  onRefactorLibrary: () => void;
  onExportLibrary: () => void;
  onShowDeleteConfirm: (show: boolean) => void;
  onClearDB: () => void;
  onToggleCalibration: () => void;
  onNewAnalysis: () => void;
}

export const LabHeader: React.FC<LabHeaderProps> = ({
  status,
  seedingStatus,
  isLooping,
  isAnalyzing,
  isRefactoring,
  batchProgress,
  analyzingFileName,
  resultsCount,
  showDeleteConfirm,
  isCalibrationMode,
  onImportLibrary,
  onRefactorLibrary,
  onExportLibrary,
  onShowDeleteConfirm,
  onClearDB,
  onToggleCalibration,
  onNewAnalysis
}) => {
  return (
    <div className="bg-[#111111] border-b border-white/5 px-8 py-6 flex items-center justify-between shadow-2xl shrink-0 z-50">
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 bg-[#00D1FF] rounded-2xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,209,255,0.4)]">
          <Film size={28} />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-[-0.05em] flex items-center gap-3 text-white">
            시네마틱 OS: WORLD-STATE ENGINE
            <span className="px-2 py-0.5 bg-[#00D1FF] text-black text-[10px] rounded uppercase font-black">{APP_VERSION} INTEGRATED</span>
            {seedingStatus && (
              <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-black border ${
                seedingStatus === 'SEEDED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                seedingStatus === 'CLEARED' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                seedingStatus === 'SERVER_SYNCED' ? 'bg-blue-500/20 text-[#00D1FF] border-blue-500/30' :
                'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {seedingStatus.replace('_', ' ')}
              </span>
            )}
          </h1>
          <div className="flex items-center gap-4 mt-1 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
            <span className="flex items-center gap-1.5"><FastForward size={10} className="text-blue-400" /> Stabilization Orchestrator Active</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <span className="flex items-center gap-1.5"><ShieldCheck size={10} className="text-emerald-500" /> kernel {APP_VERSION} stabilization loop</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1.5"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isLooping ? 'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-emerald-500'}`} />
              <span className={`text-[9px] font-black tracking-widest ${isLooping ? 'text-blue-400' : 'text-emerald-400'}`}>{status}</span>
            </motion.div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onImportLibrary}
          className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 px-4 py-3 rounded-xl text-xs font-bold transition-all"
        >
          <FolderOpen size={16} />
          DB 불러오기
        </button>
        <button 
          onClick={onRefactorLibrary}
          disabled={isRefactoring || resultsCount === 0}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${isRefactoring ? 'bg-blue-500 border-blue-500 text-black' : 'bg-white/5 border-white/10 text-blue-400 hover:bg-blue-400/10'} disabled:opacity-30`}
        >
          <RotateCcw size={16} className={isRefactoring ? 'animate-spin' : ''} />
          {isRefactoring ? '벡터 인코더 로딩 중...' : `${APP_VERSION} 정규화 활성화`}
        </button>
        <button 
          onClick={onExportLibrary}
          disabled={resultsCount === 0}
          className="flex items-center gap-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 px-4 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
        >
          <Save size={16} />
          DB 내보내기
        </button>
        <div className="relative">
          <button 
            onClick={() => onShowDeleteConfirm(!showDeleteConfirm)}
            disabled={resultsCount === 0}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${showDeleteConfirm ? 'bg-red-500 border-red-500 text-white' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'} disabled:opacity-30`}
          >
            <Trash2 size={16} />
            {showDeleteConfirm ? '정말 삭제하시겠습니까?' : 'DB 초기화'}
          </button>
          
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full mb-2 right-0 w-64 bg-[#1A1A1A] border border-red-500/30 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden text-white"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-red-500/20" />
                <p className="text-[10px] text-white/70 leading-relaxed mb-4">
                  모든 데이터를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 분석된 모든 DNA 정보가 소실됩니다.
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={onClearDB}
                    className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black rounded-lg transition-colors"
                  >
                    영구 삭제
                  </button>
                  <button 
                    onClick={() => onShowDeleteConfirm(false)}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white/50 text-[10px] font-black rounded-lg transition-colors"
                  >
                    취소
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="w-[1px] h-8 bg-white/5 mx-2" />
        <button 
          onClick={onToggleCalibration}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${isCalibrationMode ? 'bg-[#FF00D1] border-[#FF00D1] text-white shadow-[0_0_20px_rgba(255,0,209,0.4)]' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
        >
          <Scale size={16} />
          {isCalibrationMode ? '교정 모드 종료' : '교정 모드 실행'}
        </button>
        <button 
          onClick={onNewAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 bg-[#00D1FF] hover:bg-[#00B8E1] text-black px-6 py-3 rounded-xl font-black text-xs transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(0,209,255,0.3)] relative group overflow-hidden"
        >
          {isAnalyzing && batchProgress.total > 0 && (
            <motion.div 
              className="absolute inset-x-0 bottom-0 h-1 bg-black/20"
              initial={{ width: 0 }}
              animate={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
          )}
          <Activity size={20} className={isAnalyzing ? 'animate-spin text-cyan-400' : ''} />
          <div className="flex flex-col items-start leading-tight">
             <span className="text-[11px] font-black">{isAnalyzing ? (batchProgress.total > 0 ? `Batch ${batchProgress.current}/${batchProgress.total}` : 'Full Grounding 중...') : '새 영상 분석하기'}</span>
             {isAnalyzing && analyzingFileName && (
                <span className="text-[8px] text-white/40 font-mono truncate max-w-[120px]">{analyzingFileName}</span>
             )}
          </div>
        </button>
      </div>
    </div>
  );
};
