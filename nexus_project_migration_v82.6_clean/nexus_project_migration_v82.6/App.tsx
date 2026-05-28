
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { initialMetaConfigs, profileConfigs, MEDITERRANEAN_CHRONICLES_DATA } from './data/jsonData';
import type { 
    MetaConfig, 
    ProfileConfig, 
    Scene, 
    EmotionWave, 
    QualityScore, 
    TimeOfDay, 
    Season, 
    Weather, 
    CharacterBook,
    GhibliAnchor,
    GhibliLibrary
} from './types';
import { saveJson, readFileAsDataURL, readFileAsText } from './utils/fs';
import { forceResizeToHD, createEliteThumbnail } from './utils/imageProcessor';
import { transformImage } from './services/geminiService';

import ProfileCard from './components/ProfileCard';
import BatchModeModal from './components/BatchModeModal';
import CharacterBookModal from './components/CharacterBookModal';
import KeyframeStudio from './components/KeyframeStudio';
import ImaginationStudio from './components/ImaginationStudio';
import CinematicExpansionStudio from './components/CinematicExpansionStudio';
import HubStudio from './components/HubStudio';
import VideoEngineStudio, { VideoEngineStudioHandle } from './components/VideoEngineStudio';
import { CinematicLab } from './components/CinematicLab';
import { MigrationCenter } from './components/MigrationCenter';
import SingleCanvasStudio from './components/SingleCanvasStudio';
import { APP_VERSION } from './components/features/lab/constants/lab.constants';


import {
  DownloadIcon,
  LoadingSpinner,
  PaintBrushIcon,
  SparklesIcon,
  SunIcon,
  UploadIcon,
  WandIcon,
  LayersIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  UsersIcon,
  RefreshCwIcon,
  XIcon,
  FilmIcon,
  PlayIcon,
  ShieldCheckIcon,
  ActivityIcon,
  SearchIcon
} from './components/IconComponents';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const ELITE_LIMIT = 100;

type ViewMode = 'engine' | 'singlecanvas' | 'lab' | 'migration';

const App: React.FC = () => {
  const engineRef = useRef<VideoEngineStudioHandle>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('engine');
  const [isCharBookOpen, setIsCharBookOpen] = useState(false);
  const [characterBook, setCharacterBook] = useState<CharacterBook>(MEDITERRANEAN_CHRONICLES_DATA);

  useEffect(() => {
    // Persistence removed to allow clean state on refresh (F5)
  }, [characterBook]);

  const handleDeploy = (char: any) => {
    if (engineRef.current) {
      setViewMode('engine'); // 도감에서 배포 시 엔진 화면으로 전환
      setTimeout(() => {
        engineRef.current?.addFromLibrary(char);
        setIsCharBookOpen(false);
      }, 100);
    }
  };

  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // AI Studio 환경이 아닌 경우 (로컬 개발 등)
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true); // 선택 후 성공했다고 가정하고 진행
    }
  };

  const handleFreeMode = () => {
    setHasKey(true); // API 키 체크를 우회하여 앱 진입
  };

  const handleResetKey = () => {
    setHasKey(false); // 다시 키 선택 화면으로
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheckIcon className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-black text-stone-900 mb-4 uppercase tracking-tight">API 키가 필요합니다</h2>
          <p className="text-stone-600 mb-8 text-sm leading-relaxed">
            동영상 생성을 위해 유료 API 키 선택이 필요합니다.<br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-primary font-bold underline">결제 문서</a>를 참고하여 유료 프로젝트의 키를 선택해주세요.
          </p>
          <div className="space-y-3">
            <button 
              onClick={handleSelectKey}
              className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg hover:bg-primary-focus transition-all uppercase tracking-widest flex items-center justify-center gap-3"
            >
              <SparklesIcon className="w-5 h-5" />
              API 키 선택 (유료 프로젝트)
            </button>
            <button 
              onClick={handleFreeMode}
              className="w-full py-4 bg-stone-100 text-stone-600 font-bold rounded-2xl border border-stone-200 hover:bg-white transition-all uppercase tracking-widest"
            >
              무료 모드 사용 (기능 제한)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base text-text min-h-screen font-sans flex flex-col">
      <header className="bg-surface shadow-sm p-4 flex justify-between items-center z-40 sticky top-0 border-b border-overlay">
        <div className="flex items-center gap-8">
            <h1 className="text-xl font-black text-text tracking-tight uppercase flex items-center gap-2 mr-4">
              <FilmIcon className="w-6 h-6 text-primary" />
              Vision-Integrated Production Engine <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded ml-1 text-xs">{APP_VERSION}</span>
            </h1>

            <nav className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button 
                  onClick={() => setViewMode('engine')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'engine' ? 'bg-white text-primary shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                  id="header-tab-engine"
                >
                  <PlayIcon className="w-3 h-3" />
                  Engine
                </button>
                <button 
                  onClick={() => setViewMode('singlecanvas')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'singlecanvas' ? 'bg-white text-amber-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                  id="header-tab-single-canvas"
                >
                  <WandIcon className="w-3 h-3" />
                  SingleCanvas
                </button>
                <button 
                  onClick={() => setViewMode('lab')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'lab' ? 'bg-white text-[#00D1FF] shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                  id="header-tab-direction-lab"
                >
                  <ActivityIcon className="w-3 h-3" />
                  Direction Lab
                </button>
                <button 
                  onClick={() => setViewMode('migration')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'migration' ? 'bg-white text-emerald-500 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                  id="header-tab-migration"
                >
                  <DownloadIcon className="w-3 h-3 text-emerald-500" />
                  Migration Center
                </button>
            </nav>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={handleResetKey} className="text-[10px] font-black text-muted uppercase tracking-widest hover:text-primary transition-colors">
              키 초기화 / 무료 모드 전환
            </button>
            <button onClick={() => setIsCharBookOpen(true)} className="py-2.5 px-4 bg-overlay text-text font-bold rounded-xl hover:bg-white border border-stone-300 shadow-sm flex items-center gap-2 text-sm transition-all">
                <UsersIcon className="w-4 h-4" /> 캐릭터 도감
            </button>
        </div>
      </header>

      {isCharBookOpen && (
        <CharacterBookModal 
          onClose={() => setIsCharBookOpen(false)} 
          characterBook={characterBook} 
          onUpdate={setCharacterBook} 
          onDeploy={handleDeploy}
        />
      )}

      <main className="flex-grow">
        {viewMode === 'engine' ? (
          <div className="p-6 max-w-[1600px] mx-auto">
            <VideoEngineStudio ref={engineRef} characterBook={characterBook} />
          </div>
        ) : viewMode === 'singlecanvas' ? (
          <div className="p-6 max-w-[1600px] mx-auto">
            <SingleCanvasStudio characterBook={characterBook} />
          </div>
        ) : viewMode === 'lab' ? (
          <CinematicLab />
        ) : (
          <div className="p-12 max-w-[1600px] mx-auto min-h-[calc(110vh-320px)] bg-black/95 rounded-[32px] border border-white/5 my-6">
            <MigrationCenter />
          </div>
        )}
      </main>

      <footer className="p-6 text-center border-t border-overlay bg-stone-50">
        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
          Powered by Gemini 2.0 Flash & Nexus OS {APP_VERSION} • Evidence-Grounded Cinematic Perception Architecture
        </p>
      </footer>
    </div>
  );
};

export default App;
