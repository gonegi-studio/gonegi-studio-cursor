
import React, { useState, useCallback } from 'react';
import type { ProfileConfig, MetaConfig, QualityScore, Scene, TimeOfDay, Season, Weather, CharacterBook } from '../types';
import { transformImage } from '../services/geminiService';
import { forceResizeToHD } from '../utils/imageProcessor';
import { readFileAsDataURL } from '../utils/fs';
import { 
    LoadingSpinner, 
    UploadIcon, 
    WandIcon, 
    DownloadIcon, 
    LayersIcon, 
    CheckCircleIcon, 
    AlertCircleIcon,
    SunIcon,
    HomeIcon,
    MoonIcon
} from './IconComponents';

interface KeyframeStudioProps {
    allMetaConfigs: MetaConfig[];
    profileConfigs: ProfileConfig[];
    // Added missing props
    envOptions: { time: TimeOfDay; season: Season; weather: Weather };
    characterBook: CharacterBook;
    isNostalgia: boolean;
}

const KeyframeStudio: React.FC<KeyframeStudioProps> = ({ allMetaConfigs, profileConfigs, envOptions, characterBook, isNostalgia }) => {
    const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string; } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
    const [selectedScene, setSelectedScene] = useState<Scene>('outdoor');
    const [error, setError] = useState<string | null>(null);

    const filteredProfiles = profileConfigs.filter(p => p.scene === selectedScene);
    const defaultProfile = filteredProfiles[0] || profileConfigs[0];

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = await readFileAsDataURL(file);
        setPreviewUrl(url);
        setSelectedImage({ data: url.split(',')[1], mimeType: file.type });
        setResultUrl(null);
        setQualityScore(null);
    };

    const handleGenerate = async () => {
        if (!selectedImage) return;
        setIsLoading(true);
        setError(null);
        try {
            // Fixed transformImage call with 11 arguments
            const { base64Image, qualityScore } = await transformImage(
                selectedImage,
                selectedScene,
                defaultProfile,
                allMetaConfigs,
                85,
                null,
                "",
                true,
                envOptions,
                characterBook,
                isNostalgia
            );

            const finalImage = await forceResizeToHD(`data:image/png;base64,${base64Image}`, 1920, 1080);
            setResultUrl(finalImage);
            setQualityScore(qualityScore);
        } catch (e) {
            setError(e instanceof Error ? e.message : "원화 생성 중 오류 발생");
        } finally {
            setIsLoading(false);
        }
    };

    const ChecklistItem: React.FC<{ label: string; passed: boolean }> = ({ label, passed }) => (
        <div className="flex items-center justify-between p-2 bg-overlay/30 rounded-md">
            <span className="text-sm font-medium">{label}</span>
            {passed ? <CheckCircleIcon className="text-primary h-5 w-5" /> : <AlertCircleIcon className="text-red-400 h-5 w-5" />}
        </div>
    );

    const handleDownloadImage = () => {
        if (!resultUrl) return;
        
        const now = new Date();
        const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
        const rrrr = Math.floor(1000 + Math.random() * 9000);
        const fileName = `${yyyymmdd}_${rrrr}`;

        // Download PNG
        const a = document.createElement('a');
        a.href = resultUrl;
        a.download = `${fileName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Download JSON
        const params = {
            scene: selectedScene,
            profile: defaultProfile,
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

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Inputs */}
                <div className="space-y-6">
                    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-overlay">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <LayersIcon className="text-secondary" />
                            1. 배경 원화 소스 업로드 (App B)
                        </h2>
                        <label className="block w-full aspect-video bg-overlay/50 rounded-xl border-2 border-dashed border-subtle hover:border-primary transition-all cursor-pointer overflow-hidden relative group">
                            {previewUrl ? (
                                <img src={previewUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted">
                                    <UploadIcon className="h-10 w-10 mb-2" />
                                    <p className="font-semibold">이미지 선택 (16:9 권장)</p>
                                    <p className="text-xs">호빗마을 배경으로 변환됩니다</p>
                                </div>
                            )}
                            <input type="file" onChange={handleUpload} className="hidden" />
                        </label>
                    </div>

                    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-overlay">
                        <h2 className="text-xl font-bold mb-4">2. 고네기월드 DNA 고정</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {(['outdoor', 'indoor', 'night'] as Scene[]).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSelectedScene(s)}
                                    className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border-2 ${selectedScene === s ? 'bg-secondary text-black border-amber-600' : 'bg-overlay/50 text-muted border-transparent hover:bg-overlay'}`}
                                >
                                    {s === 'outdoor' ? <SunIcon className="h-4 w-4"/> : s === 'indoor' ? <HomeIcon className="h-4 w-4"/> : <MoonIcon className="h-4 w-4"/>}
                                    {s === 'outdoor' ? '야외' : s === 'indoor' ? '실내' : '야간'}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">호빗마을 원화 핵심 규칙</h4>
                            <ul className="text-xs text-blue-700 space-y-1">
                                <li>• Blue Sky: 상단 20%는 항상 푸른 하늘과 뭉개구름</li>
                                <li>• Hobbit DNA: 곡선형 입구, 저층 건축, 자연 소재</li>
                                <li>• Lanterns: 지면 1.5m 이하 등불 필수 배치</li>
                                <li>• Slot Area: 캐릭터를 위한 2-3개의 빈 평탄 공간 확보</li>
                                <li>• No Particles: 화면 가득한 눈/비 입자 효과 금지</li>
                            </ul>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!selectedImage || isLoading}
                        className="w-full py-5 bg-secondary hover:bg-amber-400 text-black font-black text-lg rounded-2xl shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {isLoading ? <LoadingSpinner /> : <WandIcon />}
                        {isLoading ? "호빗 원화 생성 중..." : "호빗 배경 원화 생성"}
                    </button>
                    {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}
                </div>

                {/* Right: Results */}
                <div className="space-y-6">
                    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-overlay flex flex-col h-full">
                        <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                            최종 배경 원화
                            {resultUrl && (
                                <button onClick={handleDownloadImage} className="p-2 hover:bg-overlay rounded-full">
                                    <DownloadIcon className="h-5 w-5" />
                                </button>
                            )}
                        </h2>
                        <div className="flex-grow aspect-video bg-overlay rounded-xl overflow-hidden flex items-center justify-center relative">
                            {isLoading && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center"><LoadingSpinner /></div>}
                            {resultUrl ? (
                                <img src={resultUrl} className="w-full h-full object-contain" />
                            ) : (
                                <p className="text-muted text-sm text-center">캐릭터가 살아갈 세계를 만듭니다</p>
                            )}
                        </div>

                        {qualityScore && (
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center gap-4 border-b border-overlay pb-4">
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-muted uppercase">원화 적합도</p>
                                        <p className={`text-4xl font-black ${qualityScore.score >= 80 ? 'text-primary' : 'text-red-500'}`}>{qualityScore.score}</p>
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm font-bold">감독의 검수</p>
                                        <p className="text-sm text-muted italic">"{qualityScore.feedback}"</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <ChecklistItem label="푸른 하늘 & 뭉개구름" passed={qualityScore.checklist?.isSkyBlue ?? false} />
                                    <ChecklistItem label="호빗 DNA & 등불" passed={qualityScore.checklist?.isHobbitReady ?? false} />
                                    <ChecklistItem label="캐릭터 슬롯 확보" passed={qualityScore.checklist?.isMinimalist ?? false} />
                                    <ChecklistItem label="I2V 대응 (No Noise)" passed={qualityScore.checklist?.isI2VReady ?? false} />
                                </div>
                                {qualityScore.score >= 80 ? (
                                    <div className="p-3 bg-primary/10 rounded-xl text-primary text-xs font-bold text-center">
                                        🎉 훌륭합니다. 이 배경은 캐릭터를 맞이할 준비가 되었습니다!
                                    </div>
                                ) : (
                                    <div className="p-3 bg-red-50 rounded-xl text-red-500 text-xs font-bold text-center">
                                        ⚠️ 하늘 또는 건축 규칙이 미흡할 수 있습니다. 다시 생성을 시도하세요.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KeyframeStudio;
