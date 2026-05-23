import React, { useState, useCallback } from 'react';
import { expandImageCinematically, suggestNextActions, generateActionVariation, Angle } from '../services/geminiService';
import { readFileAsDataURL } from '../utils/fs';
import { forceResizeToHD } from '../utils/imageProcessor';
import {
    LoadingSpinner,
    UploadIcon,
    ArrowBigLeftIcon,
    ArrowBigRightIcon,
    ArrowBigUpIcon,
    ArrowBigDownIcon,
    UsersIcon,
    ZoomInIcon,
    ZoomOutIcon,
    RefreshCwIcon,
    WandIcon,
    DownloadIcon,
    XIcon,
    LightbulbIcon,
    MessageSquarePlusIcon,
} from './IconComponents';

type GenerationStatus = 'idle' | 'loading' | 'done' | 'error';

interface GeneratedImage {
  url: string | null;
  status: GenerationStatus;
  errorMessage?: string;
}

interface ActionSequenceItem extends GeneratedImage {
    id: number;
    prompt: string;
}


const angleDefs: { id: Angle; label: string; icon: React.ReactNode }[] = [
    { id: 'left', label: '좌측', icon: <ArrowBigUpIcon className="h-5 w-5 transform -rotate-90" /> },
    { id: 'right', label: '우측', icon: <ArrowBigDownIcon className="h-5 w-5 transform -rotate-90" /> },
    { id: 'up', label: '위에서', icon: <ArrowBigLeftIcon className="h-5 w-5 transform rotate-90" /> },
    { id: 'down', label: '아래에서', icon: <ArrowBigRightIcon className="h-5 w-5 transform rotate-90" /> },
    { id: 'opposite', label: '반대편', icon: <UsersIcon className="h-5 w-5" /> },
    { id: 'zoomIn', label: '확대', icon: <ZoomInIcon className="h-5 w-5" /> },
    { id: 'zoomOut', label: '축소', icon: <ZoomOutIcon className="h-5 w-5" /> },
];

const CinematicExpansionStudio: React.FC = () => {
    const [referenceImage, setReferenceImage] = useState<{ data: string; mimeType: string } | null>(null);
    const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
    const [referenceDescription, setReferenceDescription] = useState<string>('');
    const [baseStyleDescription, setBaseStyleDescription] = useState<string | null>(null);

    const [generatedImages, setGeneratedImages] = useState<Record<Angle, GeneratedImage>>(
        Object.fromEntries(angleDefs.map(def => [def.id, { url: null, status: 'idle' }])) as Record<Angle, GeneratedImage>
    );
    
    const [actionSequence, setActionSequence] = useState<ActionSequenceItem[]>([]);
    const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
    const [isSuggestingActions, setIsSuggestingActions] = useState(false);
    
    const [error, setError] = useState<string | null>(null);
    const [showLightbox, setShowLightbox] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setError(null);
        setGeneratedImages(Object.fromEntries(angleDefs.map(def => [def.id, { url: null, status: 'idle' }])) as Record<Angle, GeneratedImage>);
        setBaseStyleDescription(null);
        setActionSequence([]);
        setSuggestedActions([]);
        try {
            const dataUrl = await readFileAsDataURL(file);
            setReferenceImageUrl(dataUrl);
            const mimeType = file.type;
            setReferenceImage({ data: dataUrl.split(',')[1], mimeType });
        } catch (err) {
            setError(err instanceof Error ? err.message : '이미지 업로드 중 오류가 발생했습니다.');
            setReferenceImage(null);
            setReferenceImageUrl(null);
        }
    }, []);
    
    const ensureBaseStyle = useCallback(async () => {
        if (baseStyleDescription) return baseStyleDescription;
        if (!referenceImage) throw new Error("참조 이미지가 필요합니다.");

        // First generation of any kind also generates the style
        const { styleDescription } = await expandImageCinematically(referenceImage, referenceDescription, 'left', null);
        if (!styleDescription) throw new Error("스타일 분석에 실패했습니다.");
        
        setBaseStyleDescription(styleDescription);
        // We discard the image from this, as it was just for analysis
        setGeneratedImages(prev => ({ ...prev, left: { url: null, status: 'idle' } }));
        
        return styleDescription;
    }, [baseStyleDescription, referenceImage, referenceDescription]);

    const handleGenerateAngle = useCallback(async (angle: Angle) => {
        if (!referenceImage) {
            setError('먼저 참조 이미지를 업로드해주세요.');
            return;
        }

        setGeneratedImages(prev => ({ ...prev, [angle]: { url: null, status: 'loading' } }));
        setError(null);

        try {
            // First generation also gets the style
            const { base64Image, styleDescription } = await expandImageCinematically(
                referenceImage,
                referenceDescription,
                angle,
                baseStyleDescription
            );

            if (styleDescription && !baseStyleDescription) {
                setBaseStyleDescription(styleDescription);
            }
            
            const imageUrl = `data:image/png;base64,${base64Image}`;
            const finalImage = await forceResizeToHD(imageUrl, 1920, 1080);

            setGeneratedImages(prev => ({ ...prev, [angle]: { url: finalImage, status: 'done' } }));

        } catch (err) {
            const message = err instanceof Error ? err.message : '이미지 생성 중 오류가 발생했습니다.';
            setGeneratedImages(prev => ({ ...prev, [angle]: { url: null, status: 'error', errorMessage: message.slice(0, 100) } }));
            setError(message);
        }
    }, [referenceImage, referenceDescription, baseStyleDescription]);
    
    const handleSuggestActions = useCallback(async () => {
        if (!referenceImage) {
            setError('먼저 참조 이미지를 업로드해주세요.');
            return;
        }
        setIsSuggestingActions(true);
        setError(null);
        setSuggestedActions([]);
        try {
            const actions = await suggestNextActions(referenceImage, referenceDescription);
            setSuggestedActions(actions);
        } catch(err) {
             setError(err instanceof Error ? err.message : 'AI 동작 제안 생성 중 오류가 발생했습니다.');
        } finally {
            setIsSuggestingActions(false);
        }
    }, [referenceImage, referenceDescription]);

    const handleGenerateAction = useCallback(async (actionPrompt: string, isRegen = false, idToRegen?: number) => {
        if (!referenceImage) {
            setError('먼저 참조 이미지를 업로드해주세요.');
            return;
        }
        if (!actionPrompt?.trim()) {
            setError('동작을 생성하려면 먼저 "AI를 위한 부연 설명" 란에 원하는 동작을 입력해주세요.');
            document.getElementById('ref-description')?.focus();
            return;
        }
        setError(null);

        let newItemId: number;
        if (isRegen && idToRegen) {
            newItemId = idToRegen;
            setActionSequence(prev => prev.map(item => item.id === newItemId ? {...item, status: 'loading', url: null} : item));
        } else {
            newItemId = Date.now();
            const newActionItem: ActionSequenceItem = { id: newItemId, url: null, status: 'loading', prompt: actionPrompt };
            setActionSequence(prev => [...prev, newActionItem]);
        }

        try {
            const style = await ensureBaseStyle();
            const { base64Image } = await generateActionVariation(referenceImage, actionPrompt, style);
            const imageUrl = `data:image/png;base64,${base64Image}`;
            const finalImage = await forceResizeToHD(imageUrl, 1920, 1080);

            setActionSequence(prev => prev.map(item => item.id === newItemId ? {...item, status: 'done', url: finalImage} : item));
        } catch (err) {
            const message = err instanceof Error ? err.message : '이미지 생성 중 오류가 발생했습니다.';
            setActionSequence(prev => prev.map(item => item.id === newItemId ? {...item, status: 'error', errorMessage: message.slice(0,100)} : item));
            setError(message);
        }

    }, [referenceImage, ensureBaseStyle]);


    const openLightbox = (url: string) => {
        setLightboxImage(url);
        setShowLightbox(true);
    };
    
    const handleDownloadImage = (url: string | null, item: ActionSequenceItem | { id: string, prompt: string }) => {
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
            id: item.id,
            prompt: item.prompt,
            referenceDescription,
            baseStyleDescription,
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

    const isGenerating = Object.values(generatedImages).some((img: GeneratedImage) => img.status === 'loading') || actionSequence.some(item => item.status === 'loading');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {showLightbox && lightboxImage && (
                <div 
                  className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                  onClick={() => setShowLightbox(false)}
                >
                  <img src={lightboxImage} alt="Expanded Ghibli Style" className="max-w-full max-h-full object-contain"/>
                  <button onClick={() => setShowLightbox(false)} className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/50 hover:bg-black/75 transition-colors z-50">
                    <XIcon className="h-6 w-6" />
                  </button>
                </div>
            )}

            {/* Left Panel: Controls */}
            <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-surface p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-3 text-text">1. 참조 이미지 업로드</h2>
                    <label htmlFor="ref-image-upload" className="w-full aspect-video bg-overlay rounded-md flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-subtle hover:border-primary transition-colors">
                        {referenceImageUrl ? (
                            <img src={referenceImageUrl} alt="업로드된 참조 이미지" className="max-w-full max-h-full object-contain rounded-md" />
                        ) : (
                            <div className="text-center text-muted">
                                <UploadIcon className="mx-auto h-10 w-10 mb-2" />
                                <p className="font-semibold">클릭하여 이미지 업로드</p>
                                <p className="text-xs">또는 파일을 드래그하세요 (최대 5MB)</p>
                            </div>
                        )}
                    </label>
                    <input id="ref-image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <div className="mt-4">
                        <label htmlFor="ref-description" className="block text-sm font-medium text-muted mb-1">AI를 위한 부연 설명 (동작 생성 시 사용)</label>
                        <textarea
                            id="ref-description"
                            rows={3}
                            value={referenceDescription}
                            onChange={(e) => setReferenceDescription(e.target.value)}
                            placeholder="예: 지붕 위에 있는 고양이가 핵심입니다. 스타일을 유지해주세요."
                            className="w-full p-2 border border-subtle rounded-md bg-white focus:ring-2 focus:ring-primary focus:border-primary transition"
                        />
                    </div>
                </div>
                <div className="bg-surface p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-3 text-text">2. 앵글 선택 및 생성</h2>
                     <div className="grid grid-cols-2 gap-3">
                        {angleDefs.map(def => (
                            <button
                                key={def.id}
                                onClick={() => handleGenerateAngle(def.id)}
                                disabled={isGenerating || !referenceImage}
                                className="py-3 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 border-2 bg-overlay text-muted hover:bg-stone-300 border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed"
                            >
                                {def.icon}
                                {def.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-surface p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-3 text-text">3. 동작 변주 생성</h2>
                    <div className="space-y-3">
                        <button onClick={() => handleGenerateAction(referenceDescription)} disabled={isGenerating || !referenceImage} className="w-full py-3 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 border-2 bg-overlay text-muted hover:bg-stone-300 border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed">
                            <MessageSquarePlusIcon className="h-5 w-5" />
                            <span>설명으로 동작 생성</span>
                        </button>
                        <button onClick={handleSuggestActions} disabled={isGenerating || !referenceImage || isSuggestingActions} className="w-full py-3 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 border-2 bg-secondary/80 text-black hover:bg-secondary border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed">
                             {isSuggestingActions ? <LoadingSpinner /> : <LightbulbIcon className="h-5 w-5" />}
                            <span>AI 동작 추천받기</span>
                        </button>
                         {suggestedActions.length > 0 && (
                            <div className="border-t border-overlay pt-3 space-y-2">
                                <h4 className="text-xs font-semibold text-muted">AI 추천 동작:</h4>
                                {suggestedActions.map((action, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleGenerateAction(action)}
                                        disabled={isGenerating}
                                        className="w-full text-left text-sm p-2 bg-overlay rounded-md hover:bg-stone-300 disabled:bg-stone-100 disabled:cursor-not-allowed"
                                    >
                                        "{action}"
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}
            </div>

            {/* Right Panel: Display */}
            <div className="lg:col-span-8 flex flex-col gap-6">
                 <div className="bg-surface p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-3 text-text">시네마틱 확장 결과</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="aspect-video"></div>
                        <div className="aspect-video relative">
                             <AngleThumbnail 
                                image={generatedImages.up}
                                onRegenerate={() => handleGenerateAngle('up')}
                                onDownload={() => handleDownloadImage(generatedImages.up.url, { id: 'up', prompt: 'up' })}
                                onShowLarge={() => generatedImages.up.url && openLightbox(generatedImages.up.url)}
                                label="위에서"
                             />
                        </div>
                        <div className="aspect-video"></div>
                        <div className="aspect-video relative">
                             <AngleThumbnail 
                                image={generatedImages.left}
                                onRegenerate={() => handleGenerateAngle('left')}
                                onDownload={() => handleDownloadImage(generatedImages.left.url, { id: 'left', prompt: 'left' })}
                                onShowLarge={() => generatedImages.left.url && openLightbox(generatedImages.left.url)}
                                label="좌측"
                             />
                        </div>
                        <div className="aspect-video bg-overlay rounded-lg flex items-center justify-center relative border-2 border-primary shadow-lg">
                            {referenceImageUrl ? <img src={referenceImageUrl} alt="참조" className="max-w-full max-h-full object-contain"/> : <span className="text-muted text-sm text-center p-2">이미지를 업로드하세요</span>}
                            <div className="absolute top-1 left-1 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded">참조</div>
                        </div>
                        <div className="aspect-video relative">
                             <AngleThumbnail 
                                image={generatedImages.right}
                                onRegenerate={() => handleGenerateAngle('right')}
                                onDownload={() => handleDownloadImage(generatedImages.right.url, { id: 'right', prompt: 'right' })}
                                onShowLarge={() => generatedImages.right.url && openLightbox(generatedImages.right.url)}
                                label="우측"
                             />
                        </div>
                        <div className="aspect-video"></div>
                        <div className="aspect-video relative">
                            <AngleThumbnail 
                                image={generatedImages.down}
                                onRegenerate={() => handleGenerateAngle('down')}
                                onDownload={() => handleDownloadImage(generatedImages.down.url, { id: 'down', prompt: 'down' })}
                                onShowLarge={() => generatedImages.down.url && openLightbox(generatedImages.down.url)}
                                label="아래에서"
                             />
                        </div>
                        <div className="aspect-video"></div>
                        <div className="aspect-video relative">
                            <AngleThumbnail 
                                image={generatedImages.zoomOut}
                                onRegenerate={() => handleGenerateAngle('zoomOut')}
                                onDownload={() => handleDownloadImage(generatedImages.zoomOut.url, { id: 'zoomOut', prompt: 'zoomOut' })}
                                onShowLarge={() => generatedImages.zoomOut.url && openLightbox(generatedImages.zoomOut.url)}
                                label="축소"
                             />
                        </div>
                         <div className="aspect-video relative">
                            <AngleThumbnail 
                                image={generatedImages.opposite}
                                onRegenerate={() => handleGenerateAngle('opposite')}
                                onDownload={() => handleDownloadImage(generatedImages.opposite.url, { id: 'opposite', prompt: 'opposite' })}
                                onShowLarge={() => generatedImages.opposite.url && openLightbox(generatedImages.opposite.url)}
                                label="반대편"
                             />
                        </div>
                         <div className="aspect-video relative">
                            <AngleThumbnail 
                                image={generatedImages.zoomIn}
                                onRegenerate={() => handleGenerateAngle('zoomIn')}
                                onDownload={() => handleDownloadImage(generatedImages.zoomIn.url, { id: 'zoomIn', prompt: 'zoomIn' })}
                                onShowLarge={() => generatedImages.zoomIn.url && openLightbox(generatedImages.zoomIn.url)}
                                label="확대"
                             />
                        </div>
                    </div>
                </div>
                 <div className="bg-surface p-6 rounded-lg shadow">
                     <h2 className="text-lg font-semibold mb-3 text-text">동작 변주 시퀀스</h2>
                     <div className="overflow-x-auto overflow-y-hidden pb-4">
                        <div className="flex gap-4 whitespace-nowrap">
                           {referenceImageUrl && (
                                <div className="inline-block w-64 h-36 flex-shrink-0">
                                <div className="w-full h-full bg-overlay rounded-lg flex items-center justify-center relative border-2 border-primary shadow-lg">
                                    <img src={referenceImageUrl} alt="참조" className="max-w-full max-h-full object-contain"/>
                                    <div className="absolute top-1 left-1 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded">시작 프레임</div>
                                </div>
                                </div>
                           )}
                           {actionSequence.map((item) => (
                               <div key={item.id} className="inline-block w-64 h-36 flex-shrink-0">
                                    <SequenceThumbnail
                                        image={item}
                                        onRegenerate={() => handleGenerateAction(item.prompt, true, item.id)}
                                        onDownload={() => handleDownloadImage(item.url, item)}
                                        onShowLarge={() => item.url && openLightbox(item.url)}
                                        label={`동작: ${item.prompt.substring(0, 15)}...`}
                                    />
                               </div>
                           ))}
                        </div>
                     </div>
                 </div>
            </div>
        </div>
    );
};

interface AngleThumbnailProps {
    image: GeneratedImage;
    onRegenerate: () => void;
    onDownload: () => void;
    onShowLarge: () => void;
    label: string;
}

const AngleThumbnail: React.FC<AngleThumbnailProps> = ({ image, onRegenerate, onDownload, onShowLarge, label }) => {
    // This component is simplified as there's no initial "generate" button. It's always a regeneration.
    return (
        <div className="w-full h-full bg-overlay rounded-lg flex items-center justify-center relative group">
            {image.status === 'idle' && (
                <div className="text-center text-muted">
                     <span className="text-xs mt-1">{label}</span>
                </div>
            )}
            {image.status === 'loading' && <LoadingSpinner />}
            {image.status === 'error' && (
                <div className="text-center p-2">
                    <p className="text-red-500 text-xs font-semibold">생성 실패</p>
                    <button onClick={onRegenerate} className="mt-2 p-1 bg-red-100 text-red-700 rounded-full">
                        <RefreshCwIcon className="h-4 w-4" />
                    </button>
                </div>
            )}
            {image.status === 'done' && image.url && (
                <>
                    <img src={image.url} alt={`Generated - ${label}`} className="max-w-full max-h-full object-contain cursor-pointer rounded-md" onClick={onShowLarge} />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-md">
                        <span className="text-white font-bold">크게 보기</span>
                    </div>
                    <div className="absolute bottom-2 right-2 flex gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={onRegenerate} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/75 transition-colors">
                            <RefreshCwIcon className="h-4 w-4" />
                        </button>
                        <button onClick={onDownload} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/75 transition-colors">
                            <DownloadIcon className="h-4 w-4" />
                        </button>
                    </div>
                </>
            )}
             <div className="absolute top-1 left-1 bg-black/40 text-white text-xs font-bold px-2 py-0.5 rounded">{label}</div>
        </div>
    );
};


interface SequenceThumbnailProps {
    image: ActionSequenceItem;
    onRegenerate: () => void;
    onDownload: () => void;
    onShowLarge: () => void;
    label: string;
}

const SequenceThumbnail: React.FC<SequenceThumbnailProps> = ({ image, onRegenerate, onDownload, onShowLarge, label }) => {
    return (
        <div className="w-full h-full bg-overlay rounded-lg flex items-center justify-center relative group">
            {image.status === 'loading' && <LoadingSpinner />}
            {image.status === 'error' && (
                <div className="text-center p-2">
                    <p className="text-red-500 text-xs font-semibold">생성 실패</p>
                    <p className="text-red-500 text-xs mt-1 truncate">{image.errorMessage}</p>
                    <button onClick={onRegenerate} className="mt-2 p-1 bg-red-100 text-red-700 rounded-full">
                        <RefreshCwIcon className="h-4 w-4" />
                    </button>
                </div>
            )}
            {image.status === 'done' && image.url && (
                <>
                    <img src={image.url} alt={label} className="max-w-full max-h-full object-contain cursor-pointer rounded-md" onClick={onShowLarge} />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-md">
                        <span className="text-white font-bold">크게 보기</span>
                    </div>
                    <div className="absolute bottom-2 right-2 flex gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={onRegenerate} title="다시 생성" className="p-2 bg-black/50 text-white rounded-full hover:bg-black/75 transition-colors">
                            <RefreshCwIcon className="h-4 w-4" />
                        </button>
                        <button onClick={onDownload} title="다운로드" className="p-2 bg-black/50 text-white rounded-full hover:bg-black/75 transition-colors">
                            <DownloadIcon className="h-4 w-4" />
                        </button>
                    </div>
                </>
            )}
             <div className="absolute top-1 left-1 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded truncate" title={label}>{label}</div>
        </div>
    );
};


export default CinematicExpansionStudio;