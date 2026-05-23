
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ProfileConfig, Scene, MetaConfig, QualityScore, CharacterBook } from '../types';
import { generateImageFromText, getInspiration, evolveMetaConfig } from '../services/geminiService';
import { forceResizeToHD } from '../utils/imageProcessor';
import ProfileCard from './ProfileCard';
import QualityScoreDisplay from './QualityScoreDisplay';
import { LoadingSpinner, WandIcon, DownloadIcon, HomeIcon, MoonIcon, SunIcon, SparklesIcon, XIcon } from './IconComponents';

interface ImaginationStudioProps {
  profileConfigs: ProfileConfig[];
  allMetaConfigs: MetaConfig[];
  onEvolveSystem: React.Dispatch<React.SetStateAction<MetaConfig[]>>;
  // Added missing characterBook prop
  characterBook: CharacterBook;
}

const PromptInput: React.FC<{
    label: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    rows?: number;
}> = ({ label, placeholder, value, onChange, rows = 2 }) => (
    <div>
        <label className="block text-sm font-bold text-muted mb-1 uppercase tracking-tighter">{label}</label>
        <textarea
            rows={rows}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full p-4 border border-overlay rounded-xl bg-stone-50 text-sm focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all resize-none shadow-inner"
        />
    </div>
);


const ImaginationStudio: React.FC<ImaginationStudioProps> = ({ profileConfigs, allMetaConfigs, onEvolveSystem, characterBook }) => {
    const [prompt, setPrompt] = useState({
        subject: '',
        composition: '',
        atmosphere: '',
        style: '',
    });
    const [selectedScene, setSelectedScene] = useState<Scene>('outdoor');
    const [selectedProfile, setSelectedProfile] = useState<ProfileConfig | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [isInspiring, setIsInspiring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showLightbox, setShowLightbox] = useState(false);

    const handlePromptChange = (field: keyof typeof prompt) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(prev => ({ ...prev, [field]: e.target.value }));
    };

    const filteredProfiles = useMemo(() => {
        return profileConfigs.filter(p => p.scene === selectedScene);
    }, [selectedScene, profileConfigs]);

    useEffect(() => {
        if (filteredProfiles.length > 0) {
            const currentProfileStillExists = selectedProfile && filteredProfiles.some(p => p.profile_id === selectedProfile.profile_id);
            if (!currentProfileStillExists) {
                setSelectedProfile(filteredProfiles[0]);
            }
        } else {
            setSelectedProfile(null);
        }
    }, [selectedScene, filteredProfiles, selectedProfile]);

    const handleGenerate = useCallback(async () => {
        if (!selectedProfile) {
            setError('먼저 스타일 프로필을 선택해주세요.');
            return;
        }
        setIsLoading(true);
        setLoadingMessage('AI 아티스트가 상상을 그리는 중...');
        setError(null);
        setGeneratedImage(null);
        setQualityScore(null);

        try {
            // Added characterBook as the 4th argument
            const { base64Image, qualityScore } = await generateImageFromText(prompt, selectedProfile, allMetaConfigs, characterBook);
            const imageUrl = `data:image/png;base64,${base64Image}`;
            const finalImage = await forceResizeToHD(imageUrl, 1920, 1080);
            
            setGeneratedImage(finalImage);
            setQualityScore(qualityScore);
        } catch (err) {
            setError(err instanceof Error ? err.message : '이미지 생성 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [prompt, selectedProfile, allMetaConfigs, characterBook]);

    const handleEvolve = useCallback(async () => {
        if (!generatedImage || !selectedProfile) return;
        setIsLoading(true);
        setLoadingMessage("성공 경험을 시스템에 주입 중...");
        try {
          const latestConfig = allMetaConfigs[allMetaConfigs.length - 1];
          const newConfig = await evolveMetaConfig(latestConfig, selectedProfile);
          onEvolveSystem(prev => [...prev, newConfig]);
          alert("시스템 진화 완료! 새로운 메타 설정이 적용되었습니다.");
        } catch (err) {
          setError(err instanceof Error ? err.message : '시스템 진화 중 오류가 발생했습니다.');
        } finally {
          setIsLoading(false);
        }
    }, [generatedImage, selectedProfile, allMetaConfigs, onEvolveSystem]);
    
    const handleGetInspiration = useCallback(async () => {
        if (!selectedProfile) return;
        setIsInspiring(true);
        try {
            const inspiration = await getInspiration(selectedProfile);
            setPrompt(inspiration);
        } catch (err) {
            setError('영감을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setIsInspiring(false);
        }
    }, [selectedProfile]);

    return (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {showLightbox && generatedImage && (
                <div 
                  className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-md"
                  onClick={() => setShowLightbox(false)}
                >
                  <img src={generatedImage} alt="Expanded View" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"/>
                  <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                    <XIcon className="w-8 h-8" />
                  </button>
                </div>
            )}
            
            <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-overlay space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-secondary" />
                            1. 상상의 원화 묘사
                        </h2>
                        <button
                            onClick={handleGetInspiration}
                            disabled={isInspiring || !selectedProfile || isLoading}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl transition-all bg-overlay text-text hover:bg-stone-300 disabled:opacity-50 uppercase tracking-widest"
                        >
                            {isInspiring ? <LoadingSpinner/> : <SparklesIcon className="h-4 w-4" />}
                            영감 얻기
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PromptInput label="주제 (Subject)" placeholder="예: 언덕 위 호빗 집 앞에 앉아있는 아기 거위" value={prompt.subject} onChange={handlePromptChange('subject')} />
                        <PromptInput label="구도 (Composition)" placeholder="예: 시네마틱 와이드 샷, 낮은 앵글" value={prompt.composition} onChange={handlePromptChange('composition')} />
                        <PromptInput label="분위기 (Atmosphere)" placeholder="예: 노을이 지는 따뜻하고 평온한 오후" value={prompt.atmosphere} onChange={handlePromptChange('atmosphere')} />
                        <PromptInput label="스타일 (Style Detail)" placeholder="예: 거친 붓터치와 부드러운 빛 번짐" value={prompt.style} onChange={handlePromptChange('style')} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-4">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !selectedProfile}
                            className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl hover:bg-primary-focus transition-all disabled:bg-stone-300 flex items-center justify-center gap-3 text-lg uppercase tracking-wider"
                        >
                            {isLoading ? <LoadingSpinner /> : <WandIcon />}
                            {isLoading ? loadingMessage : "상상 원화 생성"}
                        </button>
                        {qualityScore && <QualityScoreDisplay scoreData={qualityScore} />}
                        {generatedImage && qualityScore && qualityScore.score >= 80 && (
                            <button 
                                onClick={handleEvolve}
                                className="w-full py-4 bg-secondary text-black font-black rounded-2xl shadow-lg hover:bg-amber-400 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                            >
                                <SparklesIcon className="w-4 h-4" /> 시스템 진화 학습
                            </button>
                        )}
                    </div>
                    <div className="aspect-video bg-overlay/30 rounded-2xl overflow-hidden border border-overlay shadow-inner relative group cursor-pointer" onClick={() => generatedImage && setShowLightbox(true)}>
                        {isLoading && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10"><LoadingSpinner /></div>}
                        {generatedImage ? (
                            <>
                                <img src={generatedImage} className="w-full h-full object-contain" />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); const a = document.createElement('a'); a.href = generatedImage; a.download = 'imagined.png'; a.click(); }} className="p-2.5 bg-white/90 text-black rounded-xl shadow-lg hover:bg-white transition-all">
                                        <DownloadIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-xs font-black uppercase tracking-widest">Expand View</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted opacity-30">
                                <SparklesIcon className="w-12 h-12 mb-3"/>
                                <p className="text-xs font-bold uppercase tracking-widest">상상 결과 대기 중</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
                 <div className="bg-surface p-6 rounded-2xl shadow-sm border border-overlay">
                    <h2 className="text-sm font-black text-muted uppercase tracking-widest mb-4">장면 테마 선택</h2>
                    <div className="grid grid-cols-3 gap-2">
                      {(['outdoor', 'indoor', 'night'] as Scene[]).map((scene) => (
                        <button
                          key={scene}
                          onClick={() => setSelectedScene(scene)}
                          className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selectedScene === scene ? 'bg-primary text-white border-primary-focus' : 'bg-stone-50 text-muted border-transparent hover:border-overlay'}`}
                        >
                          {scene === 'outdoor' ? '야외' : scene === 'indoor' ? '실내' : '야간'}
                        </button>
                      ))}
                    </div>
                  </div>
                 <div className="bg-surface p-6 rounded-2xl shadow-sm border border-overlay flex-grow flex flex-col overflow-hidden">
                    <h2 className="text-sm font-black text-muted uppercase tracking-widest mb-4">스타일 프로필</h2>
                    <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 custom-scrollbar">
                      {filteredProfiles.map((p) => (
                        <div key={p.profile_id} onClick={() => setSelectedProfile(p)} className={`rounded-xl border-2 transition-all cursor-pointer ${selectedProfile?.profile_id === p.profile_id ? 'border-primary shadow-md bg-primary/5' : 'border-transparent hover:border-overlay bg-stone-50'}`}>
                          <ProfileCard profile={p} />
                        </div>
                      ))}
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default ImaginationStudio;
