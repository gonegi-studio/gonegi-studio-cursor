import type { Express } from "express";

export const API_NOT_FOUND_RESPONSE: Readonly<{ error: string }> = Object.freeze({
  error: "API endpoint not found",
});

export function registerApiBoundaryGuard(app: Express) {
  app.use("/api", (_req, res) => {
    res.status(404).json(API_NOT_FOUND_RESPONSE);
  });
}
