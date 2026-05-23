
import React, { useRef, useEffect, useMemo, useDeferredValue, useCallback, memo, forwardRef } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { CinematicExtractionResult } from '../../../../types';
import { useVirtualizer } from '@tanstack/react-virtual';

// ==========================================
// Phase 4: Error Boundary
// ==========================================
type Props = { children: React.ReactNode };
type State = { hasError: boolean };

class ListErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0F0F0F]">
          <span className="text-[10px] text-red-500 font-mono tracking-widest">ERROR: 가상화 목록 렌더링 실패</span>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// Phase 1: LabSidebarItem
// ==========================================
interface LabSidebarItemProps {
  res: CinematicExtractionResult;
  isSelected: boolean;
  isCalibrationMode: boolean;
  isCalibrationBase: boolean;
  index: number;
  style: React.CSSProperties;
  onSelect: (res: CinematicExtractionResult) => void;
}

const LabSidebarItem = memo(forwardRef<HTMLDivElement, LabSidebarItemProps>(
  ({ res, isSelected, isCalibrationMode, isCalibrationBase, index, style, onSelect }, ref) => {
    return (
      <div
        ref={ref}
        data-index={index}
        style={style}
        onClick={() => onSelect(res)}
        role="option"
        aria-selected={isSelected}
        className="outline-none"
      >
        <div
          className={`p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/[0.03] ${isSelected ? 'bg-white/[0.05] border-l-4 border-l-[#00D1FF]' : ''} ${isCalibrationBase && isCalibrationMode ? 'bg-[#FF00D110] border-l-4 border-l-[#FF00D1]' : ''}`}
        >
          <div className="flex items-center justify-between mb-1 text-white">
            <span className="text-[#00D1FF] text-[10px] font-black uppercase truncate">{res.scene_indexing.source_material}</span>
            <span className="text-[8px] font-mono text-white/30 uppercase">{res.scene_indexing.director_family}</span>
          </div>
          <div className="text-[11px] font-black text-white/80 line-clamp-1">
            {res.layers?.raw_semantic?.visual_description || "의도 분석 정보가 없습니다."}
          </div>
        </div>
      </div>
    );
  }
));

LabSidebarItem.displayName = 'LabSidebarItem';

interface LabSidebarProps {
  results: CinematicExtractionResult[];
  selectedResult: CinematicExtractionResult | null;
  calibrationBase: CinematicExtractionResult | null;
  isCalibrationMode: boolean;
  isReliableOnly: boolean;
  searchQuery: string;
  onSelectResult: (res: CinematicExtractionResult) => void;
  onLoadLumetScene: () => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onToggleReliableOnly: () => void;
}

export const LabSidebar: React.FC<LabSidebarProps> = ({
  results,
  selectedResult,
  calibrationBase,
  isCalibrationMode,
  isReliableOnly,
  searchQuery,
  onSelectResult,
  onLoadLumetScene,
  onSearchChange,
  onSearchSubmit,
  onToggleReliableOnly
}) => {
  // Phase 4: useDeferredValue for optimized search typing
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredResults = useMemo(() => {
    return results.filter(res => {
      if (isReliableOnly && !res.production_v82?.agi_asset_readiness?.is_long_term_accumulable) return false;
      if (deferredSearchQuery) {
        const query = deferredSearchQuery.toLowerCase();
        const titleMatch = res.scene_indexing.source_material.toLowerCase().includes(query);
        const descMatch = res.layers?.raw_semantic?.visual_description?.toLowerCase().includes(query) || false;
        if (!titleMatch && !descMatch) return false;
      }
      return true;
    });
  }, [results, isReliableOnly, deferredSearchQuery]);

  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: filteredResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  // Phase 2: Selection Persistence & Auto scrollToIndex(0) on filter reset
  useEffect(() => {
    if (filteredResults.length > 0) {
      if (selectedResult) {
        const index = filteredResults.findIndex(r => r.id === selectedResult.id);
        if (index === -1) {
          onSelectResult(filteredResults[0]);
          setTimeout(() => virtualizer.scrollToIndex(0, { align: 'start' }), 0);
        }
      } else {
        // Initial setup when no selection exists
        onSelectResult(filteredResults[0]);
      }
    }
  }, [filteredResults, selectedResult, onSelectResult, virtualizer]);

  // Phase 2: Auto Scroll to current selected item
  useEffect(() => {
    if (selectedResult) {
      const index = filteredResults.findIndex(r => r.id === selectedResult.id);
      if (index !== -1) {
        virtualizer.scrollToIndex(index, { align: 'auto' });
      }
    }
  }, [selectedResult, virtualizer, filteredResults]);

  // Phase 3: Keyboard Navigation & Shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!filteredResults.length) return;
    
    let currentIndex = filteredResults.findIndex(r => r.id === selectedResult?.id);
    if (currentIndex === -1) currentIndex = 0;
    
    let nextIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowDown':
        nextIndex = Math.min(currentIndex + 1, filteredResults.length - 1);
        e.preventDefault();
        break;
      case 'ArrowUp':
        nextIndex = Math.max(currentIndex - 1, 0);
        e.preventDefault();
        break;
      case 'PageDown':
        nextIndex = Math.min(currentIndex + 10, filteredResults.length - 1);
        e.preventDefault();
        break;
      case 'PageUp':
        nextIndex = Math.max(currentIndex - 10, 0);
        e.preventDefault();
        break;
      case 'Home':
        nextIndex = 0;
        e.preventDefault();
        break;
      case 'End':
        nextIndex = filteredResults.length - 1;
        e.preventDefault();
        break;
      default:
        return;
    }
    
    if (nextIndex !== currentIndex) {
      onSelectResult(filteredResults[nextIndex]);
      virtualizer.scrollToIndex(nextIndex, { align: 'auto' });
    }
  }, [filteredResults, selectedResult, onSelectResult, virtualizer]);

  return (
    <div className="w-80 border-r border-white/5 bg-[#0F0F0F] flex flex-col shrink-0">
      <div className="p-4 bg-amber-500/5 border-b border-white/5">
         <button 
            onClick={onLoadLumetScene}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
         >
            <Sparkles size={14} />
            골드 스탠다드 로드
         </button>
      </div>
      <div className="p-4 bg-white/[0.03] border-b border-white/5 space-y-3">
         <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
              placeholder="연출 의도를 검색하세요..."
              className="w-full bg-black border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-black focus:outline-none focus:border-[#00D1FF] text-white"
            />
         </div>
         <div className="flex items-center justify-between px-1">
           <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Grounded Measured Only</span>
           <button 
             onClick={onToggleReliableOnly}
             className={`w-8 h-4 rounded-full transition-all relative ${isReliableOnly ? 'bg-cyan-500' : 'bg-white/10'}`}
           >
             <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isReliableOnly ? 'left-4.5' : 'left-0.5'}`} />
           </button>
         </div>
      </div>
      
      {/* Sticky Summary Header */}
      <div className="px-4 py-2 border-b border-white/5 bg-black/50 sticky top-0 z-10 flex justify-between items-center text-[10px] font-mono text-white/60">
        <span>TOTAL NODES:</span>
        <span className="text-[#00D1FF] font-black">{filteredResults.length}</span>
      </div>

      <ListErrorBoundary>
        {filteredResults.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/30 overflow-hidden">
            <Sparkles className="w-8 h-8 mb-3 opacity-20" />
            <span className="text-[11px] font-medium text-white/60">검색 결과가 없습니다.</span>
            <span className="text-[9px] mt-1 text-white/40">필터나 검색어를 변경해보세요.</span>
          </div>
        ) : (
          <div 
            ref={parentRef} 
            tabIndex={0} 
            role="listbox"
            aria-label="추출 결과 목록"
            onKeyDown={handleKeyDown}
            className="flex-1 overflow-y-auto custom-scrollbar relative focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#00D1FF]/30"
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const res = filteredResults[virtualItem.index];
                return (
                  <LabSidebarItem
                    key={virtualItem.key}
                    ref={virtualizer.measureElement}
                    index={virtualItem.index}
                    res={res}
                    isSelected={selectedResult?.id === res.id}
                    isCalibrationMode={isCalibrationMode}
                    isCalibrationBase={calibrationBase?.id === res.id}
                    onSelect={onSelectResult}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </ListErrorBoundary>
    </div>
  );
};
