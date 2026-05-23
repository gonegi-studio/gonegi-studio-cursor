
import React, { useState } from 'react';
import type { GhibliLibrary, GhibliAnchor } from '../types';
import { readFileAsText, saveJson, readFileAsDataURL } from '../utils/fs';
import { deduceStyleDNA } from '../services/geminiService';
import { createEliteThumbnail } from '../utils/imageProcessor';
import { 
    UsersIcon, 
    CheckCircleIcon, 
    AlertCircleIcon, 
    DownloadIcon, 
    UploadIcon, 
    SparklesIcon, 
    LayersIcon,
    RefreshCwIcon,
    LightbulbIcon,
    MessageSquarePlusIcon,
    XIcon,
    LoadingSpinner
} from './IconComponents';

interface HubStudioProps {
  ghibliLibrary: GhibliAnchor[];
  setGhibliLibrary: React.Dispatch<React.SetStateAction<GhibliAnchor[]>>;
}

const ELITE_LIMIT = 100;

const HubStudio: React.FC<HubStudioProps> = ({ ghibliLibrary, setGhibliLibrary }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [importLoading, setImportLoading] = useState(false);

    const deleteAnchor = (id: string) => {
        if (window.confirm('정예 멤버에서 제외하시겠습니까?')) {
            setGhibliLibrary(prev => prev.filter(a => a.id !== id));
        }
    };

    const handleExternalImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportLoading(true);
        try {
            const dataUrl = await readFileAsDataURL(file);
            const rawData = dataUrl.split(',')[1];
            const mimeType = file.type;

            // DNA 역설계 (Reverse Engineering)
            const dna = await deduceStyleDNA({ data: rawData, mimeType });
            const thumbnail = await createEliteThumbnail(dataUrl);

            const newAnchor: GhibliAnchor = {
                id: `elite_${Date.now()}`,
                status: 'SUCCESS',
                metaConfig: dna.metaConfig,
                profileConfig: dna.profileConfig,
                userDescription: `외부 영입 마스터피스 (${file.name})`,
                timestamp: Date.now(),
                thumbnail: thumbnail,
                origin_app_id: "External_Masterpiece"
            };

            if (ghibliLibrary.length >= ELITE_LIMIT) {
                alert(`이미 정예 멤버가 가득 찼습니다 (${ELITE_LIMIT}). 방출할 멤버를 먼저 선택하세요.`);
            } else {
                setGhibliLibrary(prev => [...prev, newAnchor]);
                alert("외부 마스터피스의 DNA가 성공적으로 영입되었습니다.");
            }
        } catch (err) {
            alert("DNA 역설계 중 오류가 발생했습니다.");
        } finally {
            setImportLoading(false);
        }
    };

    const handleBatchImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setIsProcessing(true);
        let newAnchors: GhibliAnchor[] = [...ghibliLibrary];

        for (let i = 0; i < files.length; i++) {
            try {
                const text = await readFileAsText(files[i]);
                const data = JSON.parse(text) as GhibliLibrary;
                if (data.anchors) {
                    data.anchors.forEach(anchor => {
                        if (!newAnchors.find(a => a.id === anchor.id) && newAnchors.length < ELITE_LIMIT) {
                            newAnchors.push({
                                ...anchor,
                                origin_app_id: anchor.origin_app_id || files[i].name
                            });
                        }
                    });
                }
            } catch (err) {
                console.error(`${files[i].name} 처리 실패`);
            }
        }

        setGhibliLibrary(newAnchors);
        setIsProcessing(false);
        alert(`라이브러리 병합이 완료되었습니다. (현재 ${newAnchors.length}/${ELITE_LIMIT})`);
    };

    const exportMasterBible = () => {
        const bible: GhibliLibrary = {
            version: "2.6",
            last_updated: Date.now(),
            anchors: ghibliLibrary
        };
        saveJson(`Ghibli_Master_Bible_${Date.now()}.json`, bible);
    };

    const copyEducationPrompt = () => {
        const successExamples = ghibliLibrary
            .slice(0, 5)
            .map(a => `- Reference: "${a.userDescription}" -> DNA { Stroke: ${a.profileConfig.painterly.stroke_depth}, Metal2Wood: ${a.metaConfig.material_rules.metal_to_wood} }`);

        const prompt = `
[고네기 스튜디오 가디언 프로토콜 v2.6 - 마스터 앵커 교육]
당신은 고네기 가디언 허브에서 엄선된 100인의 정예 멤버 DNA를 바탕으로 교육받는 아티스트입니다.

1. 비전: 1980년대 아날로그 지브리 노스탤지어의 정수를 재현하라.
2. 금기 사항: 3D 렌더링, 디지털 샤프니스, 실사 텍스처를 철저히 배제하라.
3. DNA 학습 데이터 (Master Bible Highlights):
${successExamples.length > 0 ? successExamples.join('\n') : "(초기 데이터 학습 중...)"}

이 DNA를 기반으로 사용자 요청에 가장 부합하는 지브리 원화를 창조하라.
        `;
        navigator.clipboard.writeText(prompt.trim());
        alert("교육 지침서가 클립보드에 복사되었습니다.");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Elite List Dashboard */}
            <div className="lg:col-span-12">
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-overlay mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-text uppercase tracking-tight flex items-center gap-2">
                                <UsersIcon className="w-6 h-6 text-primary" />
                                100인의 정예 가디언 멤버
                            </h2>
                            <p className="text-sm text-muted font-bold mt-1">
                                {ghibliLibrary.length} / {ELITE_LIMIT} Slots Occupied (Elite Bible Volume)
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <label className="cursor-pointer py-2.5 px-4 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 shadow-lg flex items-center gap-2 text-xs uppercase transition-all">
                                {importLoading ? <LoadingSpinner /> : <SparklesIcon className="w-4 h-4" />}
                                외부 마스터피스 영입 (DNA 추출)
                                <input type="file" accept="image/*" onChange={handleExternalImport} className="hidden" disabled={importLoading} />
                            </label>
                            <label className="cursor-pointer py-2.5 px-4 bg-stone-100 text-text font-black rounded-xl hover:bg-white border border-stone-300 shadow-sm flex items-center gap-2 text-xs uppercase transition-all">
                                <UploadIcon className="w-4 h-4" /> 데이터 집결
                                <input type="file" multiple accept=".json" onChange={handleBatchImport} className="hidden" />
                            </label>
                            <button 
                                onClick={exportMasterBible}
                                disabled={ghibliLibrary.length === 0}
                                className="py-2.5 px-4 bg-secondary text-black font-black rounded-xl hover:bg-amber-400 shadow-lg flex items-center gap-2 text-xs uppercase transition-all disabled:opacity-50"
                            >
                                <DownloadIcon className="w-4 h-4" /> 마스터 성경 배포
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-overlay min-h-[400px]">
                    {ghibliLibrary.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted opacity-30">
                            <UsersIcon className="w-16 h-16 mb-4" />
                            <p className="font-black uppercase tracking-widest">정예 멤버가 없습니다.</p>
                            <p className="text-xs">이미지 제작소에서 '성공' 판정을 하거나 외부 이미지를 영입하세요.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
                            {ghibliLibrary.map((anchor) => (
                                <div key={anchor.id} className="relative group aspect-video bg-overlay rounded-xl overflow-hidden border border-overlay hover:border-primary transition-all shadow-sm">
                                    <img src={anchor.thumbnail} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                                        <p className="text-[8px] text-white font-black uppercase mb-2 truncate w-full">{anchor.userDescription}</p>
                                        <button 
                                            onClick={() => deleteAnchor(anchor.id)}
                                            className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                                            title="정예 멤버에서 제외"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="absolute top-1 right-1">
                                        <CheckCircleIcon className="w-3 h-3 text-emerald-400 drop-shadow-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom: Instruction 전파 */}
            <div className="lg:col-span-12 mt-6">
                <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="z-10">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <LightbulbIcon className="w-7 h-7" /> 가디언 전파 프로토콜
                        </h2>
                        <p className="text-indigo-100/80 mt-2 text-sm max-w-xl">
                            현재 {ghibliLibrary.length}인의 정예 멤버 DNA가 분석되었습니다. 이 기준점들을 다른 앱의 AI에게 주입하여 사용자님만의 화풍을 복제하도록 교육시키세요.
                        </p>
                    </div>
                    <button 
                        onClick={copyEducationPrompt}
                        className="z-10 py-5 px-8 bg-white text-indigo-700 font-black rounded-2xl shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-3 text-sm uppercase tracking-widest"
                    >
                        교육 지침서 복사 (Copy Anchor Protocol)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HubStudio;
