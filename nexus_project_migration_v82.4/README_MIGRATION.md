# NEXUS OS v82.4 Production Migration Guide

## Project Purpose
NEXUS OS is an autonomous, high-fidelity cinematic production asset registry and director simulation workspace. It validates, archives, and optimizes cinematic DNA sequences (layouts, camera states, lighting geometries, emotional narratives, relative scales, and temporal bridges), translating them into multi-engine prompt protocols for AI image/video engines (Midjourney, Flux, SDXL, Kling, Runway).

### Entry Points
*   **Backend Entry Point**: `backend entry = server.ts` (Dynamic Express server handles proxying, live exports, and schema calibrations)
*   **Frontend Entry Point**: `index.tsx` + `App.tsx` (Single Page Application rendering the production command suites. Note: This project uses root-level `index.tsx`, not `src/main.tsx`.)

---

## AI Production & Dataset Pipelines (v82.4 / EXPORT-v82.4)

### A. Primary Production Workflow (End-to-End Pipeline)
This pipeline structures raw asset data into broadcast-quality music dramas and cohesive visual stories:
$$\text{Video Analysis} \rightarrow \text{Dataset Generation} \rightarrow \text{Image App Upload} \rightarrow \text{Image Generation} \rightarrow \text{Video App Upload} \rightarrow \text{GPU Video Generation} \rightarrow \text{Music Drama Production}$$

1.  **Video Analysis**: Feeds in scene recordings, measuring camera vectors, lighting gradients, and motion pacing.
2.  **Dataset Generation**: Unifies telemetry data into structured `CanonicalDNA` datasets with authoritative consistency metrics.
3.  **Image App Upload / Handoff**: Transfers lightweight cinematic frames and character-locked identity prompts to the web tool.
4.  **Image Generation**: Produces stable visual assets maintaining clothing and facial identity locked under fine-grained RGB thresholds.
5.  **Video App Upload**: Curates the generated imagery into the active narrative storyboard sequence.
6.  **GPU Video Generation**: Binds motion curves and fluid tracking transitions, generating sequence clips via GPU-bound rendering pipelines.
7.  **Music Drama Production**: Stitches and synchronizes clips under music and dialogue tracks to finalize high-fidelity cinematic outputs.

### B. Secondary Long-Term Archive Workflow (AGI Training Vault)
$$\text{Generated Video + JSON} \rightarrow \text{AGI Reusable Cinematic Dataset Archive}$$
Ensures that all synthesized cinematic segments coupled with their structured parameters are recorded into an AGI-reusable cinematic dataset archive, preserving artistic and layout DNA for future self-improving training runs.

---

## Workspace Setup & Local Continuation Commands

Execute these standard commands inside your local terminal of choice (e.g., Cursor IDE terminal):

### 1. Install Dependencies
```bash
npm install
```

### 2. Standalone Development Mode
```bash
npm run dev
```

### 3. Production Compilation Bundle
```bash
npm run build
```

---

## Main Software Architecture
*   **Client-Side Suite (React 19 + Vite 6)**: Highly interactive dashboard allowing detailed tracking of character persistence, emotional continuity, ambient scenes, and sequence beats.
*   **DNA Processor (`components/features/lab/services/dnaProcessor.ts`)**: Normalizes footages, spatial ratios, and gaze vectors into a stable grounded schema under `CanonicalDNA`.
*   **Engine Adapter (`components/features/lab/services/engineAdapterService.ts`)**: Generates optimized cinematic prompt syntax calibrated for leading text-to-image/video model parameters.
*   **Validation Engine (`components/features/lab/services/validationService.ts`)**: Automatically calculates visual fidelity, structural continuity scores, and checks exposure metrics.

---

## Empty Files Audit & Successful Stabilization
Legacy empty stubs have been fully resolved with active TypeScript and CommonJS configurations under version `v82.4`:
*   `assets/goldenSetImages.ts`: Holds the unified dataset of baseline reference images, exposure ratios, and gaze indicators.
*   `components/features/lab/scripts/apply_v62.cjs`: A legacy schema patching mechanism upgrading v61 datasets to v62 specifications.
*   `services/jobSimulator.ts`: Implements state tracker simulations for active rendering queues and background pipeline actions.
*   `services/qualityService.ts`: Evaluates frames against target thresholds (luminance, gaze drift, jitter ratios), providing diagnostic alerts.

---

## Cursor Seamless Next-Step Steps
1.  **Install Node Modules**: Execute `npm install` in your terminal to hydrate libraries.
2.  **Verify Server Startup**: Run `npm run dev` in your Cursor console; standard environment variables will mount.
3.  **Direct Code Continuation**: Review the `/types.ts` file to see the structural type contracts. You can modify layout structures in `LabContent.tsx` or expand API routes in `server.ts` directly.
4.  **Production Compilation**: Ensure `npm run build` completes cleanly inside your local filesystem prior to committing or deploying modifications.

