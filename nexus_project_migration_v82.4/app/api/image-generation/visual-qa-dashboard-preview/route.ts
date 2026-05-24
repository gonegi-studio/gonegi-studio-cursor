/** Phase-29A: visual QA dashboard preview API route — deterministic fixture-backed GET handler */

import type { Express, Request, Response } from "express";
import { runWithRuntimeReadonlyGuard } from "../../../../services/runtime/runtime-guard.ts";
import {
  serializeVisualQaDashboardPreviewRoute,
  type VisualQaDashboardPreviewRoute,
} from "../../../../services/image-generation/visual-qa-dashboard-preview-route.ts";
import { VISUAL_QA_DASHBOARD_PREVIEW_ROUTE_FIXTURE_SNAPSHOT } from "./route.fixtures.ts";

export const VISUAL_QA_DASHBOARD_PREVIEW_API_PATH = "/api/image-generation/visual-qa-dashboard-preview";

export function buildVisualQaDashboardPreviewApiPayload(): VisualQaDashboardPreviewRoute {
  return runWithRuntimeReadonlyGuard(() => VISUAL_QA_DASHBOARD_PREVIEW_ROUTE_FIXTURE_SNAPSHOT);
}

export function serializeVisualQaDashboardPreviewApiResponse(): string {
  return serializeVisualQaDashboardPreviewRoute(buildVisualQaDashboardPreviewApiPayload());
}

export function handleVisualQaDashboardPreviewGet(_req: Request, res: Response): void {
  try {
    const body = serializeVisualQaDashboardPreviewApiResponse();
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(body);
  } catch (error) {
    console.error("Visual QA Dashboard Preview Error:", error);
    res.status(500).json({ error: "Failed to build visual QA dashboard preview" });
  }
}

export function registerVisualQaDashboardPreviewRoute(app: Express): void {
  app.get(VISUAL_QA_DASHBOARD_PREVIEW_API_PATH, handleVisualQaDashboardPreviewGet);
}
