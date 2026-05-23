import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Layout, MapPin, Activity, Layers, MessageSquare, LayoutDashboard } from 'lucide-react';
import { LabHeader } from './features/lab/components/LabHeader';
import { LabSidebar } from './features/lab/components/LabSidebar';
import { LabContent } from './features/lab/components/LabContent';
import { LabDashboard } from './features/lab/components/LabDashboard';
import { LabRoadmap } from './features/lab/components/LabRoadmap';
import { useLabState } from './features/lab/hooks/useLabState';
import { APP_VERSION } from './features/lab/constants/lab.constants';

export const CinematicLab: React.FC = () => {
  const {
    isAnalyzing,
    analyzingFileName,
    batchProgress,
    isRefactoring,
    isCurating,
    isLooping,
    isReliableOnly,
    showRoadmap,
    searchQuery,
    results,
    governance,
    selectedResult,
    calibrationBase,
    isCalibrationMode,
    status,
    showDeleteConfirm,
    fileInputRef,
    libraryInputRef,
    setIsReliableOnly,
    setShowRoadmap,
    setSearchQuery,
    setIsCalibrationMode,
    setSelectedResult,
    setShowDeleteConfirm,
    handleFileUpload,
    handleImportLibrary,
    handleRefactorLibrary,
    handleCurate,
    handleClearDB,
    loadLumetScene,
    downloadJSON,
    processDirectorLoop,
    handleCertifyGolden,
    handleGeneratePrompt,
    handleValidateGeneration,
    handleSaveRecipe,
    handleDeleteRecipe,
    handleDatasetLock,
    currentPromptPackage,
    recipes,
    styleBible,
    enableStyleBibleInjection,
    setSelectedGpuEngine,
    selectedGpuEngine,
    setEnableStyleBibleInjection,
    seedingStatus
  } = useLabState();

  const [activeTab, setActiveTab] = useState<'inspector' | 'dashboard'>('inspector');

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden font-sans selection:bg-[#00D1FF] selection:text-black">
      <LabHeader 
        status={status}
        seedingStatus={seedingStatus}
        isLooping={isLooping}
        isAnalyzing={isAnalyzing}
        isRefactoring={isRefactoring}
        batchProgress={batchProgress}
        analyzingFileName={analyzingFileName}
        resultsCount={results.length}
        showDeleteConfirm={showDeleteConfirm}
        isCalibrationMode={isCalibrationMode}
        onImportLibrary={() => libraryInputRef.current?.click()}
        onRefactorLibrary={handleRefactorLibrary}
        onExportLibrary={() => downloadJSON(results)}
        onShowDeleteConfirm={setShowDeleteConfirm}
        onClearDB={handleClearDB}
        onToggleCalibration={() => setIsCalibrationMode(!isCalibrationMode)}
        onNewAnalysis={() => fileInputRef.current?.click()}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {isAnalyzing && batchProgress.total > 0 && (
          <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center">
            <div className="bg-[#111] border border-white/10 p-10 rounded-[32px] w-[540px] shadow-2xl flex flex-col items-center text-center">
               <Activity size={48} className="text-[#00D1FF] animate-spin mb-6" />
               <h2 className="text-xl font-black text-white tracking-widest uppercase mb-2">V53.5C PARALLEL BATCH RUNNING</h2>
               <p className="text-xs text-white/50 mb-8 font-mono h-8">{status}</p>
               
               <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden mb-8">
                 <motion.div 
                   className="h-full bg-[#00D1FF]"
                   initial={{ width: 0 }}
                   animate={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                   transition={{ duration: 0.3 }}
                 />
               </div>
               
               <div className="flex w-full justify-between items-center text-[10px] font-black tracking-widest uppercase">
                 <div className="flex flex-col items-center w-1/3 border-r border-white/5">
                   <span className="text-white/40 mb-1">Completed</span>
                   <span className="text-emerald-400 text-2xl">{batchProgress.current} <span className="text-xs text-white/20">/ {batchProgress.total}</span></span>
                 </div>
                 <div className="flex flex-col items-center w-1/3 border-r border-white/5">
                   <span className="text-white/40 mb-1">Active</span>
                   <span className="text-blue-400 text-2xl">{batchProgress.active}</span>
                 </div>
                 <div className="flex flex-col items-center w-1/3">
                   <span className="text-white/40 mb-1">Failed</span>
                   <span className="text-red-400 text-2xl">{batchProgress.failed}</span>
                 </div>
               </div>
            </div>
          </div>
        )}

        <LabSidebar 
          results={results}
          selectedResult={selectedResult}
          calibrationBase={calibrationBase}
          isCalibrationMode={isCalibrationMode}
          isReliableOnly={isReliableOnly}
          searchQuery={searchQuery}
          onSelectResult={setSelectedResult}
          onLoadLumetScene={loadLumetScene}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleCurate}
          onToggleReliableOnly={() => setIsReliableOnly(!isReliableOnly)}
        />

        <div className="flex-1 overflow-y-auto bg-[#000000] custom-scrollbar p-12">
          {selectedResult ? (
            <div className="space-y-8">
              {/* Dynamic Segmented Tab Controller (Inner subtabs) */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                <div className="flex bg-[#111111]/90 p-1 rounded-2xl border border-white/10">
                  <button 
                    onClick={() => setActiveTab('inspector')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'inspector' ? 'bg-[#00D1FF] text-black shadow-lg shadow-[#00D1FF]/20' : 'text-white/40 hover:text-white'}`}
                  >
                    <Layers size={14} /> DNA Segment Inspector
                  </button>
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-[#EEFF00] text-black shadow-lg shadow-[#EEFF00]/20' : 'text-white/40 hover:text-white'}`}
                  >
                    <LayoutDashboard size={14} /> Merge quality dashboard ({APP_VERSION})
                  </button>
                </div>
                <div className="text-[10px] text-white/30 uppercase font-black tracking-widest font-mono hidden md:block">
                  {activeTab === 'inspector' ? `[${APP_VERSION} SEGMENT_DEPTH_INSIGHT_ACTIVE]` : `[${APP_VERSION} RECONCILIATION_DASHBOARD_LIVE]`}
                </div>
              </div>

              {activeTab === 'inspector' ? (
                <LabContent 
                  selectedResult={selectedResult}
                  results={results}
                  governance={governance}
                  calibrationBase={calibrationBase}
                  isCalibrationMode={isCalibrationMode}
                  isLooping={isLooping}
                  selectedGpuEngine={selectedGpuEngine}
                  onDownloadJSON={downloadJSON}
                  onProcessDirectorLoop={processDirectorLoop}
                  onSetSelectedGpuEngine={setSelectedGpuEngine}
                  onCertifyGolden={handleCertifyGolden}
                  onDatasetLock={handleDatasetLock}
                  onValidateGeneration={handleValidateGeneration}
                  onGeneratePrompt={handleGeneratePrompt}
                  onSaveRecipe={handleSaveRecipe}
                  onDeleteRecipe={handleDeleteRecipe}
                  currentPromptPackage={currentPromptPackage}
                  recipes={recipes}
                  styleBible={styleBible}
                  enableStyleBibleInjection={enableStyleBibleInjection}
                  onToggleStyleBibleInjection={setEnableStyleBibleInjection}
                />
              ) : (
                <LabDashboard 
                  results={results}
                  governance={governance}
                  recipes={recipes}
                  styleBible={styleBible}
                  onSelectResult={setSelectedResult}
                  onSetActiveTab={setActiveTab}
                />
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-1000">
              <div className="w-32 h-32 bg-white/5 rounded-[40px] flex items-center justify-center text-white/10 border border-white/5 shadow-inner">
                <Layout size={64} />
              </div>
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-black italic text-white/40 uppercase tracking-tighter">No Grounded Evidence Found</h3>
                <p className="text-[10px] text-white/20 uppercase font-black tracking-[0.4em]">Please upload cinematic production data to begin world-state grounding</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-10 py-5 bg-white text-black rounded-[24px] font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
              >
                Start Vision Grounding
              </button>
            </div>
          )}
        </div>
      </div>

      <LabRoadmap 
        show={showRoadmap}
        onClose={() => setShowRoadmap(false)}
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        multiple 
        accept="image/*,video/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={libraryInputRef} 
        onChange={handleImportLibrary} 
        multiple 
        accept=".json" 
        className="hidden" 
      />
      
      <div className="fixed bottom-10 right-10 z-[60]">
        <button 
          onClick={() => setShowRoadmap(true)}
          className="w-16 h-16 bg-[#00D1FF] rounded-2xl flex items-center justify-center text-black shadow-[0_0_30px_rgba(0,209,255,0.4)] hover:rotate-12 transition-transform"
        >
          <MapPin size={28} />
        </button>
      </div>
    </div>
  );
};
