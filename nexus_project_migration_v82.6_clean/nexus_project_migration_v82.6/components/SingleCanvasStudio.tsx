import React, { useCallback, useMemo, useState } from 'react';
import type { CharacterBook } from '../types';
import { buildSingleCanvasControlledGeneration } from '../services/singleCanvasControlledGeneration';
import { refineControlledPrompt, generateImageFromText } from '../services/geminiService';
import { initialMetaConfigs, profileConfigs } from '../data/jsonData';
import { forceResizeToHD } from '../utils/imageProcessor';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  LoadingSpinner,
  SparklesIcon,
  WandIcon,
} from './IconComponents';

const DEFAULT_CONTROLLED_PROMPT =
  'Gonegi and Dana walk along the harbor terrace at golden hour, side by side, hopeful forward motion.';

interface SingleCanvasStudioProps {
  characterBook: CharacterBook;
}

const SingleCanvasStudio: React.FC<SingleCanvasStudioProps> = ({ characterBook }) => {
  const [controlledPrompt, setControlledPrompt] = useState(DEFAULT_CONTROLLED_PROMPT);
  const [isRefining, setIsRefining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [refinedPrompt, setRefinedPrompt] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pipeline = useMemo(
    () =>
      buildSingleCanvasControlledGeneration({
        controlledPrompt,
        characterBook,
        refinedPrompt: refinedPrompt ?? undefined,
      }),
    [controlledPrompt, characterBook, refinedPrompt]
  );

  const handleRefine = useCallback(async () => {
    if (pipeline.readiness !== 'READY') {
      setError(pipeline.blocked_reason ?? 'Identity refs not ready');
      return;
    }
    setIsRefining(true);
    setError(null);
    try {
      const refined = await refineControlledPrompt(
        controlledPrompt,
        pipeline.bridged_prompt
      );
      setRefinedPrompt(refined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refinement failed');
    } finally {
      setIsRefining(false);
    }
  }, [controlledPrompt, pipeline]);

  const handleGenerate = useCallback(async () => {
    const result = buildSingleCanvasControlledGeneration({
      controlledPrompt,
      characterBook,
      refinedPrompt: refinedPrompt ?? undefined,
    });

    if (result.readiness !== 'READY' || !result.bridged_prompt) {
      setError(result.blocked_reason ?? 'NOT_READY: elite identity refs required');
      return;
    }

    const profile = profileConfigs.find((p) => p.scene === 'outdoor') ?? profileConfigs[0];
    if (!profile) {
      setError('No style profile available');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const sceneText = result.refined_prompt ?? controlledPrompt;
      const promptPayload = {
        subject: sceneText,
        composition: 'cinematic wide shot, identity-stable framing',
        atmosphere: characterBook.environmentDNA?.afternoon ?? 'warm harbor afternoon',
        style: result.bridged_prompt,
      };

      const { base64Image } = await generateImageFromText(
        promptPayload,
        profile,
        initialMetaConfigs,
        characterBook
      );
      const imageUrl = `data:image/png;base64,${base64Image}`;
      const finalImage = await forceResizeToHD(imageUrl, 1920, 1080);
      setGeneratedImage(finalImage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [controlledPrompt, characterBook, refinedPrompt]);

  return (
    <div className="space-y-6">
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-overlay">
        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 mb-2">
          <SparklesIcon className="w-5 h-5 text-primary" />
          SingleCanvas Controlled Generation
        </h2>
        <p className="text-xs text-muted font-bold mb-4">
          PHASE-33C — Music Drama identity path via PromptBridge (Gonegi / Dana name lock)
        </p>
        <textarea
          value={controlledPrompt}
          onChange={(e) => {
            setControlledPrompt(e.target.value);
            setRefinedPrompt(null);
          }}
          rows={4}
          className="w-full p-4 border border-overlay rounded-xl bg-stone-50 text-sm font-mono"
          placeholder="Controlled prompt with Gonegi and Dana..."
        />
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            type="button"
            onClick={handleRefine}
            disabled={isRefining || pipeline.readiness !== 'READY'}
            className="px-4 py-2 bg-overlay font-black text-xs uppercase rounded-xl disabled:opacity-50"
          >
            {isRefining ? <LoadingSpinner /> : 'Gemini Refine (name-locked)'}
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || pipeline.readiness !== 'READY'}
            className="px-5 py-2 bg-primary text-white font-black text-xs uppercase rounded-xl flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <LoadingSpinner /> : <WandIcon className="w-4 h-4" />}
            Generate One Image
          </button>
        </div>
        {pipeline.readiness === 'NOT_READY' && (
          <p className="mt-3 text-sm text-red-600 font-bold flex items-center gap-2">
            <AlertCircleIcon className="w-4 h-4" />
            NOT_READY — {pipeline.blocked_reason}
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-600 font-bold">{error}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-stone-900 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] overflow-auto max-h-[420px]">
          <p className="text-white/60 mb-2 font-black uppercase">Identity Debug</p>
          <pre>{JSON.stringify(pipeline.debug, null, 2)}</pre>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-overlay min-h-[280px]">
          {pipeline.readiness === 'READY' && (
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 mb-2">
              <CheckCircleIcon className="w-4 h-4" /> READY — PromptBridge active
            </p>
          )}
          {refinedPrompt && (
            <p className="text-xs text-muted mb-2">
              <span className="font-black">Refined:</span> {refinedPrompt}
            </p>
          )}
          {generatedImage ? (
            <img src={generatedImage} alt="Single canvas result" className="w-full rounded-xl" />
          ) : (
            <div className="flex items-center justify-center h-48 text-muted text-xs font-black uppercase">
              Preview after generation
            </div>
          )}
        </div>
      </div>

      {pipeline.bridged_prompt && (
        <details className="bg-stone-50 p-4 rounded-2xl border border-overlay">
          <summary className="text-xs font-black uppercase cursor-pointer">Bridged Prompt</summary>
          <pre className="mt-3 text-[10px] whitespace-pre-wrap font-mono">{pipeline.bridged_prompt}</pre>
        </details>
      )}
    </div>
  );
};

export default SingleCanvasStudio;
