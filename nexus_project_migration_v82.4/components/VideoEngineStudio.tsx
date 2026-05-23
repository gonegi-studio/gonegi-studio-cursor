import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { 
  FilmIcon, 
  UploadIcon, 
  LoadingSpinner, 
  CheckCircleIcon, 
  AlertCircleIcon, 
  SparklesIcon,
  DownloadIcon,
  ShieldCheckIcon,
  PlayIcon,
  StarIcon,
  LayersIcon,
  TrashIcon
} from './IconComponents';
import { generateVideoWithVeo, analyzeVideo, secureDualSave, Character } from '../services/veoService';
import { CharacterBook } from '../types';
import { generateGhibliVideoPrompt } from '../services/geminiService'; // 추가

interface VideoAsset {
  hashId: string;
  fileName: string;
  videoUrl: string;
  analysis: any;
  status: 'PENDING' | 'GENERATING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  statusDetail?: string; // 추가: 상세 상태 메시지
  isMasterCandidate: boolean;
  isMaster: boolean;
  imageData?: string;
  mimeType?: string;
  params?: any;
  userPrompt: string;
  modelMode?: 'flash' | 'standard'; // 추가
  autoPrompted?: boolean; // 추가
}

interface VideoEngineStudioProps {
  characterBook: CharacterBook;
}

export interface VideoEngineStudioHandle {
  addFromLibrary: (char: any) => void;
}

const VideoEngineStudio = forwardRef<VideoEngineStudioHandle, VideoEngineStudioProps>(({ characterBook }, ref) => {
  const [queue, setQueue] = useState<VideoAsset[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [masterCandidates, setMasterCandidates] = useState<VideoAsset[]>([]);
  const [globalModelMode, setGlobalModelMode] = useState<'flash' | 'standard'>('flash');
  const [globalAutoPrompt, setGlobalAutoPrompt] = useState(true);
  const [globalCameraSpeed, setGlobalCameraSpeed] = useState<'normal' | 'slow' | 'glacial'>('normal');
  const [selectedHashId, setSelectedHashId] = useState<string | null>(null);

  // EAS (External Asset Standardizer) State
  const [externalFile, setExternalFile] = useState<File | null>(null);
  const [externalJsonFile, setExternalJsonFile] = useState<File | null>(null);
  const [externalEngine, setExternalEngine] = useState("Grok");
  const [externalPrompt, setExternalPrompt] = useState("");
  const [isStandardizing, setIsStandardizing] = useState(false);

  // --- [지중해 통합 라이브러리 허브] State 제거 ---
  
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []) as File[];
    if (files.length === 0) return;
    const imgMap = new Map<string, { data: string; mimeType: string; url: string }>();
    const jsonMap = new Map<string, any>();
    const filePromises = files.map(file => {
      return new Promise<void>((resolve) => {
        const baseName = file.name.split('.')[0];
        const reader = new FileReader();
        if (file.type.startsWith('image/')) {
          reader.onload = (e) => {
            const url = e.target?.result as string;
            imgMap.set(baseName, { data: url.split(',')[1], mimeType: file.type, url });
            resolve();
          };
          reader.readAsDataURL(file);
        } else if (file.name.endsWith('.json')) {
          reader.onload = (e) => {
            try {
              const rawJson = JSON.parse(e.target?.result as string);
              jsonMap.set(baseName, rawJson);
            } catch (err) { console.error(err); }
            resolve();
          };
          reader.readAsText(file);
        } else { resolve(); }
      });
    });
    await Promise.all(filePromises);
    
    const startIndex = queue.length;
    const newAssets: VideoAsset[] = [];
    imgMap.forEach((img, name) => {
      if (jsonMap.has(name) && !queue.some(a => a.fileName === name)) {
        newAssets.push({
          hashId: `pending_${name}_${Date.now()}`,
          fileName: name,
          videoUrl: '',
          analysis: null,
          status: 'PENDING',
          statusDetail: 'AI 연출가 대기 중...',
          isMasterCandidate: false,
          isMaster: false,
          imageData: img.data,
          mimeType: img.mimeType,
          params: jsonMap.get(name),
          userPrompt: jsonMap.get(name)?.prompt || "",
          modelMode: globalModelMode
        });
      }
    });

    if (newAssets.length > 0) {
        setQueue(prev => [...prev, ...newAssets]);

        // [NEW] Trigger Immediate AI Director Analysis
        if (globalAutoPrompt) {
            newAssets.forEach(async (asset, localIdx) => {
                const globalIdx = startIndex + localIdx;
                try {
                    // 1. 분석 시작 상태 표시
                    updateAssetStatus(globalIdx, 'PENDING', { statusDetail: '연출가: 구도 분석 중...' });
                    
                    // 2. AI 디렉터 프롬프트 생성
                    const aiPrompt = await generateGhibliVideoPrompt(
                        { data: asset.imageData!, mimeType: asset.mimeType! },
                        asset.userPrompt || "Cinematic Ghibli masterpiece",
                        globalCameraSpeed
                    );

                    // 3. UI 텍스트 영역에 즉시 반영
                    handlePromptChange(globalIdx, aiPrompt);
                    
                    // 4. 완료 상태 표시
                    const cameraMatch = aiPrompt.match(/(zoom|pan|tilt|dolly|focus|tracking)/i);
                    const movement = cameraMatch ? cameraMatch[0].toUpperCase() : 'SMOOTH';
                    updateAssetStatus(globalIdx, 'PENDING', { 
                        statusDetail: `연출가: ${movement} 연출 적용됨`
                    });
                } catch (err) {
                    console.error("Immediate analysis failed", err);
                    updateAssetStatus(globalIdx, 'PENDING', { statusDetail: '연출가: 분석 실패' });
                }
            });
        }
    }
    event.target.value = '';
  }, [queue, globalAutoPrompt, globalModelMode]);

  const downloadFile = (data: any, fileName: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const addFromLibrary = useCallback((char: any) => {
    const newAsset: VideoAsset = {
      hashId: `lib_${char.id}_${Date.now()}`,
      fileName: char.name,
      videoUrl: '',
      analysis: null,
      status: 'PENDING',
      isMasterCandidate: false,
      isMaster: false,
      userPrompt: `Action for ${char.name}: `,
      params: {
        prompt: char.visual_dna || char.dna || "",
        characterBook: { characters: [{ ...char, description: char.visual_dna || char.dna || "" }] },
        render_rules: characterBook.environmentDNA?.global
      }
    };
    setQueue(prev => [newAsset, ...prev]);
  }, [characterBook]);

  useImperativeHandle(ref, () => ({
    addFromLibrary
  }));

  // [지중해 연대기] 비법 레시피 생성기
  const constructVideoRecipe = (userAction: string, assetParams: any) => {
    // 1. 환경 DNA 추출 (ENV DNA 탭 데이터)
    const envDna = characterBook.environmentDNA?.global || "";
    
    // 2. 마스터 스타일 앵커 (DNA MASTER 탭 데이터)
    const styleAnchor = characterBook.styleAnchor || "";
    
    // 3. 캐릭터 DNA 추출 (ELITE & NPC 데이터)
    const characterDnas = assetParams.characterBook?.characters?.map((c: any) => {
      // 도감에서 최신 DNA를 찾아옴
      const bookChar = characterBook.characters.find(bc => bc.id === c.id) || 
                       characterBook.subCharacters?.find(sc => sc.id === c.id);
      return `[${c.name} DNA: ${bookChar?.visual_dna || c.description || ""}]`;
    }).join(" ") || "";

    // 4. 최종 레시피 조합
    return `
      [SCENE ACTION]: ${userAction}
      [ENVIRONMENT]: ${envDna}
      [STYLE ANCHOR]: ${styleAnchor}
      [CHARACTERS]: ${characterDnas}
      [PRODUCTION RULES]: Standard Ghibli Cel-Animation Engine v4.5. 
      High-fidelity 2D hand-painted textures. No 3D artifacts.
    `.trim();
  };

  const processQueue = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status !== 'PENDING') continue;
      
      setCurrentIndex(i);
      updateAssetStatus(i, 'GENERATING');

      try {
        const asset = queue[i];
        
        let finalActionPrompt = asset.userPrompt || asset.params.prompt || "moving gently";
        
        // [NEW] Ghibli MV Auto Prompting
        if (globalAutoPrompt && asset.imageData) {
          try {
            updateAssetStatus(i, 'GENERATING' as any, { statusDetail: 'AI 연출가: 구도 분석 중...' });
            const aiPrompt = await generateGhibliVideoPrompt(
              { data: asset.imageData, mimeType: asset.mimeType || 'image/png' },
              finalActionPrompt,
              globalCameraSpeed
            );
            
            // 시각적 피드백을 위해 상태 상세 메시지 업데이트
            const cameraMatch = aiPrompt.match(/(zoom|pan|tilt|dolly|tracking|focus)/i);
            const cameraMovement = cameraMatch ? cameraMatch[0].toUpperCase() : 'SMOOTH';
            
            updateAssetStatus(i, 'GENERATING' as any, { 
              statusDetail: `연출가: ${cameraMovement} 움직임 적용 중...` 
            });
            
            finalActionPrompt = aiPrompt;
            handlePromptChange(i, finalActionPrompt);
          } catch (pe) {
            console.error("Auto prompt failed", pe);
          }
        }

        // [지중해 연대기] 레시피 생성
        const finalPrompt = constructVideoRecipe(finalActionPrompt, asset.params);

        const characters: Character[] = asset.params.characterBook?.characters?.map((c: any, idx: number) => ({
          id: c.id || `char_${idx}`,
          name: c.name,
          position: c.position || (idx % 2 === 0 ? 'left' : 'right')
        })) || [];

        const { videoUrl, hashId } = await generateVideoWithVeo({
          imageData: asset.imageData!,
          mimeType: asset.mimeType!,
          characters,
          actionHint: finalActionPrompt,
          modelMode: globalModelMode,
          cameraSpeed: globalCameraSpeed,
          fullParameters: { ...asset.params, finalPrompt } // 레시피 포함
        });

        updateAssetStatus(i, 'ANALYZING', { hashId, videoUrl });

        const analysis = await analyzeVideo(videoUrl, asset.userPrompt || asset.params.prompt || "moving gently");
        const videoBlob = await fetch(videoUrl).then(r => r.blob());
        
        // [지중해 연대기 표준] 이중 저장 및 데이터 반환
        const { asmData, recipeData } = await secureDualSave(hashId, videoBlob, analysis, { ...asset.params, prompt: finalActionPrompt });

        // [NEW] Consolidated Auto-Download Logic
        const baseName = asset.fileName || `video_${Date.now()}`;
        
        // 1. JSON Files (Using a slight delay to ensure browser handles multiple downloads)
        setTimeout(() => downloadFile(asmData, `${baseName}_asm.json`), 100);
        setTimeout(() => downloadFile(recipeData, `${baseName}_recipe.json`), 300);

        // 2. Video File
        const videoDownloadLink = document.createElement('a');
        videoDownloadLink.href = videoUrl;
        videoDownloadLink.download = `${baseName}.mp4`;
        document.body.appendChild(videoDownloadLink);
        videoDownloadLink.click();
        document.body.removeChild(videoDownloadLink);

        const updatedAsset: VideoAsset = {
          ...asset,
          hashId,
          videoUrl,
          analysis,
          status: 'COMPLETED',
          isMasterCandidate: analysis.consistencyScore >= 9.5
        };

        setQueue(prev => {
          const next = [...prev];
          next[i] = updatedAsset;
          return next;
        });
        
        // [NEW] Automatically select the latest completed video
        setSelectedHashId(hashId);

        if (updatedAsset.isMasterCandidate) {
          setMasterCandidates(prev => [updatedAsset, ...prev]);
        }
      } catch (error) {
        console.error(error);
        updateAssetStatus(i, 'FAILED');
      }
    }

    setIsProcessing(false);
    setCurrentIndex(-1);
  };

  const updateAssetStatus = (index: number, status: VideoAsset['status'], extra = {}) => {
    setQueue(prev => {
      const next = [...prev];
      next[index] = { ...next[index], status, ...extra };
      return next;
    });
  };

  const promoteToMaster = async (hashId: string) => {
    try {
      await fetch("/api/promote-master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hashId })
      });
      setQueue(prev => prev.map(a => a.hashId === hashId ? { ...a, isMaster: true } : a));
      setMasterCandidates(prev => prev.map(a => a.hashId === hashId ? { ...a, isMaster: true } : a));
      alert("🌟 Golden Recipe로 승격되었습니다!");
    } catch (error) {
      alert("승격 실패");
    }
  };

  const handlePromptChange = (index: number, value: string) => {
    setQueue(prev => {
      const next = [...prev];
      next[index] = { ...next[index], userPrompt: value };
      return next;
    });
  };

  const handleExternalProcess = async () => {
    if (!externalFile) return;
    setIsStandardizing(true);

    try {
      const hashId = `eas_${Date.now()}`;
      const videoUrl = URL.createObjectURL(externalFile);
      const videoBlob = externalFile;

      // 1. JSON 레시피 파일 읽기 (선택 사항)
      let baseParams = { prompt: externalPrompt };
      if (externalJsonFile) {
        const jsonText = await externalJsonFile.text();
        try {
          const parsed = JSON.parse(jsonText);
          baseParams = { ...parsed, ...baseParams };
          // 액션 프롬프트가 있으면 기존 프롬프트에 추가
          if (externalPrompt) {
            baseParams.prompt = `${baseParams.prompt}. Action: ${externalPrompt}`;
          }
        } catch (e) {
          console.error("EAS JSON Parse Error:", e);
        }
      }

      // 2. 분석 (EAS 표준화 로직 적용)
      const analysis = await analyzeVideo(videoUrl, externalPrompt || "external motion", externalEngine);

      // 3. 이중 저장 및 다운로드
      const { asmData, recipeData } = await secureDualSave(hashId, videoBlob, analysis, baseParams);

      const baseFileName = externalFile.name.split('.')[0];
      downloadFile(asmData, `${baseFileName}_asm.json`);
      downloadFile(recipeData, `${baseFileName}_recipe.json`);

      // [NEW] Unified Video Filename Download for EAS
      const videoDownloadLink = document.createElement('a');
      videoDownloadLink.href = videoUrl;
      videoDownloadLink.download = `${baseFileName}.mp4`;
      document.body.appendChild(videoDownloadLink);
      videoDownloadLink.click();
      document.body.removeChild(videoDownloadLink);

      // 4. 결과 표시를 위해 큐에 추가
      const newAsset: VideoAsset = {
        hashId,
        fileName: externalFile.name,
        videoUrl,
        analysis,
        status: 'COMPLETED',
        isMasterCandidate: analysis.consistencyScore >= 9.5,
        isMaster: false,
        userPrompt: externalPrompt,
        params: baseParams
      };
      setQueue(prev => [newAsset, ...prev]);
      
      alert(`✅ [${externalEngine}] 표준화 완료! 원본 레시피와 액션이 결합된 데이터가 추출되었습니다.`);
      setExternalFile(null);
      setExternalJsonFile(null);
      setExternalPrompt("");
    } catch (error) {
      console.error(error);
      alert("표준화 실패");
    } finally {
      setIsStandardizing(false);
    }
  };

  const removeAsset = (hashId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 항목 클릭(영상 선택) 방지
    setQueue(prev => {
      const newQueue = prev.filter(a => a.hashId !== hashId);
      // 만약 삭제된 항목이 현재 선택된 항목이었다면 선택 해제
      if (selectedHashId === hashId) {
        setSelectedHashId(null);
      }
      return newQueue;
    });
  };

  const manualDownload = (asset: VideoAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    if (asset.status !== 'COMPLETED') return;
    
    const baseName = asset.fileName || `video_${asset.hashId.substring(0, 8)}`;
    
    // ASM JSON
    const asmData = {
      standard: "ASM/V1.2",
      origin: "VEO_GHIBLI_PIPELINE",
      hashId: asset.hashId,
      analysis: asset.analysis,
      timestamp: new Date().toISOString()
    };
    
    // Recipe JSON
    const recipeData = {
      ...asset.params,
      prompt: asset.userPrompt,
      hashId: asset.hashId
    };

    // Staggered downloads for browser reliability
    setTimeout(() => downloadFile(asmData, `${baseName}_asm.json`), 100);
    setTimeout(() => downloadFile(recipeData, `${baseName}_recipe.json`), 400);

    // Video File
    if (asset.videoUrl) {
      setTimeout(() => {
        const videoDownloadLink = document.createElement('a');
        videoDownloadLink.href = asset.videoUrl;
        videoDownloadLink.download = `${baseName}.mp4`;
        document.body.appendChild(videoDownloadLink);
        videoDownloadLink.click();
        document.body.removeChild(videoDownloadLink);
      }, 700);
    }
  };

  const currentAsset = currentIndex >= 0 
    ? queue[currentIndex] 
    : (selectedHashId ? queue.find(a => a.hashId === selectedHashId) : null) || ([...queue].reverse().find(a => a.status === 'COMPLETED') || null);

  // Latest selection auto-sync
  const latestCompleted = [...queue].reverse().find(a => a.status === 'COMPLETED');
  if (latestCompleted && !selectedHashId && latestCompleted.hashId !== currentAsset?.hashId) {
    // This part is handled by processQueue, but we ensure robustness here
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
      {/* 라이브러리 허브 섹션 제거됨 (CharacterBookModal로 통합) */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left: Batch Queue Panel */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-overlay flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <LayersIcon className="w-4 h-4 text-primary" /> 배치 큐 ({queue.length})
            </h2>
            <div className="flex items-center gap-2">
              {/* [NEW] Model Selection */}
              <div className="flex bg-stone-100 p-1 rounded-lg border border-overlay">
                <button 
                  onClick={() => setGlobalModelMode('flash')}
                  className={`px-2 py-1 text-[8px] font-black uppercase rounded ${globalModelMode === 'flash' ? 'bg-primary text-white' : 'text-muted'}`}
                >
                  Flash
                </button>
                <button 
                  onClick={() => setGlobalModelMode('standard')}
                  className={`px-2 py-1 text-[8px] font-black uppercase rounded ${globalModelMode === 'standard' ? 'bg-secondary text-black' : 'text-muted'}`}
                >
                  HD
                </button>
              </div>

              {/* [NEW] Camera Speed Selection */}
              <div className="flex flex-col gap-1">
                <span className="text-[7px] font-black uppercase text-muted tracking-tighter opacity-70">영상 속도</span>
                <div className="flex bg-stone-100 p-0.5 rounded-lg border border-overlay">
                  <button 
                    onClick={() => setGlobalCameraSpeed('normal')}
                    className={`px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${globalCameraSpeed === 'normal' ? 'bg-stone-500 text-white shadow-sm' : 'text-muted hover:bg-stone-200'}`}
                    title="표준 시네마틱 흐름"
                  >
                    <div className={`w-1 h-1 rounded-full ${globalCameraSpeed === 'normal' ? 'bg-white' : 'bg-stone-400'}`} />
                    보통
                  </button>
                  <button 
                    onClick={() => setGlobalCameraSpeed('slow')}
                    className={`px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${globalCameraSpeed === 'slow' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-stone-200'}`}
                    title="시네마틱 슬로우 모션"
                  >
                    <div className={`w-1 h-1 rounded-full ${globalCameraSpeed === 'slow' ? 'bg-white' : 'bg-primary'}`} />
                    느리게
                  </button>
                  <button 
                    onClick={() => setGlobalCameraSpeed('glacial')}
                    className={`px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${globalCameraSpeed === 'glacial' ? 'bg-secondary text-black shadow-sm' : 'text-muted hover:bg-stone-200'}`}
                    title="매우 느리고 미세한 움직임"
                  >
                    <div className={`w-1 h-1 rounded-full ${globalCameraSpeed === 'glacial' ? 'bg-black' : 'bg-secondary'}`} />
                    정지 수준
                  </button>
                </div>
              </div>

              {/* [NEW] Auto-Prompt Toggle */}
              <button 
                onClick={() => setGlobalAutoPrompt(!globalAutoPrompt)}
                className={`p-2 rounded-lg border transition-all ${globalAutoPrompt ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-stone-50 border-stone-200 text-muted'}`}
                title="AI 연출가 자동 프롬프트"
              >
                <SparklesIcon className={`w-4 h-4 ${globalAutoPrompt ? 'animate-pulse' : ''}`} />
              </button>

              <label className="cursor-pointer p-2 bg-stone-100 rounded-lg hover:bg-white border border-stone-200 transition-colors">
                <UploadIcon className="w-4 h-4 text-muted" />
                <input type="file" multiple accept="image/*,.json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {queue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted opacity-40 text-center p-8">
                <UploadIcon className="w-12 h-12 mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest">이미지와 JSON 쌍을 업로드하여 큐를 채우세요</p>
              </div>
            ) : (
              queue.map((asset, idx) => (
                <div 
                  key={asset.fileName} 
                  onClick={() => setSelectedHashId(asset.hashId)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    (selectedHashId === asset.hashId || (selectedHashId === null && currentAsset?.hashId === asset.hashId)) 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-md' 
                      : currentIndex === idx 
                        ? 'border-blue-400 bg-blue-50/50'
                        : 'border-overlay bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-200 rounded-lg flex items-center justify-center text-[10px] font-bold overflow-hidden border border-stone-300">
                      {asset.status === 'COMPLETED' ? (
                        <video src={asset.videoUrl} className="w-full h-full object-cover" muted />
                      ) : (
                        asset.imageData ? (
                          <img src={`data:${asset.mimeType || 'image/png'};base64,${asset.imageData}`} className="w-full h-full object-cover" alt="thumb" />
                        ) : (
                          asset.fileName.slice(0, 3)
                        )
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-bold truncate">{asset.fileName}</p>
                        <div className="flex items-center gap-0.5">
                          {asset.status === 'COMPLETED' && (
                            <button 
                              onClick={(e) => manualDownload(asset, e)}
                              className="p-1.5 text-stone-400 hover:text-primary hover:bg-primary/10 rounded-md transition-all flex-shrink-0"
                              title="수동 다운로드 (Video + 2 JSON)"
                            >
                              <DownloadIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => removeAsset(asset.hashId, e)}
                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all flex-shrink-0"
                            title="삭제하기"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {asset.userPrompt && asset.userPrompt.length > 10 && (
                          <div className="flex gap-1">
                            {['pan', 'zoom', 'tilt', 'dolly', 'focus', 'glacial', 'slow', 'subtle'].map(tag => 
                              asset.userPrompt.toLowerCase().includes(tag) && (
                                <span key={tag} className="text-[8px] px-1 bg-primary/10 text-primary border border-primary/20 rounded uppercase font-black">
                                  {tag === 'subtle' ? 'Subtle' : tag}
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                          asset.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                          asset.status === 'GENERATING' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                          asset.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-stone-200 text-muted'
                        }`}>
                          {asset.status === 'COMPLETED' ? '완료' : 
                           asset.status === 'GENERATING' ? '생성 중' :
                           asset.status === 'ANALYZING' ? '분석 중' :
                           asset.status === 'PENDING' ? '대기' : '실패'}
                        </span>
                        <span className="text-[8px] text-muted truncate max-w-[100px]">
                          {asset.statusDetail || (asset.analysis ? `점수: ${asset.analysis.consistencyScore}` : '대기 중...')}
                        </span>
                        {asset.analysis?.physicsLogic && (
                          <div className="flex gap-1 ml-1">
                            <span className="text-[7px] px-1 bg-blue-50 text-blue-500 border border-blue-100 rounded font-bold">
                              PHY: {asset.analysis.physicsLogic.windForce}w
                            </span>
                            <span className="text-[7px] px-1 bg-amber-50 text-amber-600 border border-amber-100 rounded font-bold">
                              DNA: {asset.analysis.materialDNA?.viscosity}v
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {asset.isMasterCandidate && !asset.isMaster && (
                      <button onClick={() => promoteToMaster(asset.hashId)} className="p-1.5 bg-secondary text-black rounded-lg hover:scale-110 transition-transform">
                        <StarIcon className="w-3 h-3" />
                      </button>
                    )}
                    {asset.isMaster && <StarIcon className="w-4 h-4 text-secondary fill-secondary" />}
                  </div>
                  
                  {/* Prompt Editor for Pending Assets */}
                  {asset.status === 'PENDING' && (
                    <div className="mt-3">
                      <textarea
                        value={asset.userPrompt}
                        onChange={(e) => handlePromptChange(idx, e.target.value)}
                        placeholder="여기에 액션 프롬프트를 입력하세요 (예: 손을 흔들며 웃음)"
                        className="w-full p-2 text-[10px] bg-white border border-stone-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[60px] resize-none font-medium"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <button 
            onClick={processQueue}
            disabled={isProcessing || queue.filter(a => a.status === 'PENDING').length === 0}
            className="w-full mt-4 py-4 bg-primary text-white font-black rounded-xl shadow-lg hover:bg-primary-focus transition-all disabled:bg-stone-300 flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            {isProcessing ? <LoadingSpinner /> : <PlayIcon className="w-5 h-5" />}
            {isProcessing ? "배치 작업 중..." : "배치 생성 시작"}
          </button>
        </div>

        {/* External Asset Standardizer (EAS) */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-overlay border-l-4 border-l-secondary">
          <h2 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <UploadIcon className="w-4 h-4 text-secondary" /> 외부 에셋 표준화 (EAS)
          </h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={externalEngine} 
                onChange={(e) => setExternalEngine(e.target.value)}
                placeholder="엔진 (Grok, Sora...)"
                className="w-1/3 p-2 text-[10px] bg-stone-50 border border-stone-200 rounded-lg outline-none font-bold"
              />
              <label className="flex-grow cursor-pointer p-2 bg-stone-100 rounded-lg hover:bg-white border border-stone-200 transition-colors flex items-center justify-center gap-2 text-[10px] font-bold">
                <UploadIcon className="w-3 h-3" /> {externalFile ? externalFile.name : "MP4 업로드"}
                <input type="file" accept="video/mp4" onChange={(e) => setExternalFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
            </div>
            
            {/* New: JSON Recipe Upload for EAS */}
            <label className="w-full cursor-pointer p-2 bg-stone-100 rounded-lg hover:bg-white border border-stone-200 transition-colors flex items-center justify-center gap-2 text-[10px] font-bold">
              <LayersIcon className="w-3 h-3 text-primary" /> {externalJsonFile ? externalJsonFile.name : "레시피 JSON 업로드 (선택)"}
              <input type="file" accept=".json" onChange={(e) => setExternalJsonFile(e.target.files?.[0] || null)} className="hidden" />
            </label>

            <textarea
              value={externalPrompt}
              onChange={(e) => setExternalPrompt(e.target.value)}
              placeholder="외부 영상의 프롬프트/내용을 입력하세요"
              className="w-full p-2 text-[10px] bg-white border border-stone-200 rounded-lg focus:border-secondary focus:ring-1 focus:ring-secondary outline-none min-h-[60px] resize-none font-medium"
            />
            <button 
              onClick={handleExternalProcess}
              disabled={!externalFile || isStandardizing}
              className="w-full py-3 bg-secondary text-black font-black rounded-xl shadow-md hover:scale-[1.02] transition-all disabled:bg-stone-200 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
            >
              {isStandardizing ? <LoadingSpinner /> : <SparklesIcon className="w-4 h-4" />}
              외부 에셋 표준화 실행
            </button>
          </div>
        </div>

        {/* Master Archive */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-overlay">
          <h2 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <StarIcon className="w-4 h-4 text-secondary" /> 골든 레시피
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {masterCandidates.filter(a => a.isMaster).map(asset => (
              <div key={asset.hashId} className="aspect-square bg-black rounded-lg overflow-hidden border border-secondary/50 relative group cursor-pointer">
                <video src={asset.videoUrl} className="w-full h-full object-cover" muted />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <PlayIcon className="w-4 h-4 text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Preview & Analysis */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-overlay flex-grow flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <PlayIcon className="w-4 h-4 text-primary" /> 시네마틱 프리뷰 {currentAsset && `- ${currentAsset.fileName}`}
            </h2>
            {currentAsset?.hashId && !currentAsset.hashId.startsWith('pending') && (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                <ShieldCheckIcon className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase">해시: {currentAsset.hashId.slice(0, 8)}</span>
              </div>
            )}
          </div>

          <div className="aspect-video bg-black rounded-2xl overflow-hidden relative border border-overlay shadow-2xl">
            {currentAsset?.videoUrl ? (
              <video 
                key={currentAsset.videoUrl}
                src={currentAsset.videoUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full h-full object-contain" 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/20">
                {currentAsset?.status === 'GENERATING' ? (
                   <div className="flex flex-col items-center gap-4">
                     <LoadingSpinner />
                     <p className="text-xs font-black uppercase tracking-widest animate-pulse">Veo Flash 렌더링 중...</p>
                   </div>
                ) : (
                  <>
                    <FilmIcon className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">영상 제작 대기 중...</p>
                  </>
                )}
              </div>
            )}
          </div>

          {currentAsset?.analysis && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-stone-50 p-5 rounded-2xl border border-overlay">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                  <SparklesIcon className="w-3 h-3" /> _asm.json (어셈블러)
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-muted uppercase mb-1">일관성</span>
                      <span className="text-sm font-black text-primary">{currentAsset.analysis.consistencyScore}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-muted uppercase mb-1">눈가 광택</span>
                      <span className="text-sm font-black text-secondary">{currentAsset.analysis.eyeGlossScore}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-muted uppercase mb-1">마스크 고정</span>
                      <span className="text-sm font-black text-emerald-600">{currentAsset.analysis.maskFixationScore}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-muted uppercase mb-1">소스 엔진</span>
                      <span className="text-[10px] font-bold text-stone-700">{currentAsset.analysis.sourceEngine}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-muted uppercase mb-1">캔버스 핏</span>
                      <span className={`text-[10px] font-bold ${currentAsset.analysis.canvasFit?.needsFit ? 'text-secondary' : 'text-emerald-600'}`}>
                        {currentAsset.analysis.canvasFit?.originalRatio} {currentAsset.analysis.canvasFit?.needsFit ? '(수정 필요)' : '(표준)'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary" style={{ width: `${currentAsset.analysis.consistencyScore * 10}%` }} />
                  </div>

                  <div className="pt-2">
                    <p className="text-[9px] font-bold text-muted uppercase mb-1">타임라인 이벤트</p>
                    <p className="text-xs font-medium leading-relaxed">{currentAsset.analysis.timeline}</p>
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 p-5 rounded-2xl border border-overlay flex flex-col">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                  <ShieldCheckIcon className="w-3 h-3" /> _recipe.json (레시피)
                </h3>
                <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                    <ShieldCheckIcon className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">보관소 및 PC 보안 완료</p>
                  <p className="text-[9px] text-muted leading-tight">
                    제조 비법이 Local Vault에 격리 저장되었으며,<br />
                    사용자 PC로 자동 추출이 완료되었습니다.
                  </p>
                </div>
                {currentAsset.isMaster && (
                  <div className="mt-2 p-2 bg-secondary/10 border border-secondary/30 rounded-lg flex items-center justify-center gap-2">
                    <StarIcon className="w-3 h-3 text-secondary fill-secondary" />
                    <span className="text-[9px] font-black text-secondary uppercase">골든 레시피 승격됨</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
});

export default VideoEngineStudio;
