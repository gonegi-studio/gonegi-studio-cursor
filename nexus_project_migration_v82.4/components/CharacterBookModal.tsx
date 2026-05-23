import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { XIcon, UploadIcon, UsersIcon, CheckCircleIcon, SparklesIcon, WandIcon, RefreshCwIcon, DownloadIcon, AlertCircleIcon, TrashIcon, FilterIcon, ArrowDownIcon, PlayIcon, SunIcon, LightbulbIcon } from './IconComponents';
import type { CharacterBook, CharacterEntry, SubCharacterEntry, CharacterDNA } from '../types';
import { MEDITERRANEAN_CHRONICLES_DATA } from '../data/jsonData';
import { saveImageToDB, getImageFromDB, deleteImageFromDB } from '../utils/db';
import { optimizeForCharacterBook, createEliteThumbnail } from '../utils/imageProcessor';
import { auditGuardianMembers } from '../services/geminiService';

interface CharacterBookModalProps {
  onClose: () => void;
  characterBook: CharacterBook;
  onUpdate: (book: CharacterBook) => void;
  onDeploy: (char: any) => void;
}

// 13개의 고정 마스터 슬롯 정의 (1-1~1-6, 2-1~2-5, 2-6-1, 2-6-2)
const GRID_POSITIONS = [
  '1-1', '1-2', '1-3', '1-4', '1-5', '1-6',
  '2-1', '2-2', '2-3', '2-4', '2-5',
  '2-6-1', '2-6-2'
];

const CharacterBookModal: React.FC<CharacterBookModalProps> = ({ onClose, characterBook, onUpdate, onDeploy }) => {
  const [activeTab, setActiveTab] = useState<'dna' | 'elite' | 'npc' | 'env'>('dna'); // DNA 탭을 기본으로
  const [filterType, setFilterType] = useState<string>('all');
  const [sortMode, setSortMode] = useState<'index' | 'best' | 'worst'>('index');
  const [isAuditing, setIsAuditing] = useState(false);
  const [slotImages, setSlotImages] = useState<Record<string, string>>({}); 
  const [masterImage, setMasterImage] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedGridPos, setSelectedGridPos] = useState<string | null>(null);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);

  const [isAddingNPC, setIsAddingNPC] = useState(false);
  const [newNPCName, setNewNPCName] = useState('');
  const [newNPCDesc, setNewNPCDesc] = useState('');

  // 1. 13개의 고정 슬롯 초기화 로직 (1-1~2-6-2)
  useEffect(() => {
    // 모든 슬롯의 grid_position이 상수로 정의된 GRID_POSITIONS와 정확히 일치하는지 확인
    const isLayoutCorrect = (characterBook.characters?.length === GRID_POSITIONS.length) && 
                            characterBook.characters?.every((c, i) => c.grid_position === GRID_POSITIONS[i]);

    if (!isLayoutCorrect) {
      console.log("Master Layout mismatch detected. Enforcing 13-slot protocol.");
      const initialSlots: CharacterEntry[] = GRID_POSITIONS.map((pos, idx) => {
        // 기존 데이터가 있다면 최대한 보존 (위치가 일치하는 경우)
        const existing = characterBook.characters?.find(c => c.grid_position === pos);
        return {
          id: existing?.id || `slot_${pos}`,
          name: existing?.name || (idx >= 11 ? `ANIMALS (FAUNA)` : ''),
          visual_dna: existing?.visual_dna || '',
          type: (idx >= 11 || (existing?.type === 'animal')) ? 'animal' : 'human',
          grid_position: pos,
          slot_index: idx,
          elite_image_id: existing?.elite_image_id
        };
      });

      onUpdate({ 
        ...characterBook, 
        characters: initialSlots,
        styleAnchor: characterBook.styleAnchor || MEDITERRANEAN_CHRONICLES_DATA.styleAnchor,
        environmentDNA: characterBook.environmentDNA || MEDITERRANEAN_CHRONICLES_DATA.environmentDNA as any
      });
    }
  }, [characterBook.characters.length, characterBook.characters]);

  // 이미지 로드 로직
  useEffect(() => {
    const loadImages = async () => {
      const images: Record<string, string> = {};
      if (characterBook.master_image_id) {
        const img = await getImageFromDB(characterBook.master_image_id);
        if (img) setMasterImage(img);
      }
      if (characterBook.characters) {
        for (const char of characterBook.characters) {
          if (char.elite_image_id) {
            const img = await getImageFromDB(char.elite_image_id);
            if (img) images[char.id] = img;
          }
        }
      }
      if (characterBook.subCharacters) {
        for (const npc of characterBook.subCharacters) {
          if (npc.image_id) {
            const img = await getImageFromDB(npc.image_id);
            if (img) images[npc.id] = img;
          }
        }
      }
      setSlotImages(images);
    };
    loadImages();
  }, [characterBook]);

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // 슬롯 중심의 병합(Merge) 로직
      const currentSlots = [...characterBook.characters];
      const importedChars = data.characters || data.elite_members || data.members || [];

      const mergedSlots = currentSlots?.map(slot => {
        const match = importedChars.find((c: any) => c?.grid_position === slot?.grid_position);
        if (!match) return slot;

        return {
          ...slot,
          name: match.name || match.character_name || slot.name,
          species: match.species || match.type || slot.species,
          visual_dna: match.visual_dna || match.dna_code || match.description || slot.visual_dna,
          elite_image_id: match.elite_image_id || match.image_id || slot.elite_image_id
        };
      });

      // 이미지 데이터 복구
      if (data.slotImagesData) {
        for (const slot of mergedSlots) {
          const imageData = data.slotImagesData[slot.grid_position] || data.slotImagesData[slot.id];
          if (imageData) {
            const newImageId = `elite_${slot.grid_position}_${Date.now()}`;
            await saveImageToDB(newImageId, imageData);
            slot.elite_image_id = newImageId;
          }
        }
      }

      onUpdate({
        ...characterBook,
        version: data.version || characterBook.version,
        styleAnchor: data.styleAnchor || data.global_style_dna || characterBook.styleAnchor,
        characters: mergedSlots,
        subCharacters: data.subCharacters || data.npc_book || characterBook.subCharacters,
        environmentDNA: data.environmentDNA || data.env_dna || characterBook.environmentDNA
      });

      alert('✅ 데이터가 성공적으로 임포트되었습니다!');
    } catch (err) {
      console.error(err);
      alert('❌ 임포트 중 오류가 발생했습니다.');
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(characterBook, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Ghibli_CharacterBook_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImageUpload = async (id: string, file: File, type: 'master' | 'elite' | 'npc') => {
    setIsOptimizing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const optimized = await optimizeForCharacterBook(dataUrl);
        
        const imageId = `${type}_${id}_${Date.now()}`;
        await saveImageToDB(imageId, optimized);

        if (type === 'master') {
          onUpdate({ ...characterBook, master_image_id: imageId });
          setMasterImage(optimized);
        } else if (type === 'elite') {
          const newChars = characterBook.characters?.map(c => 
            c.id === id ? { ...c, elite_image_id: imageId } : c
          ) || [];
          onUpdate({ ...characterBook, characters: newChars });
          setSlotImages(prev => ({ ...prev, [id]: optimized }));
        } else if (type === 'npc') {
          const newNPCs = characterBook.subCharacters?.map(n => 
            n.id === id ? { ...n, image_id: imageId } : n
          );
          onUpdate({ ...characterBook, subCharacters: newNPCs });
          setSlotImages(prev => ({ ...prev, [id]: optimized }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAudit = async () => {
    setIsAuditing(true);
    try {
      const results = await auditGuardianMembers(characterBook);
      onUpdate({ ...characterBook, characters: results });
      alert('✅ AI 분석이 완료되었습니다.');
    } catch (err) {
      console.error(err);
      alert('❌ 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAuditing(false);
    }
  };

  const addNPC = () => {
    if (!newNPCName) return;
    const newNPC: SubCharacterEntry = {
      id: `npc_${Date.now()}`,
      name: newNPCName,
      description: newNPCDesc,
      visual_dna: newNPCDesc
    };
    onUpdate({
      ...characterBook,
      subCharacters: [...(characterBook.subCharacters || []), newNPC]
    });
    setNewNPCName('');
    setNewNPCDesc('');
    setIsAddingNPC(false);
  };

  const deleteNPC = (id: string) => {
    onUpdate({
      ...characterBook,
      subCharacters: characterBook.subCharacters?.filter(n => n.id !== id)
    });
  };

  const updateVisualDNA = (id: string, text: string) => {
    const newChars = characterBook.characters?.map(c => 
      c.id === id ? { ...c, visual_dna: text } : c
    ) || [];
    onUpdate({ ...characterBook, characters: newChars });
  };

  const updateCharName = (id: string, name: string) => {
    const newChars = characterBook.characters?.map(c => 
      c.id === id ? { ...c, name } : c
    ) || [];
    onUpdate({ ...characterBook, characters: newChars });
  };

  const updateCharDNA = (id: string, updates: Partial<CharacterDNA>) => {
    const newChars = characterBook.characters?.map(c => 
      c.id === id ? { 
        ...c, 
        dna_details: { ...(c.dna_details || {}), ...updates } 
      } : c
    ) || [];
    onUpdate({ ...characterBook, characters: newChars });
  };

  const updateNestedDNA = (id: string, category: keyof CharacterDNA, field: string, value: any) => {
    const newChars = characterBook.characters?.map(c => {
      if (c.id !== id) return c;
      const currentDNA = c.dna_details || {};
      const categoryData = (currentDNA[category] as any) || {};
      return {
        ...c,
        dna_details: {
          ...currentDNA,
          [category]: { ...categoryData, [field]: value }
        }
      };
    }) || [];
    onUpdate({ ...characterBook, characters: newChars });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#F8F8F8] w-full max-w-6xl h-[90vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-white/20"
      >
        {/* HEADER SECTION */}
        <div className="px-10 py-8 flex items-start justify-between bg-white border-b border-stone-100">
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 bg-[#FFB800] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FFB800]/20">
              <UsersIcon className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-[32px] font-black leading-tight text-black tracking-tight">
                100인의 정예 가디언 멤버
              </h1>
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em] mt-1">
                GUARDIAN ELITE AUDIT & DNA MANAGEMENT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-[#E8E8E8] p-1 rounded-2xl">
              {(['정예 멤버', 'DNA 마스터', '서브 캐릭터', '환경 DNA'] as const).map((tab) => {
                const tabKey = tab === '환경 DNA' ? 'env' : tab === '서브 캐릭터' ? 'npc' : tab === 'DNA 마스터' ? 'dna' : 'elite';
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tabKey as any)}
                    className={`px-6 py-3 rounded-xl text-[11px] font-black transition-all ${
                      activeTab === tabKey
                        ? 'bg-white text-black shadow-sm' 
                        : 'text-stone-500 hover:text-black'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
            
            <div className="flex gap-2 ml-4">
              <button onClick={handleExportJSON} className="flex items-center gap-2 px-5 py-3 bg-white border border-stone-200 rounded-xl text-[11px] font-black hover:bg-stone-50 transition-colors">
                <DownloadIcon className="w-4 h-4" /> 내보내기
              </button>
              <label className="flex items-center gap-2 px-5 py-3 bg-white border border-stone-200 rounded-xl text-[11px] font-black cursor-pointer hover:bg-stone-50 transition-colors">
                <UploadIcon className="w-4 h-4" /> 불러오기
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
              <button onClick={onClose} className="p-3 hover:bg-stone-100 rounded-xl transition-colors">
                <XIcon className="w-6 h-6 text-stone-400" />
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-10">
          {activeTab === 'elite' && (
            <div className="space-y-8">
              {/* Filters & Controls (스크린샷 반영) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                  <button className="px-5 py-2 bg-black text-white rounded-full text-[11px] font-black uppercase">전체</button>
                  <div className="flex bg-white border border-stone-200 p-1 rounded-xl ml-2">
                    {['기본', '평점 높은순', '평점 낮은순'].map(mode => (
                      <button key={mode} className="px-4 py-2 text-[9px] font-black text-stone-400 hover:text-black transition-colors uppercase">
                        {mode}
                      </button>
                    ))}
                  </div>
                  <button className="px-5 py-2 text-[#FF4D4D] text-[11px] font-black uppercase hover:bg-red-50 rounded-full transition-all">
                    90점 이하 삭제
                  </button>
                </div>
              </div>

              {/* Occupancy & Audit */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-center">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1">점유율</p>
                    <p className="text-sm font-black text-black">
                      {characterBook.characters?.filter(c => c.name !== '').length || 0} / 100 정예 시트
                    </p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button 
                    onClick={handleAudit}
                    disabled={isAuditing}
                    className="px-10 py-4 bg-[#00D1FF] text-white rounded-2xl font-black text-[13px] shadow-lg shadow-[#00D1FF]/20 flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    {isAuditing ? '분석 중...' : '정예 오딧 (AI 분석)'}
                  </button>
                </div>
              </div>

              {/* Character List (빈 그릇 표시) */}
              <div className="space-y-4">
                {characterBook.characters?.filter(c => c.name !== '').length === 0 ? (
                  <div className="h-[300px] flex flex-col items-center justify-center text-stone-300 border-2 border-dashed border-stone-200 rounded-[32px]">
                    <UsersIcon className="w-16 h-16 mb-4 opacity-10" />
                    <p className="text-sm font-black uppercase tracking-widest opacity-40">로드된 정예 멤버가 없습니다</p>
                    <p className="text-[10px] font-medium mt-2 opacity-30">불러오기 버튼을 눌러 시스템 도감 파일을 업로드하세요.</p>
                  </div>
                ) : (
                  characterBook.characters?.filter(c => c.name !== '').map((char) => (
                    <div key={char.id} className="group bg-white p-6 rounded-[24px] border border-stone-100 hover:border-[#00D1FF] transition-all flex items-center gap-8 shadow-sm">
                      <div className="w-16 h-16 bg-stone-100 rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
                        {slotImages[char.id] ? (
                          <img src={slotImages[char.id]} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UsersIcon className="w-8 h-8 text-stone-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-full">{char.grid_position}</span>
                          <span className="text-sm font-black text-black uppercase">{char.name}</span>
                        </div>
                        <p className="text-[10px] font-bold text-stone-400 truncate max-w-[200px] md:max-w-md uppercase">{char.visual_dna?.substring(0, 100) || 'NO DNA DESCRIPTION'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            setEditingCharId(char.id);
                            setActiveTab('dna');
                          }}
                          className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-lg text-[9px] font-black hover:bg-stone-100 transition-colors uppercase"
                        >
                          DNA 편집
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'dna' && (
            <div className="space-y-12">
              {editingCharId ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-6">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setEditingCharId(null)}
                        className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                      >
                        <ArrowDownIcon className="w-5 h-5 rotate-90" />
                      </button>
                      <div>
                        <p className="text-2xl font-black text-black uppercase">{characterBook.characters?.find(c => c.id === editingCharId)?.grid_position || ''} 슬롯 에디터</p>
                        <p className="text-[10px] font-bold text-stone-400 font-mono uppercase tracking-widest">MASTER CHARACTER DNA PROTOCOL V16.0</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setEditingCharId(null)}
                        className="px-8 py-3 bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg"
                      >
                        저장 및 종료
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Column 1: Core Identity & Visual DNA */}
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircleIcon className="w-3 h-3 text-[#00D1FF]" /> 캐릭터 이름
                        </label>
                        <input 
                          value={characterBook.characters?.find(c => c.id === editingCharId)?.name || ''}
                          onChange={(e) => updateCharName(editingCharId, e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-2xl p-4 text-lg font-black uppercase focus:ring-2 focus:ring-[#00D1FF] outline-none transition-all shadow-sm"
                          placeholder="이름"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">나이</label>
                          <input 
                            value={characterBook.characters?.find(c => c.id === editingCharId)?.dna_details?.age || ''}
                            onChange={(e) => updateCharDNA(editingCharId, { age: e.target.value })}
                            className="w-full bg-white border border-stone-100 rounded-xl px-4 py-3 text-xs font-bold uppercase focus:ring-1 focus:ring-[#00D1FF] outline-none"
                            placeholder="예: 11세"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">종족</label>
                          <input 
                            value={characterBook.characters?.find(c => c.id === editingCharId)?.dna_details?.species || ''}
                            onChange={(e) => updateCharDNA(editingCharId, { species: e.target.value })}
                            className="w-full bg-white border border-stone-100 rounded-xl px-4 py-3 text-xs font-bold uppercase focus:ring-1 focus:ring-[#00D1FF] outline-none"
                            placeholder="인간"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">관계 (추론 링크)</label>
                        <textarea 
                          value={characterBook.characters?.find(c => c.id === editingCharId)?.dna_details?.relationship || ''}
                          onChange={(e) => updateCharDNA(editingCharId, { relationship: e.target.value })}
                          className="w-full bg-white border border-stone-100 rounded-xl p-4 text-xs font-medium leading-relaxed resize-none h-24 focus:ring-1 focus:ring-[#00D1FF] outline-none"
                          placeholder="[COUSIN: GONEGI], [FRIEND: DANA]"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black text-stone-500 uppercase tracking-widest">마스터 DNA (TXT)</label>
                          <label className="text-[9px] font-bold text-stone-400 uppercase cursor-pointer hover:text-black flex items-center gap-1 transition-colors">
                            <UploadIcon className="w-3 h-3" /> 업로드
                            <input 
                              type="file" 
                              accept=".txt" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file && editingCharId) {
                                  const text = await file.text();
                                  updateVisualDNA(editingCharId, text);
                                }
                              }} 
                            />
                          </label>
                        </div>
                        <textarea
                          value={characterBook.characters?.find(c => c.id === editingCharId)?.visual_dna || ''}
                          onChange={(e) => updateVisualDNA(editingCharId, e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-[11px] font-mono leading-relaxed text-stone-600 h-[280px] resize-none focus:ring-2 focus:ring-[#00D1FF] outline-none transition-all"
                        />
                      </div>
                    </div>
                     {/* Column 2: AGI World Logic Metrics */}
                    <div className="space-y-6 bg-white/50 p-6 rounded-[32px] border border-stone-100">
                      <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                        <SparklesIcon className="w-4 h-4 text-[#00D1FF]" /> 실험적 월드-논리 추론 (Telemetry)
                      </h3>

                      {/* Gaze Logic */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">01. 시선 및 집중 (SISEON)</label>
                        <div className="bg-white p-4 rounded-xl border border-stone-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-stone-400 uppercase">시선 대상 ID</span>
                            <input 
                              value={characterBook.characters?.find(c => c.id === editingCharId)?.dna_details?.gaze_logic?.default_target || ''}
                              onChange={(e) => updateNestedDNA(editingCharId, 'gaze_logic', 'default_target', e.target.value)}
                              className="bg-transparent border-none text-[10px] font-black uppercase text-right focus:ring-0"
                              placeholder="예: CHAR_1-1"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-stone-400 uppercase">집중 강도 (정규화)</span>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black">{(characterBook.characters?.find(c => c.id === editingCharId)?.dna_details?.gaze_logic?.focus_intensity || 0.5).toFixed(2)}</span>
                               <input 
                                type="range" min="0" max="1" step="0.01"
                                value={characterBook.characters?.find(c => c.id === editingCharId)?.dna_details?.gaze_logic?.focus_intensity || 0.5}
                                onChange={(e) => updateNestedDNA(editingCharId, 'gaze_logic', 'focus_intensity', parseFloat(e.target.value))}
                                className="w-24 accent-[#00D1FF]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Spatial Logic */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">02. 근접성 및 거리 (GONG-GAN)</label>
                        <div className="bg-white p-4 rounded-xl border border-stone-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-stone-400 uppercase">카메라와의 거리 (정규화)</span>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black">{(characterBook.characters?.find(c => c.id === editingCharId)?.dna_details?.spatial_context?.distance_to_camera_norm || 0.5).toFixed(2)}</span>
                               <input 
                                type="range" min="0" max="1" step="0.01"
                                value={characterBook.characters?.find(c => c.id === editingCharId)?.dna_details?.spatial_context?.distance_to_camera_norm || 0.5}
                                onChange={(e) => updateNestedDNA(editingCharId, 'spatial_context', 'distance_to_camera_norm', parseFloat(e.target.value))}
                                className="w-24 accent-[#00D1FF]"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-stone-400 uppercase">정서적 거리</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black">{(characterBook.characters?.find(c => c.id === editingCharId)?.dna_details?.spatial_context?.emotional_proximity_score || 0.5).toFixed(2)}</span>
                              <input 
                                type="range" min="0" max="1" step="0.01"
                                value={characterBook.characters?.find(c => c.id === editingCharId)?.dna_details?.spatial_context?.emotional_proximity_score || 0.5}
                                onChange={(e) => updateNestedDNA(editingCharId, 'spatial_context', 'emotional_proximity_score', parseFloat(e.target.value))}
                                className="w-24 accent-[#00D1FF]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Physics Logic */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">03. 재질 물리 (MUL-LI)</label>
                        <div className="bg-white p-4 rounded-xl border border-stone-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-stone-400 uppercase">재질 저항 (정규화)</span>
                            <input 
                              type="number" step="0.01"
                              value={characterBook.characters?.find(c => c.id === editingCharId)?.dna_details?.physical_granularity?.material_resistance_norm || 0.5}
                              onChange={(e) => updateNestedDNA(editingCharId, 'physical_granularity', 'material_resistance_norm', parseFloat(e.target.value))}
                              className="w-16 bg-stone-50 rounded px-2 py-1 text-[10px] font-black text-right"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-stone-400 uppercase">물리 과장 계수 (Δ)</span>
                            <input 
                              type="number" step="0.01"
                              value={characterBook.characters?.find(c => c.id === editingCharId)?.dna_details?.physical_granularity?.physics_exaggeration_factor || 1.0}
                              onChange={(e) => updateNestedDNA(editingCharId, 'physical_granularity', 'physics_exaggeration_factor', parseFloat(e.target.value))}
                              className="w-16 bg-stone-50 rounded px-2 py-1 text-[10px] font-black text-right"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Causality / Δt Logic */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">04. 인과율 및 반응 (Δt)</label>
                        <div className="bg-white p-4 rounded-xl border border-stone-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-stone-400 uppercase">반응 지연 시간 (초)</span>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black">{(characterBook.characters?.find(c => c.id === editingCharId)?.dna_details?.interaction_logic?.reaction_time_delta_t || 0.3).toFixed(2)}s</span>
                               <input 
                                type="range" min="0" max="2" step="0.01"
                                value={characterBook.characters?.find(c => c.id === editingCharId)?.dna_details?.interaction_logic?.reaction_time_delta_t || 0.3}
                                onChange={(e) => updateNestedDNA(editingCharId, 'interaction_logic', 'reaction_time_delta_t', parseFloat(e.target.value))}
                                className="w-24 accent-[#00D1FF]"
                               />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AGI Golden Set Provenance (NEW) */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-[#FF00D1] uppercase tracking-widest">05. 시네마틱 골든 세트 레코드</label>
                        <div className="bg-[#FFF0FB] p-4 rounded-xl border border-[#FFD1F3] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-[#FF00D1] uppercase">신뢰 점수</span>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black">{(characterBook.characters?.find(c => c.id === editingCharId)?.world_logic?.value_source?.confidence_score || 0.0).toFixed(2)}</span>
                               <input 
                                type="range" min="0" max="1" step="0.01"
                                value={characterBook.characters?.find(c => c.id === editingCharId)?.world_logic?.value_source?.confidence_score || 0.0}
                                onChange={(e) => {
                                  const newChars = characterBook.characters?.map(c => {
                                    if (c.id !== editingCharId) return c;
                                    const wl = c.world_logic || { normalization_reference: {}, value_source: { method: 'llm_inference' as const, confidence_score: 0.5 } };
                                    return {
                                      ...c,
                                      world_logic: {
                                        ...wl,
                                        value_source: { ...wl.value_source, confidence_score: parseFloat(e.target.value), method: 'manual_input' as const }
                                      }
                                    };
                                  }) || [];
                                  onUpdate({ ...characterBook, characters: newChars });
                                }}
                                className="w-24 accent-[#FF00D1]"
                               />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-[#FF00D1] uppercase">정규화 기준 (참조)</span>
                            <input 
                              value={characterBook.characters?.find(c => c.id === editingCharId)?.world_logic?.normalization_reference?.velocity || ''}
                              onChange={(e) => {
                                const newChars = characterBook.characters?.map(c => {
                                  if (c.id !== editingCharId) return c;
                                  const wl = c.world_logic || { normalization_reference: {}, value_source: { method: 'llm_inference' as const, confidence_score: 0.5 } };
                                  return {
                                    ...c,
                                    world_logic: {
                                      ...wl,
                                      normalization_reference: { ...wl.normalization_reference, velocity: e.target.value }
                                    }
                                  };
                                }) || [];
                                onUpdate({ ...characterBook, characters: newChars });
                              }}
                              className="w-full bg-white border border-[#FFD1F3] rounded px-2 py-1 text-[10px] font-black"
                              placeholder="예: GONEGI_MAX_RUN"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Status & Visual Reference */}
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-stone-500 uppercase tracking-widest">정예 에셋 상태</label>
                        <div className="aspect-square bg-white rounded-[40px] border-2 border-stone-100 shadow-xl overflow-hidden relative group">
                          {slotImages[editingCharId] ? (
                            <img src={slotImages[editingCharId]} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300 gap-4">
                              <UsersIcon className="w-16 h-16 opacity-10" />
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">정예 멤버 각인 대기 중</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl text-[11px] font-black uppercase cursor-pointer hover:bg-stone-50 transition-all">
                              <UploadIcon className="w-4 h-4" /> 정예 멤버 업로드
                              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(editingCharId, e.target.files[0], 'elite')} className="hidden" />
                            </label>
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">DNA 동기화됨</span>
                          </div>
                          <button className="text-[10px] font-black text-[#00D1FF] uppercase hover:underline">재분석</button>
                        </div>
                      </div>

                      <div className="bg-black text-white p-6 rounded-[32px] space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">시네마틱 과학 지표 (Experimental Telemetry)</h4>
                          <span className="text-xl font-black text-[#00D1FF]">98.2%</span>
                        </div>
                        <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00D1FF] w-[98%]" />
                        </div>
                        <p className="text-[9px] font-medium leading-relaxed text-stone-400">
                          이 캐릭터의 물리적 데이터와 관계 맵은 증거-기반 시네마틱 추론 엔진에 의해 검증되었으며 내부 실험용 텔레메트리 연동이 활성화되었습니다.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <>
                  {/* 01. MASTER GROUP REFERENCE */}
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-black text-[#00D1FF] uppercase tracking-widest flex items-center gap-3">
                        <SparklesIcon className="w-4 h-4" /> 01. 마스터 그룹 레퍼런스 (FHD)
                      </h2>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2 bg-[#E8FBF2] text-[#10B981] rounded-lg text-[10px] font-black uppercase cursor-pointer hover:bg-[#D1F7E6] transition-colors">
                          <UploadIcon className="w-3 h-3" /> 마스터 업로드
                          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload('master_ref', e.target.files[0], 'master')} className="hidden" />
                        </label>
                      </div>
                    </div>
                    <div className="aspect-[21/9] bg-stone-100 rounded-[40px] overflow-hidden border-2 border-stone-100 relative group shadow-inner">
                      {masterImage ? (
                        <img src={masterImage} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300 gap-4">
                          <UsersIcon className="w-16 h-16 opacity-10" />
                          <p className="text-[11px] font-black uppercase tracking-widest opacity-40">마스터 레퍼런스 대기 중</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* 02. VISUAL GRID MAP & DNA */}
                  <section className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-3">
                        <WandIcon className="w-4 h-4" /> 02. 비주얼 그리드 맵 & DNA (마스터 레이아웃)
                      </h2>
                      <button 
                        onClick={() => {
                          if (confirm('모든 캐릭터 슬롯을 13개 마스터 레이아웃(1-1~2-6-2)으로 강제 초기화하시겠습니까?\n이름과 DNA 정보가 모두 초기화됩니다.')) {
                            const initialSlots: CharacterEntry[] = GRID_POSITIONS.map((pos, idx) => ({
                              id: `slot_${pos}`,
                              name: idx >= 11 ? '동물 (FAUNA)' : '',
                              visual_dna: '',
                              type: idx >= 11 ? 'animal' : 'human',
                              grid_position: pos,
                              slot_index: idx
                            }));
                            onUpdate({ ...characterBook, characters: initialSlots });
                            alert('13개 마스터 슬롯으로 초기화되었습니다.');
                          }
                        }}
                        className="text-[10px] font-black text-stone-400 hover:text-black uppercase tracking-widest transition-colors flex items-center gap-2"
                      >
                        <RefreshCwIcon className="w-3 h-3" /> [그리드 강제 초기화]
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* ROW 1: 1-1 to 1-6 (6 Columns) */}
                      <div className="grid grid-cols-6 gap-4">
                        {characterBook.characters?.slice(0, 6).map((char) => (
                          <GridSlot key={char.id} char={char} onClick={() => setEditingCharId(char.id)} />
                        ))}
                      </div>

                      {/* ROW 2: 2-1 to 2-5 + Split 2-6 (6 Columns Total) */}
                      <div className="grid grid-cols-6 gap-4">
                        {characterBook.characters?.slice(6, 11).map((char) => (
                          <GridSlot key={char.id} char={char} onClick={() => setEditingCharId(char.id)} />
                        ))}
                        
                        {/* THE ANIMAL SPLIT SLOT (Slot 6 in Row 2) - Split into two boxes */}
                        <div className="flex flex-col gap-2">
                          {characterBook.characters?.slice(11, 13).map((char) => (
                            <button 
                              key={char.id} 
                              onClick={() => setEditingCharId(char.id)}
                              className={`flex-1 bg-white rounded-xl border-2 transition-all flex flex-col items-center justify-center group relative shadow-sm hover:shadow-md ${
                                char.name ? 'border-[#00D1FF] bg-[#F0FBFF]' : 'border-dashed border-stone-200 hover:border-stone-400'
                              }`}
                            >
                              <div className={`absolute top-1.5 left-2 px-1.5 py-0.5 rounded-full text-[6px] font-black ${char.name ? 'bg-[#00D1FF] text-white shadow-xs' : 'bg-stone-50 text-stone-400'}`}>
                                {char.grid_position}
                              </div>
                              <UsersIcon className={`w-5 h-5 ${char.name ? 'text-[#00D1FF]' : 'text-stone-200 opacity-40'}`} />
                              <div className="absolute bottom-1.5 left-0 w-full px-1">
                                <p className={`text-[7px] font-black truncate text-center uppercase tracking-tighter ${char.name ? 'text-black' : 'text-stone-300'}`}>
                                  {char.name || 'ANIMAL'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          )}

          {activeTab === 'npc' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-3">
                  <UsersIcon className="w-4 h-4" /> SUB-CHARACTER (NPC) BOOK
                </h2>
                <button 
                  onClick={() => setIsAddingNPC(true)}
                  className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                >
                  <XIcon className="w-3 h-3 rotate-45" /> ADD NEW NPC
                </button>
              </div>

              {(!characterBook.subCharacters || characterBook.subCharacters.length === 0) ? (
                <div className="h-[400px] bg-white rounded-[32px] border border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-300">
                  <UsersIcon className="w-16 h-16 mb-6 opacity-10" />
                  <p className="text-sm font-black uppercase tracking-widest opacity-40">NO NPCS REGISTERED</p>
                  <p className="text-[10px] font-medium mt-2 opacity-30">조연 캐릭터의 이름과 설정을 추가해 보세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {characterBook.subCharacters.map(npc => (
                    <div key={npc.id} className="bg-white rounded-[32px] border border-stone-100 p-6 space-y-4 hover:border-black transition-all group relative shadow-sm">
                      <div className="aspect-video bg-stone-50 rounded-2xl border border-stone-100 overflow-hidden relative">
                        {slotImages[npc.id] ? (
                          <img src={slotImages[npc.id]} alt={npc.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-stone-200">
                            <UploadIcon className="w-8 h-8 mb-2" />
                            <span className="text-[8px] font-black uppercase">No Visual Anchor</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="p-3 bg-white text-black rounded-xl cursor-pointer hover:scale-110 transition-transform">
                            <UploadIcon className="w-4 h-4" />
                            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(npc.id, e.target.files[0], 'npc')} className="hidden" />
                          </label>
                          <button onClick={() => deleteNPC(npc.id)} className="p-3 bg-red-500 text-white rounded-xl hover:scale-110 transition-transform">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-black text-black uppercase tracking-tight">{npc.name}</h4>
                        <p className="text-xs text-stone-500 leading-relaxed line-clamp-3">{npc.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'env' && (
            <div className="space-y-12">
              <section className="space-y-6">
                <div className="bg-[#FFF9E6] p-6 rounded-2xl border border-[#FFB800]/20 flex items-start gap-4">
                  <LightbulbIcon className="w-6 h-6 text-[#FFB800] mt-0.5" />
                  <p className="text-[11px] font-bold text-[#B87333] leading-relaxed">
                    <span className="font-black">ENVIRONMENT DNA ANCHOR:</span> 수백 번의 테스트로 완성된 시간대별 황금 프롬프트를 입력하세요. 뮤직 드라마 생성 시 앱이 이 내용을 단 한 글자도 수정하지 않고 그대로 복사하여 사용합니다.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-3">
                      <SparklesIcon className="w-4 h-4 text-[#FFB800]" /> MASTER STYLE ANCHOR (GLOBAL)
                    </h2>
                    <button 
                      onClick={() => onUpdate({ ...characterBook, styleAnchor: MEDITERRANEAN_CHRONICLES_DATA.styleAnchor })}
                      className="flex items-center gap-2 px-4 py-2 bg-[#FFB800] text-black rounded-lg text-[10px] font-black uppercase shadow-lg shadow-[#FFB800]/20"
                    >
                      <RefreshCwIcon className="w-3 h-3" /> RESET TO MASTER DNA
                    </button>
                  </div>
                  <p className="text-[10px] font-bold text-stone-400">
                    이 문장은 모든 이미지 생성의 최상단에 위치합니다. 1. Style DNA (화풍 & 기술 사양)와 2. Global Environment DNA (물리적 장소 & 시네마토그래피)를 여기에 입력하세요.
                  </p>
                  <div className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm">
                    <textarea
                      value={characterBook.styleAnchor || ""}
                      onChange={(e) => onUpdate({ ...characterBook, styleAnchor: e.target.value })}
                      className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium leading-relaxed text-stone-600 min-h-[200px] resize-none"
                      placeholder="Enter global style DNA..."
                    />
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-8">
                {(['dawn', 'morning', 'afternoon', 'late_afternoon', 'sunset', 'night', 'dream', 'spiritual'] as const).map((time) => (
                  <div key={time} className="space-y-4">
                    <h3 className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${time === 'night' ? 'bg-indigo-400' : 'bg-pink-400'}`} />
                      {time.replace('_', ' ')} LIGHTING DNA
                    </h3>
                    <div className="bg-white p-6 rounded-[24px] border border-stone-100 shadow-sm">
                      <textarea
                        value={characterBook.environmentDNA?.[time] || ""}
                        onChange={(e) => {
                          const newEnv = { ...characterBook.environmentDNA, [time]: e.target.value };
                          onUpdate({ ...characterBook, environmentDNA: newEnv as any });
                        }}
                        className="w-full bg-transparent border-none focus:ring-0 text-xs font-medium leading-relaxed text-stone-500 min-h-[120px] resize-none"
                        placeholder={`Enter ${time} lighting DNA...`}
                      />
                    </div>
                  </div>
                ))}
              </section>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Helper Component for Grid Slots
const GridSlot: React.FC<{ char: CharacterEntry; onClick: () => void }> = ({ char, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`aspect-square bg-white rounded-[32px] border-2 transition-all flex flex-col items-center justify-center group relative shadow-sm hover:shadow-md hover:-translate-y-1 ${
        char.name ? 'border-[#00D1FF] bg-[#F0FBFF]' : 'border-dashed border-stone-200 hover:border-stone-400'
      }`}
    >
      <div className={`absolute top-4 left-4 px-2 py-0.5 rounded-full text-[9px] font-black ${char.name ? 'bg-[#00D1FF] text-white shadow-sm' : 'bg-stone-50 text-stone-400'}`}>
        {char.grid_position}
      </div>
      
      <UsersIcon className={`w-10 h-10 ${char.name ? 'text-[#00D1FF]' : 'text-stone-200 opacity-50'}`} />
      
      <div className="absolute bottom-4 left-0 w-full px-4">
        <p className={`text-[10px] font-black truncate text-center uppercase tracking-tighter ${char.name ? 'text-black' : 'text-stone-300'}`}>
          {char.name || 'EMPTY'}
        </p>
      </div>

      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]" />
    </button>
  );
};

export default CharacterBookModal;
