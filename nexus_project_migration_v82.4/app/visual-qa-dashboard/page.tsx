import React, { useEffect, useState } from "react";
import type { VisualQaDashboardPreviewRoute } from "../../services/image-generation/visual-qa-dashboard-preview-route.ts";
import { VisualQaDashboardShell } from "./dashboard-shell.tsx";

const PREVIEW_API_PATH = "/api/image-generation/visual-qa-dashboard-preview";

export default function VisualQaDashboardPage() {
  const [payload, setPayload] = useState<VisualQaDashboardPreviewRoute | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreviewPayload() {
      try {
        const response = await fetch(PREVIEW_API_PATH);
        if (!response.ok) {
          throw new Error(`preview request failed: ${response.status}`);
        }
        const data = (await response.json()) as VisualQaDashboardPreviewRoute;
        if (!cancelled) {
          setPayload(Object.freeze(data));
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "preview request failed");
        }
      }
    }

    void loadPreviewPayload();

    return () => {
      cancelled = true;
    };
  }, []);

  if (errorMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-6" data-page="visual-qa-dashboard">
        <p className="rounded-2xl border border-red-200 bg-white px-6 py-4 text-sm font-bold text-red-700">
          {errorMessage}
        </p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-6" data-page="visual-qa-dashboard">
        <p className="text-sm font-bold uppercase tracking-widest text-stone-500">Loading Visual QA Dashboard...</p>
      </div>
    );
  }

  return <VisualQaDashboardShell payload={payload} />;
}
