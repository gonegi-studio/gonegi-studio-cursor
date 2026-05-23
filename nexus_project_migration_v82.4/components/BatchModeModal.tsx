
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { MetaConfig, ProfileConfig, Scene, EmotionWave, TimeOfDay, Season, Weather, CharacterBook } from '../types';
import { readFileAsDataURL } from '../utils/fs';
import { preAnalyzeImage, transformImage } from '../services/geminiService';
import { forceResizeToHD } from '../utils/imageProcessor';
import { XIcon, UploadIcon, PlayIcon, LoadingSpinner, SparklesIcon, DownloadIcon } from './IconComponents';

type BatchItemStatus = 'pending' | 'analyzing' | 'ready' | 'processing' | 'completed' | 'error';

interface BatchItem {
  id: string;
  file: File;
  previewUrl: string;
  status: BatchItemStatus;
  analysis?: { scene: Scene; description: string };
  resultUrl?: string;
  errorMessage?: string;
}

interface BatchModeModalProps {
  onClose: () => void;
  allMetaConfigs: MetaConfig[];
  profileConfigs: ProfileConfig[];
  initialHistory: EmotionWave[];
  onHistoryChange: (newHistory: EmotionWave[]) => void;
  onEvolve: (profile: ProfileConfig) => Promise<void>;
  // Missing props added
  envOptions: { time: TimeOfDay; season: Season; weather: Weather };
  characterBook: CharacterBook;
  isNostalgia: boolean;
}

const BatchModeModal: React.FC<BatchModeModalProps> = ({ 
  onClose, 
  allMetaConfigs, 
  profileConfigs, 
  initialHistory, 
  onHistoryChange, 
  onEvolve,
  envOptions,
  characterBook,
  isNostalgia
}) => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useEmotionalContinuity, setUseEmotionalContinuity] = useState(true);
  const [globalScene, setGlobalScene] = useState<Scene>('outdoor');
  const [globalProfile, setGlobalProfile] = useState<ProfileConfig | null>(null);
  const [creativityValue, setCreativityValue] = useState(85);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const filteredProfiles = useMemo(() => profileConfigs.filter(p => p.scene === globalScene), [globalScene, profileConfigs]);

  useEffect(() => {
    if (filteredProfiles.length > 0 && (!globalProfile || globalProfile.scene !== globalScene)) {
      setGlobalProfile(filteredProfiles[0]);
    } else if (filteredProfiles.length === 0) {
      setGlobalProfile(null);
    }
  }, [globalScene, filteredProfiles, globalProfile]);

  const handleFileDrop = useCallback(async (files: FileList) => {
    const newItems: BatchItem[] = [];
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const previewUrl = await readFileAsDataURL(file);
        newItems.push({
          id: `${file.name}-${Date.now()}`,
          file,
          previewUrl,
          status: 'pending',
        });
      }
    }
    setItems(prev => [...prev, ...newItems]);
  }, []);

  const handlePreAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    for (const item of items) {
      if (item.status === 'pending') {
        try {
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'analyzing' } : i));
          const url = await readFileAsDataURL(item.file);
          // Fix: Avoid redundant destructuring that causes TS errors by extracting values separately
          const data = url.split(',')[1];
          const analysis = await preAnalyzeImage({ data, mimeType: item.file.type });
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'ready', analysis } : i));
        } catch (e) {
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', errorMessage: '분석 실패' } : i));
        }
      }
    }
    setIsAnalyzing(false);
  }, [items]);

  const handleStartProcessing = useCallback(async () => {
      if (!globalProfile) {
          alert("변환에 사용할 프로필을 선택해주세요.");
          return;
      }
    setIsProcessing(true);
    let waveHistory = [...initialHistory];

    for (const item of items) {
      if (item.status === 'ready' && item.analysis) {
        try {
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i));
          
          const url = await readFileAsDataURL(item.file);
          // Fix: Avoid redundant destructuring that causes TS errors by extracting values separately
          const data = url.split(',')[1];
          const mimeType = item.file.type;
          
          const previousWave = useEmotionalContinuity && waveHistory.length > 0 ? waveHistory[waveHistory.length - 1] : null;

          // Fixed transformImage call with all required arguments
          const { base64Image, emotionWave } = await transformImage(
            { data, mimeType },
            item.analysis.scene,
            globalProfile,
            allMetaConfigs,
            creativityValue,
            previousWave,
            item.analysis.description,
            false,
            envOptions,
            characterBook,
            isNostalgia
          );
          
          waveHistory.push(emotionWave);
          
          const finalImage = await forceResizeToHD(`data:image/png;base64,${base64Image}`, 1920, 1080);

          setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'completed', resultUrl: finalImage } : i));
        
        } catch (e) {
          const message = e instanceof Error ? e.message : '변환 실패';
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', errorMessage: message } : i));
        }
      }
    }
    onHistoryChange(waveHistory);
    setIsProcessing(false);
  }, [items, globalProfile, allMetaConfigs, creativityValue, useEmotionalContinuity, initialHistory, onHistoryChange, envOptions, characterBook, isNostalgia]);

    const handleDownloadImage = (url: string, item: BatchItem) => {
        if (!url) return;
        
        const now = new Date();
        const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
        const rrrr = Math.floor(1000 + Math.random() * 9000);
        const fileName = `${yyyymmdd}_${rrrr}`;

        // Download PNG
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Download JSON
        const params = {
            originalFile: item.file.name,
            scene: item.analysis?.scene || globalScene,
            description: item.analysis?.description || '',
            profile: globalProfile,
            meta: allMetaConfigs[allMetaConfigs.length - 1],
            env: envOptions,
            characterBook,
            timestamp: Date.now()
        };
        const jsonBlob = new Blob([JSON.stringify(params, null, 2)], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = `${fileName}.json`;
        jsonLink.click();
        URL.revokeObjectURL(jsonUrl);
    };

    const handleDownloadAll = async () => {
        const completedItems = items.filter(i => i.status === 'completed' && i.resultUrl);
        if (completedItems.length === 0) {
            alert('다운로드할 완료된 이미지가 없습니다.');
            return;
        }

        for (const item of completedItems) {
            if (item.resultUrl) {
                handleDownloadImage(item.resultUrl, item);
                // Add a small delay between downloads to prevent browser blocking
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    };


  const progress = useMemo(() => {
      const total = items.length;
      if (total === 0) return 0;
      const completed = items.filter(i => i.status === 'completed' || i.status === 'error').length;
      return (completed / total) * 100;
  }, [items]);
  
  const completedCount = useMemo(() => items.filter(i => i.status === 'completed').length, [items]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        {lightboxImage && (
            <div 
              className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setLightboxImage(null)}
            >
              <img src={lightboxImage} alt="Transformed Ghibli Style" className="max-w-full max-h-full object-contain"/>
              <button className="absolute top-4 right-4 text-white text-3xl font-bold">&times;</button>
            </div>
        )}
      <div className="bg-surface w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col">
        <header className="p-4 border-b border-overlay flex justify-between items-center">
          <h2 className="text-xl font-bold">대량 변환 모드</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-overlay"><XIcon className="h-6 w-6" /></button>
        </header>

        <div className="flex-grow p-4 overflow-y-auto grid grid-cols-12 gap-4">
          {/* Controls */}
          <div className="col-span-4 space-y-4">
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFileDrop(e.dataTransfer.files); }}
              className="border-2 border-dashed border-subtle rounded-lg p-6 text-center"
            >
              <UploadIcon className="mx-auto h-12 w-12 text-subtle" />
              <p className="mt-2 text-muted">이미지를 드래그하거나</p>
              <label htmlFor="batch-upload" className="font-semibold text-primary cursor-pointer hover:underline">
                클릭하여 업로드
              </label>
              <input id="batch-upload" type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleFileDrop(e.target.files)} />
            </div>
            
            <div className="bg-overlay/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">전체 설정</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium">장면 선택 (프로필 필터)</label>
                        <select value={globalScene} onChange={e => setGlobalScene(e.target.value as Scene)} className="w-full p-2 mt-1 border border-subtle rounded-md">
                            <option value="outdoor">야외</option>
                            <option value="indoor">실내</option>
                            <option value="night">밤</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">프로필 선택</label>
                        <select disabled={!globalProfile} value={globalProfile?.profile_id || ''} onChange={e => setGlobalProfile(filteredProfiles.find(p => p.profile_id === e.target.value) || null)} className="w-full p-2 mt-1 border border-subtle rounded-md">
                            {filteredProfiles.map(p => <option key={p.profile_id} value={p.profile_id}>{p.category}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium">창의성 조절</label>
                        <div className="flex items-center gap-3 mt-1">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={creativityValue}
                              onChange={(e) => setCreativityValue(parseInt(e.target.value, 10))}
                              className="w-full h-2 bg-stone-300 rounded-lg appearance-none cursor-pointer"
                               style={{
                                background: `linear-gradient(to right, #10b981 0%, #10b981 ${creativityValue}%, #e7e5e4 ${creativityValue}%, #e7e5e4 100%)`
                              }}
                            />
                             <input
                                type="number"
                                value={creativityValue}
                                onChange={(e) => {
                                    const val = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                                    setCreativityValue(val);
                                }}
                                className="w-16 text-center font-mono bg-white rounded-md p-1 border border-subtle"
                            />
                            <span className="text-sm font-mono">%</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted mt-1 px-1">
                            <span>자유로운 상상</span>
                            <span>사실성 유지</span>
                        </div>
                    </div>
                    <div className="flex items-center pt-2">
                        <input type="checkbox" id="emotional-continuity" checked={useEmotionalContinuity} onChange={e => setUseEmotionalContinuity(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                        <label htmlFor="emotional-continuity" className="ml-2 block text-sm text-gray-900">감정 연속성 활성화 (시퀀스 모드)</label>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handlePreAnalyze} disabled={isAnalyzing || isProcessing} className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg disabled:bg-muted">사전 분석 실행</button>
              <button onClick={handleStartProcessing} disabled={isProcessing || isAnalyzing || !globalProfile || items.some(i => i.status === 'pending')} className="flex-1 py-2 px-4 bg-primary text-white rounded-lg disabled:bg-muted flex items-center justify-center gap-2">
                {isProcessing ? <LoadingSpinner /> : <PlayIcon />}
                변환 시작
              </button>
            </div>
            <div>
                <div className="w-full bg-overlay rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
                </div>
                <p className="text-sm text-center mt-1 text-muted">{items.filter(i => i.status === 'completed' || i.status === 'error').length} / {items.length} 처리 완료</p>
                {completedCount > 0 && (
                    <div className="mt-4 flex justify-center">
                        <button 
                            onClick={handleDownloadAll}
                            className="py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg shadow hover:bg-gray-700 transition-colors text-sm flex items-center gap-2"
                        >
                            <DownloadIcon className="h-4 w-4" />
                            완료된 항목 전체 다운로드 ({completedCount}개)
                        </button>
                    </div>
                )}
            </div>
          </div>
          
          {/* Queue */}
          <div className="col-span-8 space-y-2 overflow-y-auto h-[calc(90vh-150px)] pr-2">
            {items.map((item, index) => (
              <div key={item.id} className="bg-overlay/50 p-2 rounded-lg flex gap-2 items-center">
                <img src={item.previewUrl} className="w-16 h-16 object-cover rounded-md" />
                <div className="flex-grow">
                  <p className="text-xs font-semibold truncate">{item.file.name}</p>
                  <div className="flex gap-2 text-xs mt-1">
                    <select 
                      value={item.analysis?.scene || globalScene} 
                      onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? {...i, analysis: {...i.analysis!, scene: e.target.value as Scene}} : i))}
                      className="p-1 border rounded"
                      disabled={!item.analysis}
                    >
                      <option value="outdoor">야외</option>
                      <option value="indoor">실내</option>
                      <option value="night">밤</option>
                    </select>
                    <input 
                      type="text" 
                      value={item.analysis?.description || ''} 
                      onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? {...i, analysis: {...i.analysis!, description: e.target.value}} : i))}
                      className="p-1 border rounded w-full"
                      placeholder="AI 분석 대기중..."
                      disabled={!item.analysis}
                    />
                  </div>
                </div>
                <div className="w-32 text-center flex items-center justify-center">
                    {item.status === 'completed' && item.resultUrl ? (
                         <div className="relative group w-20 h-20 flex items-center justify-center">
                            <img 
                              src={item.resultUrl} 
                              className="w-16 h-16 object-cover rounded-md cursor-pointer transition-transform group-hover:scale-105"
                              onClick={() => setLightboxImage(item.resultUrl!)}
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-md">
                              <span className="text-white text-xs font-bold">확대</span>
                            </div>
                            <button title="이 결과로 시스템 진화" onClick={() => onEvolve(globalProfile!)} className="absolute -bottom-1 -left-1 z-10 p-1.5 bg-secondary rounded-full text-black shadow-lg transition-transform hover:scale-110">
                                <SparklesIcon className="h-4 w-4" />
                            </button>
                            <button title="이미지 다운로드" onClick={() => handleDownloadImage(item.resultUrl!, item)} className="absolute -bottom-1 -right-1 z-10 p-1.5 bg-white rounded-full text-black shadow-lg transition-transform hover:scale-110">
                                <DownloadIcon className="h-4 w-4" />
                            </button>
                         </div>
                    ) : (
                        <span className="text-sm font-semibold text-muted">{
                           {
                                pending: '대기중',
                                analyzing: '분석중...',
                                ready: '준비완료',
                                processing: '변환중...',
                                error: `❌ ${item.errorMessage || '실패'}`,
                           }[item.status]
                        }</span>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchModeModal;
