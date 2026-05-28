import type express from 'express';

export const CINEMATIC_ROUTE_REGISTRY_VERSION = 'PHASE-33D-v1' as const;

/** Routes that must be registered after every dev:reset / server restart. */
export const REQUIRED_CINEMATIC_ROUTES = [
  '/api/cinematic/routes-preview',
  '/api/cinematic/single-canvas-identity-preview',
] as const;

export type RequiredCinematicRoute = (typeof REQUIRED_CINEMATIC_ROUTES)[number];

/** HTTP self-check targets (GET → expect 200). */
export const DEV_RESET_VERIFY_ROUTES = [
  '/api/cinematic/routes-preview',
  '/api/cinematic/single-canvas-identity-preview',
] as const;

function normalizeRoutePath(path: string): string {
  if (path === '/') return path;
  return path.replace(/\/+$/, '') || path;
}

/**
 * Introspect Express router stack for registered GET /api/cinematic/* paths.
 */
type ExpressRouterLike = { stack?: unknown[] };

function resolveAppRouter(app: express.Application): ExpressRouterLike | undefined {
  const extended = app as express.Application & {
    router?: ExpressRouterLike;
    _router?: ExpressRouterLike;
  };
  return extended.router ?? extended._router;
}

export function collectCinematicGetRoutes(app: express.Application): string[] {
  const found = new Set<string>();
  const root = resolveAppRouter(app);
  const stack = root?.stack ?? [];

  const visit = (layers: unknown[]): void => {
    for (const layer of layers) {
      if (!layer || typeof layer !== 'object') continue;
      const entry = layer as {
        route?: { path?: string | string[] | RegExp; methods?: Record<string, boolean> };
        handle?: { stack?: unknown[] };
        name?: string;
      };

      if (entry.route?.path && entry.route.methods?.get) {
        const raw = entry.route.path;
        const paths =
          typeof raw === 'string'
            ? [raw]
            : Array.isArray(raw)
              ? raw.filter((p): p is string => typeof p === 'string')
              : [];
        for (const p of paths) {
          const normalized = normalizeRoutePath(p);
          if (normalized.startsWith('/api/cinematic')) {
            found.add(normalized);
          }
        }
      }

      if (entry.handle?.stack) {
        visit(entry.handle.stack);
      }
    }
  };

  visit(stack);
  return [...found].sort();
}

export function buildCinematicRoutesPreview(app: express.Application) {
  const routes = collectCinematicGetRoutes(app);
  const missing_required = REQUIRED_CINEMATIC_ROUTES.filter((path) => !routes.includes(path));

  return {
    phase: 'PHASE-33D',
    registry_version: CINEMATIC_ROUTE_REGISTRY_VERSION,
    count: routes.length,
    routes,
    route_names: routes.map((route) => route.replace('/api/cinematic/', '')),
    required_routes: [...REQUIRED_CINEMATIC_ROUTES],
    missing_required_routes: missing_required,
    has_single_canvas_identity_preview: routes.includes(
      '/api/cinematic/single-canvas-identity-preview'
    ),
    has_routes_preview: routes.includes('/api/cinematic/routes-preview'),
    registration_complete: missing_required.length === 0,
    generated_at: new Date().toISOString(),
  };
}

export function logCinematicRoutesOnStartup(app: express.Application): void {
  const preview = buildCinematicRoutesPreview(app);
  console.log(`[CINEMATIC ROUTES] registered ${preview.count} GET route(s)`);
  for (const route of preview.routes) {
    console.log(`  ${route}`);
  }
  if (preview.missing_required_routes.length > 0) {
    console.error(
      `[CINEMATIC ROUTES] MISSING required route(s): ${preview.missing_required_routes.join(', ')}`
    );
  }
}

export async function verifyDevResetCinematicRoutes(
  port: number,
  host = '127.0.0.1'
): Promise<{
  ok: boolean;
  results: Array<{ path: string; status: number; ok: boolean }>;
}> {
  const results: Array<{ path: string; status: number; ok: boolean }> = [];

  for (const routePath of DEV_RESET_VERIFY_ROUTES) {
    const url = `http://${host}:${port}${routePath}`;
    let status = 0;
    try {
      const response = await fetch(url, { method: 'GET' });
      status = response.status;
    } catch {
      status = 0;
    }
    results.push({ path: routePath, status, ok: status === 200 });
  }

  return { ok: results.every((r) => r.ok), results };
}
